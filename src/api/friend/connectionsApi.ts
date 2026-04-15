import apiClient from "../apiClient";
import { UserProfileResponse } from "./types";

const normalizeList = <T>(data: unknown): T[] => {
    if (Array.isArray(data)) {
        return data as T[];
    }
    if (data && typeof data === "object") {
        const value = data as Record<string, unknown>;
        if (Array.isArray(value.data)) {
            return value.data as T[];
        }
        if (Array.isArray(value.friends)) {
            return value.friends as T[];
        }
        if (Array.isArray(value.blocks)) {
            return value.blocks as T[];
        }
    }
    return [];
};

export const connectionsApi = {
    getFriendsList: async (): Promise<UserProfileResponse[]> => {
        const response = await apiClient.get("/api/v1/me/friends");
        return normalizeList<UserProfileResponse>(response.data);
    },

    getBlockedList: async (): Promise<UserProfileResponse[]> => {
        const response = await apiClient.get("/api/v1/me/blocks");
        return normalizeList<UserProfileResponse>(response.data);
    },
};
