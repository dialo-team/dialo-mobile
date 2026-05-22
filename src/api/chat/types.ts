export type ChatConversationItem = {
    conversationId: string;
    conversationType?: string;
    isGroup?: boolean;
    groupName?: string;
    groupAvatarUrl?: string;
    participants?: string[];
    memberRoles?: Record<string, string>;
    counterpartId?: string;
    counterpartName?: string;
    counterpartAvatarUrl?: string;
    lastMessage?: string;
    lastMessageAt?: string;
    lastMessageType?: string;
    lastMessageSystem?: boolean;
    unreadCount?: number;
    unreadDisplay?: number;
    [key: string]: any;
};

export type ChatAttachment = {
    fileName?: string;
    fileUrl?: string;
    contentType?: string;
    size?: number;
    [key: string]: any;
};

export type ChatMessageItem = {
    id: string;
    senderId?: string;
    senderName?: string;
    senderAvatarUrl?: string;
    content?: string;
    type?: string;
    displayPosition?: "LEFT" | "RIGHT" | "CENTER" | string;
    createdAt?: string;
    system?: boolean;
    attachment?: ChatAttachment | null;
    [key: string]: any;
};

export type ChatConversationDetail = {
    conversationId: string;
    conversationType?: string;
    isGroup?: boolean;
    groupName?: string;
    groupAvatarUrl?: string;
    participants?: string[];
    memberRoles?: Record<string, string>;
    counterpartId?: string;
    counterpartName?: string;
    counterpartAvatarUrl?: string;
    remarkName?: string;
    messages: ChatMessageItem[];
    [key: string]: any;
};

export type ChatUserProfile = {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    [key: string]: any;
};

export type SendMessagePayload = {
    conversationId: string;
    senderId?: string;
    content?: string;
    // Cập nhật lại các giá trị Enum mà Backend hỗ trợ
    type?: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | string;
};

export type ForwardMessagePayload = {
    sourceMessageId: string;
    targetConversationId: string;
};

// Trong file types.ts, cập nhật lại enum/union:
export type MediaType = "IMAGE" | "VIDEO" | "FILE" | "LINK" | "VOICE" | "GIF";

export interface Attachment {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size: number;
    thumbnailUrl?: string | null;
}

export interface ChatMediaItem {
    id: string;
    conversationId: string;
    type: MediaType;
    content?: string;
    attachment?: Attachment;

    createdAt: string;

    senderId?: string;
    senderName?: string;
    senderAvatarUrl?: string;

    displayPosition?: "LEFT" | "RIGHT";

    revoked?: boolean;
}
