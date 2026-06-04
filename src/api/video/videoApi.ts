import axios from "axios";
import { API_BASE_URL } from "../../config/env";
import { getAccessToken } from "../auth/authStorage";

// Sử dụng một instance axios riêng cho video service,
// có thể tự động đính kèm token nếu cần.
const videoApiClient = axios.create({
    baseURL: API_BASE_URL.VIDEO,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

videoApiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Lỗi khi lấy token cho video api:", error);
        }
        return config;
    },
    (error) => Promise.reject(error),
);

export interface TokenRequest {
    roomId: string;
    participantName: string; // is userId in our case
}

export interface InviteCallRequest {
    conversationId: string;
    callerId: string;
    callerName: string;
    callerAvatar: string | null;
    recipientIds: string[];
}

export interface RespondCallRequest {
    conversationId: string;
    callerId: string;
}

export interface EndCallRequest {
    conversationId: string;
    recipientIds: string[];
}

export const videoApi = {
    generateToken: async (
        data: TokenRequest,
    ): Promise<{ token: string; url: string }> => {
        const response = await videoApiClient.post("/token", data);
        console.log("Token response:", response.data);

        const token =
            response.data?.token || response.data?.data?.token || response.data;
        const url = response.data?.url || response.data?.data?.url;

        return {
            token: typeof token === "string" ? token : JSON.stringify(token),
            url: typeof url === "string" ? url : "",
        };
    },

    inviteCall: async (data: InviteCallRequest) => {
        const response = await videoApiClient.post("/call/invite", data);
        return response.data;
    },

    acceptCall: async (data: RespondCallRequest) => {
        const response = await videoApiClient.post("/call/accept", data);
        return response.data;
    },

    declineCall: async (data: RespondCallRequest) => {
        const response = await videoApiClient.post("/call/decline", data);
        return response.data;
    },

    endCall: async (data: EndCallRequest) => {
        const response = await videoApiClient.post("/call/end", data);
        return response.data;
    },

    checkHealth: async () => {
        const response = await videoApiClient.get("/health");
        return response.data;
    },
};
