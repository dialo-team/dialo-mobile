// src/api/friend/friendApi.ts
import apiClient from "../apiClient";
import { UserProfileResponse } from "./types";

export const friendApi = {
    // 1. Tìm kiếm bằng số điện thoại
    searchByPhone: async (
        phone: string,
    ): Promise<{ data: UserProfileResponse } | UserProfileResponse> => {
        const response = await apiClient.get(
            `/api/v1/users/phone/${phone}/info`,
        );
        return response.data;
    },

    // 2. Gửi lời mời kết bạn
    sendFriendRequest: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/request`,
        );
        return response.data;
    },

    // 3. Thu hồi (Hủy) lời mời kết bạn
    cancelFriendRequest: async (targetId: string) => {
        const response = await apiClient.delete(
            `/api/v1/users/${targetId}/request`,
        );
        return response.data;
    },

    // Lấy danh sách lời mời kết bạn (Người khác gửi cho mình)
    getPendingRequests: async () => {
        const response = await apiClient.get(`/api/v1/me/friend-requests`);
        return response.data;
    },

    // Lấy danh sách bạn bè đã kết bạn
    getFriends: async () => {
        const response = await apiClient.get(`/api/v1/me/friends`);
        return response.data;
    },

    // Đồng ý kết bạn
    acceptRequest: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/accept`,
        );
        return response.data;
    },

    // Từ chối kết bạn
    rejectRequest: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/reject`,
        );
        return response.data;
    },
    checkStatus: async (targetId: string) => {
        const response = await apiClient.get(`/api/v1/users/${targetId}/check`);
        return response.data;
    },

    getUserById: async (userId: string) => {
        const response = await apiClient.get(`/api/v1/users/${userId}/info`);
        return response.data;
    },

    // THÊM MỚI: API lấy thông tin user từ qrToken
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
};
