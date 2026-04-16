export type ChatConversationItem = {
    conversationId: string;
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
    type?: "TEXT" | "IMAGE" | "VIDEO" | string;
};

export type ForwardMessagePayload = {
    sourceMessageId: string;
    targetConversationId: string;
};
