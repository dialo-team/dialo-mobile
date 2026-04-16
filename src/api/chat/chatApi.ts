import axios, { AxiosRequestConfig } from "axios";
import { getAccessToken } from "../auth/authStorage";
import {
    ChatConversationDetail,
    ChatConversationItem,
    ChatUserProfile,
    CreateConversationPayload,
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
        return request<ChatConversationItem[]>("/api/v1/conversations");
    },

    createConversation: async (payload: CreateConversationPayload) => {
        return request<{ id?: string; conversationId?: string }>(
            "/api/v1/conversations",
            {
                method: "POST",
                data: payload,
            },
        );
    },

    getConversationDetail: async (
        conversationId: string,
    ): Promise<ChatConversationDetail> => {
        return request<ChatConversationDetail>(
            `/api/v1/conversations/${conversationId}`,
        );
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
    sendMessage: async (payload: SendMessagePayload) => {
        return request("/api/v1/messages", {
            method: "POST",
            data: payload,
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

    sendFileMessage: async (conversationId: string, file: any) => {
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        formData.append("file", file as any);

        return request("/api/v1/messages/file", {
            method: "POST",
            data: formData,
            headers: {
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
