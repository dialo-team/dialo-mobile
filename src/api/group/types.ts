export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

// 2. Kiểu dữ liệu của một thành viên trong nhóm (Dựa trên GET /members)
export interface GroupMember {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    role: GroupRole;
    userName?: string;
    user?: { userName?: string; displayName?: string; [key: string]: any };
    [key: string]: any;
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
    attachment?: any | null;
    forwardedFromMessageId?: string | null;
    reactions?: any[];
    closed?: boolean;
    poll?: any;
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
    status?: string;
    pinnedMessages?: any[];
    [key: string]: any;
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
