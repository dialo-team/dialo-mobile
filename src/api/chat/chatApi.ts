// src/api/chat/chatApi.ts

import { pickBestDisplayName } from "@/src/utils/displayUser";
import axios, { AxiosRequestConfig } from "axios";
import { getAccessToken } from "../auth/authStorage";
import {
    ChatConversationDetail,
    ChatConversationItem,
    ChatMediaItem,
    ChatUserProfile,
    ForwardMessagePayload,
    SendMessagePayload,
} from "./types";

const CHAT_BASE_URL = "http://14.225.192.37:9000";

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
            console.log("[chatClient] request interceptor error:", error);
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

        if (error?.message === "Network Error" && !error?.response) {
            console.warn("[chatClient] CORS or Network Error detected");
        }

        console.log("[chatClient] response error:", {
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

export const isGroupConversation = (value: any) => {
    const type = String(
        value?.conversationType ||
            value?.type ||
            value?.conversationTypeName ||
            "",
    ).toLowerCase();

    const hasExplicitGroupType = type === "group";
    const hasGroupName = !!value?.groupName;
    const hasGroupAvatar = !!value?.groupAvatarUrl;
    const hasParticipants = Array.isArray(value?.participants);
    const hasMemberRoles = !!value?.memberRoles;

    const isGroupByIdPattern =
        value?.counterpartId &&
        value?.conversationId &&
        value?.counterpartId === value?.conversationId;

    const result =
        hasExplicitGroupType ||
        hasGroupName ||
        hasGroupAvatar ||
        hasParticipants ||
        hasMemberRoles ||
        isGroupByIdPattern;

    return result;
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

export const normalizeConversationIdentity = <T extends Record<string, any>>(
    value: T,
): T => {
    const group = isGroupConversation(value);
    const conversationId = value?.conversationId || value?.id || "";
    const counterpartId = group
        ? conversationId
        : value?.counterpartId || value?.targetUserId || value?.userId || "";

    const nameCandidates = [
        value?.groupName,
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
        value?.groupAvatarUrl ||
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
        conversationId,
        conversationType: group
            ? "group"
            : value?.conversationType || value?.type || "direct",
        isGroup: group,
        groupName: value?.groupName || (group ? value?.counterpartName : ""),
        groupAvatarUrl: value?.groupAvatarUrl || "",
        counterpartId,
        counterpartName: group
            ? value?.counterpartName || counterpartName
            : counterpartName,
        counterpartAvatarUrl: group
            ? value?.groupAvatarUrl || counterpartAvatarUrl
            : counterpartAvatarUrl,
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

        console.log(`[chatApi] ${path} error:`, { message, status, data });

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

    updateConversationRemark: async (
        conversationId: string,
        remarkName: string,
    ) => {
        const requesterId = decodeJwtSub(await getAccessToken());
        if (!requesterId?.trim()) {
            throw new Error(
                "Không xác định được requesterId. Vui lòng đăng nhập lại.",
            );
        }
        return request(`/api/v1/conversations/${conversationId}/remark`, {
            method: "PUT",
            data: { requesterId, remarkName },
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

    getConversationMedia: async (
        conversationId: string,
        type: "IMAGE" | "VIDEO" | "FILE" = "IMAGE",
    ): Promise<ChatMediaItem[]> => {
        const token = await getAccessToken();
        const userId = decodeJwtSub(token);

        return request(`/api/v1/conversations/${conversationId}/media`, {
            method: "GET",
            headers: {
                "X-User-Id": userId,
            },
            params: { type },
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

    deleteMessage: async (messageId: string) => {
        return request(`/api/v1/messages/${messageId}`, {
            method: "DELETE",
        });
    },

    editMessage: async (messageId: string, content: string) => {
        return request(`/api/v1/messages/${messageId}`, {
            method: "PUT",
            data: { content },
        });
    },

    reactToMessage: async (messageId: string, reaction: string) => {
        const normalized = String(reaction || "").trim();
        const emojiToType: Record<string, string> = {
            "👍": "LIKE",
            "❤️": "LOVE",
            "😂": "HAHA",
            "😮": "WOW",
            "😢": "SAD",
            "😡": "ANGRY",
        };
        const mappedType = emojiToType[normalized] || normalized.toUpperCase();

        const candidatePayloads = [
            { reaction: normalized },
            { emoji: normalized },
            { type: mappedType },
            { reaction: mappedType },
            { reactionType: mappedType },
            { emojiCode: mappedType },
        ];

        let lastError: any;
        for (const payload of candidatePayloads) {
            try {
                return await request(`/api/v1/messages/${messageId}/react`, {
                    method: "POST",
                    data: payload,
                });
            } catch (error: any) {
                const status = error?.response?.status;
                lastError = error;
                if (status !== 400) {
                    throw error;
                }
            }
        }

        throw lastError;
    },

    searchConversationMembers: async (
        conversationId: string,
        keyword: string,
    ) => {
        return request(
            `/api/v1/conversations/${conversationId}/members/search`,
            {
                method: "GET",
                params: { keyword },
            },
        );
    },

    createPoll: async (
        conversationId: string,
        question: string, // Biến question map sang trường "title" của Swagger
        options: string[],
    ) => {
        return request<any>("/api/v1/messages/poll", {
            method: "POST",
            data: {
                conversationId: conversationId.trim(),
                title: question.trim(), // Đổi từ question -> title theo đúng ảnh 9
                options: options.map((opt) => opt.trim()).filter(Boolean), // Mảng string[] giữ nguyên theo ảnh 9
            },
        });
    },

    votePoll: async (messageId: string, optionIds: string[]) => {
        return request<any>(`/api/v1/messages/${messageId}/poll/votes`, {
            method: "PUT",
            data: {
                optionIds, // Mảng string[] theo đúng ảnh 6
            },
        });
    },

    addPollOption: async (messageId: string, optionText: string) => {
        return request<any>(`/api/v1/messages/${messageId}/poll/options`, {
            method: "POST",
            data: {
                content: optionText.trim(), // Đổi từ optionText -> content theo đúng ảnh 7
            },
        });
    },

    closePoll: async (messageId: string) => {
        return request<any>(`/api/v1/messages/${messageId}/poll/close`, {
            method: "POST",
        });
    },

    pinMessage: async (conversationId: string, messageId: string) => {
        return request(
            `/api/v1/conversations/${conversationId}/pin/${messageId}`,
            {
                method: "POST",
            },
        );
    },

    unpinMessage: async (conversationId: string, messageId: string) => {
        return request(
            `/api/v1/conversations/${conversationId}/pin/${messageId}`,
            {
                method: "DELETE",
            },
        );
    },
};

export const chatAuthUtils = {
    async getCurrentUserId() {
        const token = await getAccessToken();
        return decodeJwtSub(token);
    },
};
