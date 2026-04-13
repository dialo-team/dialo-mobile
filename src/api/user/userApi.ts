// api/user/userApi.ts
import apiClient from "../apiClient";
import { getAccessToken } from "../auth/authStorage";

export const userApi = {
    // Cập nhật tên, ngày sinh, giới tính
    updateBasicInfo: async (data: {
        userName: string;
        dob: string;
        gender: string;
    }) => {
        const token = await getAccessToken();
        console.log("=== DEBUG: TOKEN TRƯỚC KHI GỌI API ===", token);
        return apiClient.patch("/api/v1/me/basic-info", data);
    },

    // Cập nhật ảnh đại diện
    updateAvatar: async (imageUri: string) => {
        const formData = new FormData();

        const filename = imageUri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("file", {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        return apiClient.patch("/api/v1/me/avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },

    getProfile: async () => {
        const response = await apiClient.get("/api/v1/me");
        return response.data;
    },

    getMyQr: async () => {
        const response = await apiClient.get("/api/v1/me/qr");
        return response.data;
    },
};
