import apiClient from "../apiClient";

export const groupApi = {
    createGroup: async (name: string, memberIds: string[]) => {
        const response = await apiClient.post("/api/v1/conversations/groups", {
            name,
            memberIds,
        });
        return response.data;
    },

    getGroupMembers: async (conversationId: string) => {
        const response = await apiClient.get(
            `/api/v1/conversations/${conversationId}/members`,
        );
        return response.data;
    },

    updateGroupName: async (conversationId: string, groupName: string) => {
        const response = await apiClient.put(
            `/api/v1/conversations/${conversationId}/group-name`,
            { groupName },
        );
        return response.data;
    },

    addMembers: async (conversationId: string, memberIds: string[]) => {
        const response = await apiClient.post(
            `/api/v1/conversations/${conversationId}/members`,
            { memberIds },
        );
        return response.data;
    },

    removeMember: async (conversationId: string, memberId: string) => {
        const response = await apiClient.delete(
            `/api/v1/conversations/${conversationId}/members/${memberId}`,
        );
        return response.data;
    },

    //gán quyền
    assignRole: async (
        conversationId: string,
        memberId: string,
        role: "ADMIN" | "OWNER" | "MEMBER" | string,
    ) => {
        const response = await apiClient.put(
            `/api/v1/conversations/${conversationId}/members/${memberId}/role`,
            { role },
        );
        return response.data;
    },

    //rời nhóm
    leaveGroup: async (conversationId: string) => {
        const response = await apiClient.post(
            `/api/v1/conversations/${conversationId}/leave`,
            {},
        );
        return response.data;
    },

    //giải tán nhóm
    dissolveGroup: async (conversationId: string) => {
        const response = await apiClient.delete(
            `/api/v1/conversations/${conversationId}/dissolve`,
        );
        return response.data;
    },
};
