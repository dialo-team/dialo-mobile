import apiClient from "../apiClient";
import { GroupConversation, GroupMember, GroupRole } from "./types";

export const groupApi = {
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
                headers: {
                    "X-User-Id": userId,
                },
            },
        );
        return response.data;
    },

    addMembers: async (
        conversationId: string,
        userId: string,
        memberIds: string[],
    ): Promise<GroupConversation> => {
        const response = await apiClient.post(
            `/api/v1/conversations/${conversationId}/members`,
            { userIds: memberIds },
            {
                headers: {
                    "X-User-Id": userId,
                },
            },
        );
        return response.data;
    },

    updateGroupName: async (
        conversationId: string,
        userId: string,
        groupName: string,
    ): Promise<GroupConversation> => {
        const url = `/api/v1/conversations/${conversationId}/group-name`;
        const config = {
            headers: {
                "X-User-Id": userId,
            },
        };

        const attempts: {
            data?: any;
            params?: Record<string, string>;
        }[] = [
            { data: { groupName } },
            { data: { name: groupName } },
            { data: { conversationName: groupName } },
            { data: { newName: groupName } },
            { data: {}, params: { groupName } },
            { data: {}, params: { name: groupName } },
            { data: groupName },
        ];

        try {
            const response = await apiClient.put(url, { groupName }, config);
            return response.data;
        } catch (error: any) {
            const status = error?.response?.status;
            let lastError: any = error;

            // Backend rename đang không ổn định về request key.
            // Thử fallback sang các cases khác nếu lỗi 4xx
            if (status && status < 500) {
                for (const attempt of attempts) {
                    try {
                        const response = await apiClient.put(
                            url,
                            attempt.data, // Sửa lại đúng syntax của Axios: url, data, config
                            {
                                ...config,
                                params: attempt.params,
                            },
                        );
                        return response.data;
                    } catch (err: any) {
                        lastError = err;
                        // Nếu vẫn là lỗi 400 thì tiếp tục vòng lặp, lỗi khác thì throw luôn
                        if (err?.response?.status !== 400) {
                            throw err;
                        }
                    }
                }
            }
            throw lastError;
        }
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

    // Sử dụng thẳng type GroupRole cho tham số
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

    updateGroupAvatar: async (
        conversationId: string,
        userId: string,
        groupAvatarUrl: string,
    ): Promise<GroupConversation> => {
        const response = await apiClient.put(
            `/api/v1/conversations/${conversationId}/group-avatar`,
            { groupAvatarUrl },
            {
                headers: {
                    "X-User-Id": userId,
                },
            },
        );
        return response.data;
    },
};
