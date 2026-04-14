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
    sendFriendRequest: async (
        targetId: string,
        reason: string = "Kết bạn nhé!",
    ) => {
        // Truyền object body chứa trường reason theo đúng Swagger
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/request`,
            { reason },
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
    // Lấy danh sách bạn bè đã kết bạn (Thêm timestamp để chống cache)
    getFriends: async () => {
        const timestamp = new Date().getTime(); // Lấy thời gian hiện tại
        const response = await apiClient.get(
            `/api/v1/me/friends?t=${timestamp}`,
        );
        return response.data;
    },

    // Nên áp dụng luôn cho danh sách chờ để chống cache
    getPendingRequests: async () => {
        const timestamp = new Date().getTime();
        const response = await apiClient.get(
            `/api/v1/me/friend-requests?t=${timestamp}`,
        );
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

    // 1. Lấy danh sách lời mời kết bạn ĐÃ GỬI (Mục mới từ Swagger)
    getSentRequests: async () => {
        const response = await apiClient.get(`/api/v1/me/friend-requests/sent`);
        return response.data;
    },

    // 2. Lấy danh sách người dùng đã chặn
    getBlockedUsers: async () => {
        const response = await apiClient.get(`/api/v1/me/blocks`);
        return response.data;
    },

    // 3. Chặn người dùng
    blockUser: async (targetId: string) => {
        const response = await apiClient.post(
            `/api/v1/users/${targetId}/block`,
        );
        return response.data;
    },

    // 4. Bỏ chặn người dùng
    unblockUser: async (targetId: string) => {
        const response = await apiClient.delete(
            `/api/v1/users/${targetId}/unblock`,
        );
        return response.data;
    },
};
