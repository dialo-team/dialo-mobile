import apiClient from "../apiClient";
import { UserProfileResponse } from "./types";

const normalizeBlockedUsers = (data: unknown): any[] => {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object") {
        const value = data as any;

        if (Array.isArray(value.data)) return value.data;
        if (Array.isArray(value.blocks)) return value.blocks;
        if (Array.isArray(value.data?.blocks)) return value.data.blocks;
    }

    return [];
};

export const extractBlockedUserId = (item: any): string => {
    const candidate =
        item?.targetId ||
        item?.blockedUserId ||
        item?.blockedId ||
        item?.userId ||
        item?.friendId ||
        item?.blockedUser?.id ||
        item?.user?.id ||
        item?.friend?.id ||
        item?.id ||
        (typeof item === "string" ? item : "");

    return candidate ? String(candidate) : "";
};

export const friendApi = {
    searchByPhone: async (
        phone: string,
    ): Promise<{ data: UserProfileResponse } | UserProfileResponse> => {
        const response = await apiClient.get(
            `/api/v1/users/phone/${phone}/info`,
        );
        return response.data;
    },

    sendFriendRequest: async (
        targetId: string,
        reason: string = "Ket ban nhe!",
    ) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/request`,
            { reason },
        );
        return response.data;
    },

    cancelFriendRequest: async (targetId: string) => {
        const response = await apiClient.delete(
            `/api/v1/users/${targetId}/request`,
        );
        return response.data;
    },

    getFriends: async () => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/me/friends?t=${timestamp}`,
        );
        return response.data;
    },

    getPendingRequests: async () => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/me/friend-requests?t=${timestamp}`,
        );
        return response.data;
    },

    acceptRequest: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/accept`,
        );
        return response.data;
    },

    rejectRequest: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/reject`,
        );
        return response.data;
    },

    checkStatus: async (targetId: string) => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/users/${targetId}/check?t=${timestamp}`,
        );
        return response.data;
    },

    getUserById: async (userId: string) => {
        const response = await apiClient.get(`/api/v1/users/${userId}/info`);
        return response.data;
    },

    getUserByQrToken: async (qrToken: string) => {
        const response = await apiClient.get(
            `/api/v1/users/qr/${qrToken}/info`,
        );
        return response.data;
    },

    unfriend: async (targetId: string) => {
        const response = await apiClient.delete(
            `/api/v1/users/${targetId}/unfriend`,
        );
        return response.data;
    },

    getSentRequests: async () => {
        const response = await apiClient.get(`/api/v1/me/friend-requests/sent`);
        return response.data;
    },

    getBlockedUsers: async () => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/me/blocks?t=${timestamp}`,
        );
        return normalizeBlockedUsers(response.data);
    },

    isUserBlocked: async (targetId: string) => {
        if (!targetId?.trim()) return false;

        const blockedUsers = await friendApi.getBlockedUsers();
        return blockedUsers.some(
            (item: any) => extractBlockedUserId(item) === String(targetId),
        );
    },

    blockUser: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/block`,
        );
        return response.data;
    },

    unblockUser: async (targetId: string) => {
        const response = await apiClient.delete(
            `/api/v1/users/${targetId}/unblock`,
        );
        return response.data;
    },

    updateConversationRemark: async (
        conversationId: string,
        remarkName: string,
        requesterId: string,
    ) => {
        const payload = {
            requesterId: requesterId,
            remarkName: remarkName,
        };

        const response = await apiClient.put(
            `/api/v1/conversations/${conversationId}/remark`,
            payload,
        );
        return response.data;
    },
};
