// src/api/chat/mediaApi.ts

import apiClient from "@/src/api/apiClient";
import { ChatMediaItem } from "./types";

export const mediaApi = {
    async getMediaByConversation(
        conversationId: string,
    ): Promise<ChatMediaItem[]> {
        try {
            const res = await apiClient.get(
                `/api/v1/conversations/${conversationId}/media`,
            );

            // Backend có thể trả res.data hoặc res trực tiếp
            const data = res?.data || res;

            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("[mediaApi] getMediaByConversation error:", error);
            throw error;
        }
    },
};
