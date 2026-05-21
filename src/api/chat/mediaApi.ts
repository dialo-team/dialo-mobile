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

    async sendMediaFile(
        userId: string,
        conversationId: string,
        fileData: { uri: string; name: string; type: string },
    ) {
        try {
            const formData = new FormData();

            // Build the file part safely
            const isWeb =
                typeof window !== "undefined" && typeof File !== "undefined";
            let filePart: any;
            if (!isWeb) {
                filePart = {
                    uri: fileData.uri,
                    name: fileData.name,
                    type: fileData.type,
                };
            } else {
                try {
                    const resp = await fetch(fileData.uri);
                    const blob = await resp.blob();
                    const fileType =
                        fileData.type ||
                        blob.type ||
                        "application/octet-stream";
                    filePart = new File([blob], fileData.name, {
                        type: fileType,
                    });
                } catch {
                    filePart = {
                        uri: fileData.uri,
                        name: fileData.name,
                        type: fileData.type || "application/octet-stream",
                    };
                }
            }

            formData.append("file", filePart);
            formData.append("conversationId", conversationId);
            formData.append("senderId", userId);

            const res = await apiClient.post(
                "/api/v1/messages/file",
                formData,
                {
                    headers: {
                        "X-User-Id": userId,
                    },
                    params: {
                        conversationId,
                    },
                    transformRequest: (data, headers) => {
                        // Delete explicitly set Content-Type so React Native / Browser
                        // can auto-attach the multipart/form-data boundary automatically.
                        if (headers && headers["Content-Type"]) {
                            delete headers["Content-Type"];
                        }
                        return data;
                    },
                },
            );
            return res?.data || res;
        } catch (error) {
            console.error("[mediaApi] sendMediaFile error:", error);
            throw error;
        }
    },
};
