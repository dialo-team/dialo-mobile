import axios from "axios";
import apiClient from "../apiClient";
import { getAccessToken } from "../auth/authStorage";
import { GroupConversation, GroupMember, GroupRole } from "./types";

// Định nghĩa URL cho Chat Service (Cổng 8085)
const CHAT_SERVICE_URL = "http://14.225.254.174:8085/api/v1/conversations";

export const groupApi = {
    // Các hàm dùng chung apiClient (Cổng 9000) nếu vẫn hoạt động tốt
    createGroup: async (name: string, memberIds: string[]) => {
        const response = await apiClient.post("/api/v1/conversations/groups", {
            name,
            memberIds,
        });
        return response.data;
    },

    getGroupMembers: async (
        conversationId: string,
        userId: string,
    ): Promise<GroupMember[]> => {
        const response = await apiClient.get(
            `/api/v1/conversations/${conversationId}/members`,
            {
                headers: { "X-User-Id": userId },
            },
        );
        return response.data;
    },

    // --- CÁC HÀM CẬP NHẬT (Dùng Port 8085 để tránh lỗi 500) ---

    updateGroupName: async (
        conversationId: string,
        userId: string,
        groupName: string,
    ) => {
        const token = await getAccessToken();
        const response = await axios.put(
            `${CHAT_SERVICE_URL}/${conversationId}/group-name`,
            { groupName },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-User-Id": userId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    },

    updateGroupAvatar: async (
        conversationId: string,
        userId: string,
        groupAvatarUrl: string,
    ): Promise<GroupConversation> => {
        const token = await getAccessToken();
        const response = await axios.put(
            `${CHAT_SERVICE_URL}/${conversationId}/group-avatar`,
            { groupAvatarUrl }, // Key theo đúng tài liệu API
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-User-Id": userId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    },

    // --- CÁC HÀM QUẢN LÝ THÀNH VIÊN ---

    addMembers: async (
        conversationId: string,
        userId: string,
        memberIds: string[],
    ): Promise<GroupConversation> => {
        const token = await getAccessToken();

        const response = await axios.post(
            `${CHAT_SERVICE_URL}/${conversationId}/members`,
            { memberIds }, // Payload đúng chuẩn Demo
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-User-Id": userId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    },

    removeMember: async (
        conversationId: string,
        memberId: string,
    ): Promise<GroupConversation> => {
        const response = await apiClient.delete(
            `/api/v1/conversations/${conversationId}/members/${memberId}`,
        );
        return response.data;
    },

    assignRole: async (
        conversationId: string,
        memberId: string,
        role: GroupRole,
    ): Promise<GroupConversation> => {
        const response = await apiClient.put(
            `/api/v1/conversations/${conversationId}/members/${memberId}/role`,
            { role },
        );
        return response.data;
    },

    leaveGroup: async (conversationId: string): Promise<GroupConversation> => {
        const response = await apiClient.post(
            `/api/v1/conversations/${conversationId}/leave`,
            {},
        );
        return response.data;
    },

    dissolveGroup: async (conversationId: string): Promise<any> => {
        const response = await apiClient.delete(
            `/api/v1/conversations/${conversationId}/dissolve`,
        );
        return response.data;
    },
};
