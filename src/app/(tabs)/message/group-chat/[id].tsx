import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { groupApi } from "@/src/api/group/groupApi";
import { useChatAttachments } from "@/src/hooks/useChatAttchment";
import { useChatRealtime } from "@/src/hooks/useChatRealtime";
import { getInitials } from "@/src/utils/displayUser";
import { Video as AVVideo, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Ellipsis,
    Image,
    MoreHorizontal,
    MoveLeft,
    Paperclip,
    Send,
    Smile,
    Trash2,
    Undo,
    UserPlus,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Image as RNImage,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHAT_BASE_URL = "http://14.225.254.174:8085";

type UiMessage = {
    id: string;
    text: string;
    position: "left" | "right";
    time: string;
    imageUri?: string | null;
    videoUri?: string | null;
    senderId?: string;
    senderName?: string;
    senderAvatarUrl?: string;
    isUnsent?: boolean;
    pending?: boolean;
    raw?: any;
};

type GroupMemberProfile = {
    id: string;
    name: string;
    avatar: string;
};

const paramToString = (value: string | string[] | undefined) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value[0] != null) return value[0];
    return "";
};

const resolveFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${CHAT_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

const dedupeMessages = (items: UiMessage[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (!item.id) return true;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

/**
 * Normalize members từ API response
 * API trả về: [{ userId, displayName, avatarUrl, role }]
 */
const normalizeMembers = (data: any): any[] => {
    if (Array.isArray(data)) {
        return data;
    }
    if (data?.data && Array.isArray(data.data)) {
        return data.data;
    }
    if (data?.members && Array.isArray(data.members)) {
        return data.members;
    }
    return [];
};

/**
 * Build member profile từ API member object
 * { userId, displayName, avatarUrl, role }
 */
const buildMemberProfile = (member: any): GroupMemberProfile | null => {
    const id = String(member?.userId || "").trim();
    if (!id) return null;

    return {
        id,
        name: member?.displayName || "Thành viên",
        avatar: member?.avatarUrl || "",
    };
};

export default function GroupChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
    }>();

    const conversationId = paramToString(params.id);
    const initialName = paramToString(params.name);
    const initialAvatar = paramToString(params.avatar);

    const [messages, setMessages] = useState<UiMessage[]>([]);
    const [message, setMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [groupName, setGroupName] = useState(initialName);
    const [groupAvatar, setGroupAvatar] = useState(initialAvatar);
    const [memberProfiles, setMemberProfiles] = useState<
        Record<string, GroupMemberProfile>
    >({});
    const [isFocused, setIsFocused] = useState(false);
    const [showEmojiMenu, setShowEmojiMenu] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<UiMessage | null>(
        null,
    );
    const [viewingMediaMessage, setViewingMediaMessage] =
        useState<UiMessage | null>(null);
    const [showHeader, setShowHeader] = useState(true);

    const scrollViewRef = useRef<ScrollView>(null);

    /**
     * Map API message to UI message
     * Sử dụng member profiles để lấy tên + avatar
     */
    const mapApiMessageToUi = useCallback(
        (
            item: any,
            cId: string,
            profiles: Record<string, GroupMemberProfile>,
        ): UiMessage => {
            const sId = String(item?.senderId || "").trim();
            const isMe = sId === String(cId).trim();
            const fileUrl = item?.attachment?.fileUrl;

            // Lấy profile từ map nếu có senderId
            const profile = sId ? profiles[sId] : null;

            return {
                id: String(item?.id || `msg-${Date.now()}`),
                text: item?.content || "",
                position: isMe ? "right" : "left",
                time: item?.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "",
                imageUri:
                    item?.type === "IMAGE" ? resolveFileUrl(fileUrl) : null,
                videoUri:
                    item?.type === "VIDEO" ? resolveFileUrl(fileUrl) : null,
                senderId: sId,
                senderName: isMe
                    ? "Bạn"
                    : profile?.name || item?.senderName || "Thành viên",
                senderAvatarUrl: isMe
                    ? ""
                    : profile?.avatar || item?.senderAvatarUrl || "",
                isUnsent:
                    item?.system === true ||
                    ["REVOKED", "SYSTEM"].includes(
                        String(item?.type || "").toUpperCase(),
                    ),
                pending: false,
                raw: item,
            };
        },
        [],
    );

    /**
     * Load group conversation detail + members
     */
    const loadGroupConversation = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            // Gọi cả 2 API song song
            const [detailRes, membersRes] = await Promise.all([
                chatApi.getConversationDetail(conversationId),
                groupApi.getGroupMembers(conversationId),
            ]);

            const detail = detailRes?.data || detailRes;

            // === STEP 1: Process members ===
            const membersData = normalizeMembers(membersRes);
            const nextMemberProfiles: Record<string, GroupMemberProfile> = {};

            membersData.forEach((member: any) => {
                const profile = buildMemberProfile(member);
                if (profile) {
                    nextMemberProfiles[profile.id] = profile;
                }
            });

            setMemberProfiles(nextMemberProfiles);

            // === STEP 2: Update group header ===
            const nextName = detail?.counterpartName || initialName || "Nhóm";
            setGroupName(nextName);
            setGroupAvatar(detail?.counterpartAvatarUrl || initialAvatar || "");

            // === STEP 3: Map messages ===
            const mapped = Array.isArray(detail?.messages)
                ? detail.messages.map((item: any) =>
                      mapApiMessageToUi(
                          item,
                          currentUserId,
                          nextMemberProfiles,
                      ),
                  )
                : [];

            setMessages(dedupeMessages(mapped));
            await chatApi.markRead(conversationId);
        } catch (error) {
            console.log("[GroupChat] load error", error);
        }
    }, [
        conversationId,
        currentUserId,
        initialAvatar,
        initialName,
        mapApiMessageToUi,
    ]);

    const { handlePickMedia, handlePickFile } = useChatAttachments(
        conversationId,
        loadGroupConversation,
    );

    // Get current user ID
    useEffect(() => {
        (async () => {
            try {
                const sub = await chatAuthUtils.getCurrentUserId();
                setCurrentUserId(sub || "");
            } catch {
                setCurrentUserId("");
            }
        })();
    }, []);

    // Load conversation when ready
    useEffect(() => {
        if (conversationId && currentUserId) {
            loadGroupConversation();
        }
    }, [conversationId, currentUserId, loadGroupConversation]);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        if (!messages.length) return;
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    // Realtime message updates
    useChatRealtime({
        currentUserId,
        conversationId,
        onConversationMessage: (payload) => {
            const incoming = payload?.data || payload?.message || payload;
            const incomingConversationId =
                incoming?.conversationId || payload?.conversationId;
            if (
                incomingConversationId &&
                String(incomingConversationId).trim() ===
                    String(conversationId).trim()
            ) {
                loadGroupConversation();
            }
        },
    });

    // Handle send message
    const handleSend = async () => {
        const content = message.trim();
        if (!content || !conversationId) return;

        const optimisticId = `tmp-${Date.now()}`;
        const optimistic: UiMessage = {
            id: optimisticId,
            text: content,
            position: "right",
            time: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            senderId: currentUserId,
            senderName: "Bạn",
            isUnsent: false,
            pending: true,
            raw: {
                id: optimisticId,
                content,
                senderId: currentUserId,
                type: "TEXT",
            },
        };

        setMessages((prev) => dedupeMessages([...prev, optimistic]));
        setMessage("");
        setShowEmojiMenu(false);

        try {
            const sent = await chatApi.sendMessage({
                conversationId,
                type: "TEXT",
                content,
            });
            if (sent && typeof sent === "object" && "id" in sent) {
                const mapped = mapApiMessageToUi(
                    sent,
                    currentUserId,
                    memberProfiles,
                );
                setMessages((prev) =>
                    dedupeMessages(
                        prev.map((item) =>
                            item.id === optimisticId ? mapped : item,
                        ),
                    ),
                );
                return;
            }
            await loadGroupConversation();
        } catch (error) {
            setMessages((prev) =>
                prev.filter((item) => item.id !== optimisticId),
            );
            setMessage(content);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn.");
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setMessage((prev) => `${prev}${emoji}`);
        setShowEmojiMenu(false);
        setIsFocused(true);
    };

    const handleUnsendMessage = async () => {
        if (!selectedMessage?.raw?.id) return;
        try {
            await chatApi.revokeMessage(String(selectedMessage.raw.id));
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể thu hồi tin nhắn.");
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage?.raw?.id) return;
        try {
            await chatApi.deleteMessage(String(selectedMessage.raw.id));
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa tin nhắn.");
        }
    };

    const groupInitials = getInitials(groupName || "Nhom", "G");

    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
            >
                <View className="bg-blue-600 flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <MoveLeft size={26} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="ml-3"
                            onPress={() =>
                                router.push({
                                    pathname: "/message/option/group-option",
                                    params: {
                                        id: conversationId,
                                        name: groupName,
                                        avatar: groupAvatar,
                                    },
                                })
                            }
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                {groupName || "Nhóm"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center ml-9">
                        <TouchableOpacity>
                            <UserPlus size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 10 }}>
                            <Paperclip size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() =>
                                router.push({
                                    pathname: "/message/option/group-option",
                                    params: {
                                        id: conversationId,
                                        name: groupName,
                                        avatar: groupAvatar,
                                    },
                                })
                            }
                        >
                            <MoreHorizontal size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-3 pt-4"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => {
                        const isMe = msg.position === "right";

                        return (
                            <View
                                key={msg.id}
                                className={`mb-3 flex-row ${isMe ? "justify-end" : ""}`}
                            >
                                {!isMe &&
                                    !msg.isUnsent &&
                                    (msg.senderAvatarUrl ? (
                                        <RNImage
                                            source={{
                                                uri: msg.senderAvatarUrl,
                                            }}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                    ) : (
                                        <View className="w-8 h-8 rounded-full mr-2 bg-blue-500 items-center justify-center">
                                            <Text className="text-white text-[11px] font-semibold">
                                                {getInitials(
                                                    msg.senderName,
                                                    groupInitials,
                                                )}
                                            </Text>
                                        </View>
                                    ))}

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        if (msg.imageUri || msg.videoUri)
                                            setViewingMediaMessage(msg);
                                    }}
                                    onLongPress={() =>
                                        !msg.isUnsent &&
                                        !msg.pending &&
                                        setSelectedMessage(msg)
                                    }
                                    className={`${isMe ? "bg-[#cde7f4]" : "bg-white"} px-4 py-2 rounded-2xl max-w-[74%] ${msg.pending ? "opacity-70" : ""}`}
                                >
                                    {!isMe && !msg.isUnsent && (
                                        <Text className="mb-1 text-[11px] text-blue-600 font-bold">
                                            {msg.senderName}
                                        </Text>
                                    )}

                                    {msg.videoUri ? (
                                        <View
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: 10,
                                                marginBottom: 4,
                                                overflow: "hidden",
                                                backgroundColor: "black",
                                            }}
                                        >
                                            <AVVideo
                                                source={{ uri: msg.videoUri }}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                                resizeMode={ResizeMode.COVER}
                                                shouldPlay={false}
                                            />
                                        </View>
                                    ) : msg.imageUri ? (
                                        <RNImage
                                            source={{ uri: msg.imageUri }}
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: 10,
                                                marginBottom: 4,
                                            }}
                                            resizeMode="cover"
                                        />
                                    ) : null}

                                    {msg.text !== "" && (
                                        <Text
                                            className={`text-[15px] ${msg.isUnsent ? "text-gray-400 italic" : "text-black"}`}
                                        >
                                            {msg.text}
                                        </Text>
                                    )}

                                    {!msg.isUnsent && (
                                        <Text
                                            className={`text-gray-500 text-[11px] mt-1 ${isMe ? "text-right" : ""}`}
                                        >
                                            {msg.pending
                                                ? "Dang gui..."
                                                : msg.time}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    <View className="h-6" />
                </ScrollView>

                <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-center">
                    <View className="relative z-50">
                        {showEmojiMenu && (
                            <View
                                className="absolute bottom-12 -left-2 bg-white rounded-full shadow-lg border border-gray-200 flex-row px-3 py-2 items-center"
                                style={{ elevation: 5 }}
                            >
                                {["👍", "❤️", "😂"].map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        onPress={() => handleEmojiSelect(emoji)}
                                        className="mx-2"
                                    >
                                        <Text className="text-2xl">
                                            {emoji}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity
                            className="mr-2"
                            onPress={() => setShowEmojiMenu((prev) => !prev)}
                        >
                            <Smile size={26} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity className="mr-2" onPress={handlePickFile}>
                        <Ellipsis size={24} color="#666" />
                    </TouchableOpacity>

                    <TextInput
                        placeholder="Tin nhắn"
                        value={message}
                        onChangeText={setMessage}
                        onFocus={() => {
                            setIsFocused(true);
                            setShowEmojiMenu(false);
                        }}
                        onBlur={() => setIsFocused(false)}
                        className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-[15px]"
                    />

                    <TouchableOpacity
                        className="ml-2"
                        onPress={handlePickMedia}
                    >
                        <Image size={26} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity className="ml-2" onPress={handleSend}>
                        <Send
                            size={26}
                            color={message.trim() ? "#2563eb" : "#666"}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Message Options Modal */}
            <Modal
                visible={!!selectedMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setSelectedMessage(null)}
                >
                    <View className="flex-1 bg-black/60 justify-center px-4">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-3xl p-4">
                                <TouchableOpacity
                                    className="py-3 flex-row items-center"
                                    onPress={handleUnsendMessage}
                                >
                                    <Undo size={20} color="#ef4444" />
                                    <Text className="ml-3 text-[15px]">
                                        Thu hồi
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="py-3 flex-row items-center"
                                    onPress={handleDeleteMessage}
                                >
                                    <Trash2 size={20} color="#ef4444" />
                                    <Text className="ml-3 text-[15px]">
                                        Xóa phía mình
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Media Viewer Modal */}
            <Modal
                visible={!!viewingMediaMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setViewingMediaMessage(null)}
            >
                {viewingMediaMessage && (
                    <View className="flex-1 bg-black justify-center items-center">
                        {showHeader && (
                            <View className="absolute top-0 w-full bg-black/60 z-10 px-5 pt-14 pb-4">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-white text-[17px] font-semibold">
                                            {viewingMediaMessage.position ===
                                            "right"
                                                ? "Bạn"
                                                : viewingMediaMessage.senderName}
                                        </Text>
                                        <Text className="text-white/70 text-[12px] mt-0.5">
                                            Đã gửi {viewingMediaMessage.time}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        className="bg-white/10 p-2 rounded-full px-4"
                                        onPress={() =>
                                            setViewingMediaMessage(null)
                                        }
                                    >
                                        <Text className="text-white text-base font-semibold">
                                            Đóng
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        <TouchableWithoutFeedback
                            onPress={() => setShowHeader((prev) => !prev)}
                        >
                            <View className="w-full h-full">
                                {viewingMediaMessage.videoUri ? (
                                    <AVVideo
                                        source={{
                                            uri: viewingMediaMessage.videoUri,
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        resizeMode={ResizeMode.CONTAIN}
                                        useNativeControls
                                        shouldPlay
                                    />
                                ) : (
                                    <RNImage
                                        source={{
                                            uri:
                                                viewingMediaMessage.imageUri ||
                                                "",
                                        }}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}
