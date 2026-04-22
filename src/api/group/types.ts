export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

// 2. Kiểu dữ liệu của một thành viên trong nhóm (Dựa trên GET /members)
export interface GroupMember {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    role: GroupRole;
}

// 3. Kiểu dữ liệu của tin nhắn (Dựa trên array messages trong log)
export interface Message {
    id: string;
    messageId?: string; // Tùy thuộc vào log có chỗ trả về messageId, có chỗ là id
    conversationId: string;
    senderId: string | null;
    senderName?: string;
    senderAvatarUrl?: string | null;
    receiverId?: string | null;
    content: string;
    type: "SYSTEM" | "TEXT" | "IMAGE" | string;
    system: boolean;
    revoked?: boolean;
    displayPosition?: "CENTER" | "LEFT" | "RIGHT";
    attachment?: any | null; // Cập nhật type chuẩn nếu bạn có interface Attachment
    forwardedFromMessageId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GroupConversation {
    id: string;
    type: "group" | "direct"; // direct cho chat 1-1
    participants: string[];
    participantKey?: string | null;
    remarks?: Record<string, any>;
    unreadCounts: Record<string, number>;
    lastMessage: Message | null;
    clearedAt?: Record<string, any>;
    createdBy: string;
    createdSource: string;
    createdAt: string;
    updatedAt: string;
    groupName: string;
    groupAvatarUrl: string | null;
    dissolved: boolean;
    memberRoles: Record<string, GroupRole>;
}

export interface ConversationDetail {
    conversationId: string;
    counterpartId: string;
    counterpartName: string;
    counterpartAvatarUrl: string | null;
    remarkName?: string | null;
    requesterId: string;
    unreadCount: number;
    unreadDisplay: string;
    createdAt: string;
    messages: Message[];
}
