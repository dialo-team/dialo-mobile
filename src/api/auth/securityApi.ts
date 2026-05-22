import apiClient from "../apiClient";
import { SessionDeviceItem } from "./types";

const normalizeSessionList = (data: unknown): SessionDeviceItem[] => {
    if (Array.isArray(data)) {
        return data as SessionDeviceItem[];
    }
    if (data && typeof data === "object") {
        const value = data as Record<string, unknown>;
        if (Array.isArray(value.data)) {
            return value.data as SessionDeviceItem[];
        }
        if (Array.isArray(value.sessions)) {
            return value.sessions as SessionDeviceItem[];
        }
    }
    return [];
};

export const securityApi = {
    lockAccount: async () => {
        const response = await apiClient.post("/auth/lock", {});
        return response.data;
    },

    getActiveSessions: async (): Promise<SessionDeviceItem[]> => {
        const response = await apiClient.get("/auth/sessions/active");
        return normalizeSessionList(response.data);
    },

    getInactiveSessions: async (): Promise<SessionDeviceItem[]> => {
        const response = await apiClient.get("/auth/sessions/unactive");
        return normalizeSessionList(response.data);
    },
};
