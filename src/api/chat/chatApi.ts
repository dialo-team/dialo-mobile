import { pickBestDisplayName } from "@/src/utils/displayUser";
import axios, { AxiosRequestConfig } from "axios";
import { getAccessToken } from "../auth/authStorage";
import {
    ChatConversationDetail,
    ChatConversationItem,
    ChatUserProfile,
    ForwardMessagePayload,
    SendMessagePayload,
} from "./types";

const CHAT_BASE_URL = "http://14.225.254.174:8085";

const chatClient = axios.create({
    baseURL: CHAT_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

const decodeJwtSub = (token?: string | null) => {
    if (!token) return "";
    try {
        const payload = token.split(".")[1];
        if (!payload) return "";
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
        const decodeBase64 =
            typeof globalThis.atob === "function"
                ? globalThis.atob.bind(globalThis)
                : null;
        if (!decodeBase64) return "";
        const json = decodeURIComponent(
            decodeBase64(padded)
                .split("")
                .map(
                    (char) =>
                        `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`,
                )
                .join(""),
        );
        const parsed = JSON.parse(json);
        return parsed?.sub || "";
    } catch {
        return "";
    }
};

chatClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await Promise.race([
                getAccessToken(),
                new Promise<string | null>((resolve) =>
                    setTimeout(() => resolve(null), 5000),
                ),
            ]);
            const userId = decodeJwtSub(token);

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (userId) {
                config.headers["X-User-Id"] = userId;
            }

            return config;
        } catch (error) {
            console.error("[chatClient] request interceptor error:", error);
            return config;
        }
    },
    (error) => Promise.reject(error),
);

chatClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error?.message;

        // Detect and handle CORS errors
        if (error?.message === "Network Error" && !error?.response) {
            console.error("[chatClient] CORS or Network Error detected");
            console.error("[chatClient] Attempted URL:", error?.config?.url);
            console.error(
                "[chatClient] Origin:",
                typeof window !== "undefined" ? window.location.origin : "N/A",
            );

            if (
                typeof window !== "undefined" &&
                error?.message === "Network Error"
            ) {
                console.warn(
                    "[chatClient] CORS-like error - ensure backend has CORS headers configured for localhost",
                );
                console.warn(
                    "[chatClient] Consider testing on physical device via Expo Go instead of web",
                );
            }
        }

        console.error("[chatClient] response error:", {
            status,
            message,
            url: error?.config?.url,
        });
        return Promise.reject(error);
    },
);

const unwrapData = <T>(value: any): T => {
    if (value && typeof value === "object" && "data" in value) {
        return value.data as T;
    }
    return value as T;
};

function collectNestedStringValues(
    value: any,
    keyPattern: RegExp,
    depth = 0,
    seen = new WeakSet<object>(),
): string[] {
    if (!value || typeof value !== "object" || depth > 3) return [];
    if (seen.has(value)) return [];
    seen.add(value);

    const results: string[] = [];
    for (const [key, nestedValue] of Object.entries(value)) {
        if (typeof nestedValue === "string" && keyPattern.test(key)) {
            results.push(nestedValue);
        } else if (nestedValue && typeof nestedValue === "object") {
            results.push(
                ...collectNestedStringValues(
                    nestedValue,
                    keyPattern,
                    depth + 1,
                    seen,
                ),
            );
        }
    }

    return results;
}

const normalizeConversationIdentity = <T extends Record<string, any>>(
    value: T,
): T => {
    const counterpartId =
        value?.counterpartId || value?.targetUserId || value?.userId || "";

    const nameCandidates = [
        value?.remarkName,
        value?.counterpartName,
        value?.counterpartUserName,
        value?.counterpartDisplayName,
        value?.displayName,
        value?.userName,
        value?.username,
        value?.nickName,
        value?.nickname,
        value?.name,
        value?.fullName,
        ...collectNestedStringValues(value, /(name|display|full|nick)/i),
    ];

    const counterpartName = pickBestDisplayName(nameCandidates, "Nguoi dung");

    const counterpartAvatarUrl =
        value?.counterpartAvatarUrl ||
        value?.counterpartAvatar ||
        value?.profilePictureUrl ||
        value?.profilePicture ||
        value?.photoUrl ||
        value?.imageUrl ||
        value?.avatarUrl ||
        value?.avatarURL ||
        value?.avatar ||
        collectNestedStringValues(
            value,
            /(avatar|photo|image|profilepicture)/i,
        )[0] ||
        "";

    return {
        ...value,
        counterpartId,
        counterpartName,
        counterpartAvatarUrl,
    } as T;
};

