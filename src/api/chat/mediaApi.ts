import apiClient from "@/src/api/apiClient";
import { getAccessToken } from "@/src/api/auth/authStorage";
import { ChatMediaItem } from "./types";

const MEDIA_BASE_URL = "http://14.225.192.37:8085";

export const mediaApi = {
    // 1. GET Media cập nhật đúng chuẩn Swagger
    async getMediaByConversation(
        conversationId: string,
        userId: string,
    ): Promise<ChatMediaItem[]> {
        try {
            console.log(
                `[mediaApi] 🔄 Đang gọi GET Media cho conversationId: ${conversationId}, userId: ${userId}`,
            );
            const token = await getAccessToken();
            const res = await apiClient.get(
                `${MEDIA_BASE_URL}/api/v1/conversations/${conversationId}/media`,
                {
                    headers: {
                        "X-User-Id": userId,
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                },
            );
            const data = res?.data || res;
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("[mediaApi] ❌ getMediaByConversation error:", error);
            throw error;
        }
    },

    // 2. POST Gửi file - Chuyển hẳn sang Multipart Form Data để giải quyết dứt điểm lỗi mạng trên Mobile
    async sendMediaFile(
        userId: string,
        conversationId: string,
        fileData: { uri: string; name: string; type: string },
    ) {
        console.log(
            "=================== [DEBUG MULTIPART SEND] ===================",
        );
        console.log("[mediaApi] 📥 Dữ liệu đầu vào nhận từ Hook:");
        console.log(`   - fileData.uri: ${fileData.uri}`);
        console.log(`   - fileData.name: ${fileData.name}`);
        console.log(`   - fileData.type: ${fileData.type}`);

        try {
            // 💎 KHÔNG ĐỌC BASE64 NỮA -> Khởi tạo đối tượng FormData chuẩn native
            const formData = new FormData();

            // Đóng gói file thô từ URI cục bộ của thiết bị
            formData.append("file", {
                uri: fileData.uri,
                name: fileData.name || `upload-${Date.now()}.png`,
                type: fileData.type || "image/png",
            } as any);

            const token = await getAccessToken();

            console.log(
                "[mediaApi] 🚀 Chuẩn bị gửi Request MULTIPART FORM DATA lên Server...",
            );

            const res = await apiClient.post(
                `${MEDIA_BASE_URL}/api/v1/messages/file`,
                formData,
                {
                    headers: {
                        "X-User-Id": userId,
                        // BẮT BUỘC: Để trống hoặc set multipart/form-data để Axios tự sinh Boundary chuẩn cho Mobile
                        "Content-Type": "multipart/form-data",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    params: {
                        conversationId,
                    },
                },
            );

            console.log(
                "[mediaApi] 🎉 SERVER TRẢ VỀ THÀNH CÔNG (200/201):",
                res?.data || res,
            );
            console.log(
                "===============================================================",
            );
            return res?.data || res;
        } catch (error: any) {
            console.log(
                "=================== [❌ LỖI PHÁT SINH ❌] ===================",
            );
            if (error.response) {
                console.error("[mediaApi] Lỗi từ Server Backend:");
                console.error(`   - Status Code: ${error.response.status}`);
                console.error(
                    `   - Data chi tiết của Backend:`,
                    JSON.stringify(error.response.data, null, 2),
                );
            } else {
                console.error(
                    "[mediaApi] Lỗi hệ thống mạng di động:",
                    error.message,
                );
            }
            console.log(
                "===============================================================",
            );
            throw error;
        }
    },
};
