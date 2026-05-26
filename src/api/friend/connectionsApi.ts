import apiClient from "../apiClient";
import { UserProfileResponse } from "./types";

const normalizeList = <T>(data: unknown): T[] => {
    if (Array.isArray(data)) {
        return data as T[];
    }
    if (data && typeof data === "object") {
        const value = data as any;

        // SỬA Ở ĐÂY: Ưu tiên lấy từ data.friends trước (theo đúng ảnh Swagger)
        if (value.data && Array.isArray(value.data.friends)) {
            return value.data.friends as T[];
        }

        // Các trường hợp fallback cũ
        if (Array.isArray(value.data)) return value.data;
        if (Array.isArray(value.friends)) return value.friends;
        if (Array.isArray(value.blocks)) return value.blocks;
    }
    return [];
};

export const connectionsApi = {
    getFriendsList: async (): Promise<UserProfileResponse[]> => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/me/friends?t=${timestamp}`,
        );
        return normalizeList<UserProfileResponse>(response.data);
    },

    getBlockedList: async (): Promise<UserProfileResponse[]> => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/me/blocks?t=${timestamp}`,
        );
        return normalizeList<UserProfileResponse>(response.data);
    },
};