const request = async <T>(
    path: string,
    config?: AxiosRequestConfig,
): Promise<T> => {
    try {
        const token = await getAccessToken();
        if (!token) {
            throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        }

        console.log(`[chatApi] Making request to ${path}`, {
            method: config?.method || "GET",
            baseURL: CHAT_BASE_URL,
            payload: config?.data,
        });
        const response = await chatClient.request({
            url: path,
            ...config,
        });
        console.log(`[chatApi] ${path} success`, {
            status: response.status,
            data: response.data,
        });
        return unwrapData<T>(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        const message =
            data?.message ||
            error?.message ||
            `Request failed with status code ${status}`;

        // Enhanced error logging for debugging
        console.error(`[chatApi] ${path} error:`, {
            message,
            status,
            data,
            url: error?.config?.url,
            method: error?.config?.method,
            payload: error?.config?.data,
            isCORSError: !error?.response && error?.code === "ERR_NETWORK",
        });

        // Provide user-friendly error messages
        if (!error?.response && error?.message === "Network Error") {
            throw new Error(
                "Network error - check if backend is reachable. For web testing, ensure CORS is enabled or test on physical device.",
            );
        }

        const apiError: any = new Error(message);
        apiError.response = error?.response;
        apiError.config = error?.config;
        throw apiError;
    }
};

export const chatApi = {
    // conversation-controller
    getConversations: async (): Promise<ChatConversationItem[]> => {
        const data = await request<any[]>("/api/v1/conversations");
        return Array.isArray(data)
            ? data.map((item) => normalizeConversationIdentity(item))
            : [];
    },

    findConversationIdByUserId: async (
        userId: string,
    ): Promise<string | null> => {
        if (!userId?.trim()) return null;

        const conversations = await chatApi.getConversations();
        const matched = conversations.find((conversation) => {
            const counterpartId =
                conversation?.counterpartId ||
                conversation?.targetUserId ||
                conversation?.userId ||
                "";

            return String(counterpartId) === String(userId);
        });

        return matched?.conversationId || null;
    },

    getConversationDetail: async (
        conversationId: string,
    ): Promise<ChatConversationDetail> => {
        const detail = await request<any>(
            `/api/v1/conversations/${conversationId}`,
        );

        const normalized = normalizeConversationIdentity(detail || {});

        return {
            ...normalized,
            conversationId: normalized?.conversationId || conversationId,
            messages: Array.isArray(detail?.messages) ? detail.messages : [],
        };
    },

    updateRemark: async (conversationId: string, remarkName: string) => {
        return request(`/api/v1/conversations/${conversationId}/remark`, {
            method: "PUT",
            data: { remarkName },
        });
    },

    markRead: async (conversationId: string) => {
        return request(`/api/v1/conversations/${conversationId}/read`, {
            method: "PUT",
        });
    },

    clearHistory: async (conversationId: string) => {
        return request(
            `/api/v1/conversations/${conversationId}/clear-history`,
            {
                method: "POST",
            },
        );
    },

    searchInConversation: async (conversationId: string, keyword: string) => {
        return request(`/api/v1/conversations/${conversationId}/search`, {
            method: "GET",
            params: { keyword },
        });
    },

    getConversationMedia: async (conversationId: string) => {
        return request(`/api/v1/conversations/${conversationId}/media`, {
            method: "GET",
        });
    },

    // user-profile-controller
    upsertUserProfile: async (payload: ChatUserProfile) => {
        return request<ChatUserProfile>("/api/v1/users", {
            method: "POST",
            data: payload,
        });
    },

    getUserProfile: async (userId: string): Promise<ChatUserProfile> => {
        return request<ChatUserProfile>(`/api/v1/users/${userId}`);
    },

    // message-controller
    // message-controller
    sendMessage: async (payload: SendMessagePayload) => {
        const token = await getAccessToken();
        const senderId = payload.senderId || decodeJwtSub(token);

        if (!payload.conversationId?.trim()) {
            throw new Error("Thiếu conversationId khi gửi tin nhắn");
        }

        if (!senderId?.trim()) {
            throw new Error(
                "Không xác định được senderId. Vui lòng đăng nhập lại.",
            );
        }

        const normalizedPayload = {
            conversationId: payload.conversationId.trim(),
            senderId,
            type: payload.type || "TEXT",
            content: payload.content || "",
        };

        return request("/api/v1/messages", {
            method: "POST",
            data: normalizedPayload,
        });
    },

    revokeMessage: async (messageId: string) => {
        return request(`/api/v1/messages/${messageId}/revoke`, {
            method: "POST",
        });
    },

    forwardMessage: async (payload: ForwardMessagePayload) => {
        return request("/api/v1/messages/forward", {
            method: "POST",
            data: payload,
        });
    },

    async sendFileMessage(
        conversationId: string,
        fileData: { uri: string; name: string; type: string },
    ) {
        const formData = new FormData();

        // 1. Tạo object file cho FormData
        // Lưu ý: Key 'file' phải khớp với định nghĩa @RequestParam("file") của Backend
        const fileObj = {
            uri: fileData.uri,
            name: fileData.name,
            type: fileData.type,
        } as any;

        formData.append("file", fileObj);
        formData.append("conversationId", conversationId);

        const senderId = await chatAuthUtils.getCurrentUserId();
        if (senderId) {
            formData.append("senderId", senderId);
        }

        const token = await getAccessToken();

        return chatClient.post("/api/v1/messages/file", formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });
    },

    deleteMessage: async (messageId: string) => {
        return request(`/api/v1/messages/${messageId}`, {
            method: "DELETE",
        });
    },
};

export const chatAuthUtils = {
    async getCurrentUserId() {
        const token = await getAccessToken();
        return decodeJwtSub(token);
    },
};
