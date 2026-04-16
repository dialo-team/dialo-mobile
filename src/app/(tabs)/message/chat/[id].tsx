import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { useChatRealtime } from "@/src/hooks/useChatRealtime";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { Video as AVVideo, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    CornerUpLeft,
    Image,
    MoreHorizontal,
    MoveLeft,
    Paperclip,
    Phone,
    Search,
    Send,
    Trash2,
    Video,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
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

function paramStr(v: string | string[] | undefined): string | undefined {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v[0] != null) return v[0];
    return undefined;
}

function resolveFileUrl(fileUrl?: string) {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${CHAT_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function formatRelativeActivity(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return date.toLocaleString("vi-VN");
}

function getMessageStatusLabel(message: any) {
    if (message?.pending) return "đang gửi...";

    const rawStatus = String(
        message?.raw?.status || message?.messageStatus || "",
    ).toUpperCase();

    if (message?.readAt || message?.raw?.readAt || message?.raw?.seenAt) {
        return "đã xem";
    }

    if (rawStatus === "READ" || rawStatus === "SEEN") {
        return "đã xem";
    }

    if (
        rawStatus === "DELIVERED" ||
        message?.deliveredAt ||
        message?.raw?.deliveredAt
    ) {
        return "đã gửi";
    }

    return message?.time || "";
}

function getMessageKey(item: any, index: number) {
    return item?.id || item?.raw?.id || `message-${index}`;
}

function dedupeMessages(items: any[]) {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of items) {
        const key = item?.id || item?.raw?.id;
        if (key) {
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
        }
        result.push(item);
    }

    return result;
}

function isGenericDisplayName(value?: string) {
    const normalized = (value || "").trim().toLowerCase();
    if (!normalized) return true;

    return (
        normalized === "nguoi dung" ||
        normalized === "người dùng" ||
        normalized === "tro chuyen" ||
        normalized === "trò chuyện" ||
        normalized === "user" ||
        normalized === "unknown"
    );
}

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        from?: string | string[];
    }>();

    const id = paramStr(params.id);
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);
    const from = paramStr(params.from);

    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [forwardTargets, setForwardTargets] = useState<any[]>([]);
    const [forwardLoading, setForwardLoading] = useState(false);
    const [counterpartId, setCounterpartId] = useState("");
    const [counterpartName, setCounterpartName] = useState("");
    const [counterpartAvatar, setCounterpartAvatar] = useState("");
    const [counterpartOnline, setCounterpartOnline] = useState(false);
    const [counterpartLastActiveAt, setCounterpartLastActiveAt] = useState("");
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [showSearchSheet, setShowSearchSheet] = useState(false);
    const [showMediaSheet, setShowMediaSheet] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [mediaLoading, setMediaLoading] = useState(false);

    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [viewingMediaMessage, setViewingMediaMessage] = useState<any>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entranceAnim = useRef(new Animated.Value(0)).current;

    const avatarUrl =
        counterpartAvatar ||
        (typeof avatar === "string" &&
        (avatar.startsWith("http://") || avatar.startsWith("https://"))
            ? avatar
            : "");
    const displayName = pickBestDisplayName(
        [counterpartName, name],
        "Tro chuyen",
    );

    const normalizedConversationId = id || "";

    useEffect(() => {
        entranceAnim.setValue(0);
        Animated.timing(entranceAnim, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [entranceAnim, normalizedConversationId]);

    const mapApiMessageToUi = useCallback(
        (item: any) => {
            const mineBySender =
                !!item?.senderId &&
                !!currentUserId &&
                item.senderId === currentUserId;
            const rawPosition = String(
                item?.displayPosition || item?.position || "",
            ).toUpperCase();
            const isCenter = rawPosition === "CENTER" || !!item?.system;
            const mineByPosition = rawPosition === "RIGHT";
            const isMe = !isCenter && (mineBySender || mineByPosition);

            const fileUrl = item?.attachment?.fileUrl;
            const type = item?.type || "TEXT";

            return {
                id: item?.id,
                text: item?.content || "",
                type: isMe ? "right" : "left",
                time: item?.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "",
                senderName: item?.senderName || "",
                imageUri:
                    type === "IMAGE" && fileUrl
                        ? resolveFileUrl(fileUrl)
                        : null,
                videoUri:
                    type === "VIDEO" && fileUrl
                        ? resolveFileUrl(fileUrl)
                        : null,
                system: !!item?.system,
                position: isCenter ? "center" : isMe ? "right" : "left",
                readAt: item?.readAt || item?.seenAt || null,
                deliveredAt: item?.deliveredAt || null,
                messageStatus: item?.status || item?.messageStatus || null,
                pending: false,
                raw: item,
            };
        },
        [currentUserId],
    );

    const getMessageSide = (msg: any) => msg?.position || msg?.type || "left";

    const mergeIncomingMessage = useCallback(
        (incomingMessage: any) => {
            try {
                if (!incomingMessage?.id) {
                    console.warn("[ChatScreen] Incoming message has no ID");
                    return;
                }

                const mapped = mapApiMessageToUi(incomingMessage);
                const mappedId = mapped?.id || mapped?.raw?.id;

                console.log("[ChatScreen] Merging incoming message:", mappedId);
                if (!mappedId) return;

                setMessages((prev) => {
                    const index = prev.findIndex(
                        (item) => (item?.id || item?.raw?.id) === mappedId,
                    );
                    if (index === -1) {
                        console.log(
                            "[ChatScreen] Message not found, appending",
                        );
                        return [...prev, mapped];
                    }

                    console.log("[ChatScreen] Message found at index", index);
                    const next = [...prev];
                    next[index] = {
                        ...next[index],
                        ...mapped,
                        pending: false,
                    };
                    return next;
                });
            } catch (error) {
                console.error(
                    "[ChatScreen] mergeIncomingMessage error:",
                    error,
                );
            }
        },
        [mapApiMessageToUi],
    );

    const loadConversationDetail = useCallback(async () => {
        if (!normalizedConversationId) {
            console.warn("[ChatScreen] No conversationId provided");
            return;
        }

        setLoading(true);
        try {
            console.log(
                "[ChatScreen] Loading conversation detail:",
                normalizedConversationId,
            );
            const detail = await chatApi.getConversationDetail(
                normalizedConversationId,
            );

            const needsLookup =
                isGenericDisplayName(detail?.counterpartName) ||
                !(
                    detail?.counterpartAvatarUrl ||
                    detail?.counterpartAvatar ||
                    detail?.profilePictureUrl ||
                    detail?.profilePicture ||
                    detail?.photoUrl ||
                    detail?.imageUrl ||
                    detail?.avatarUrl ||
                    detail?.avatar
                );

            let counterpartDisplayName = pickBestDisplayName(
                [
                    isGenericDisplayName(detail?.counterpartName)
                        ? ""
                        : detail?.counterpartName,
                    name,
                ],
                "Tro chuyen",
            );
            let counterpartDisplayAvatar =
                detail?.counterpartAvatarUrl ||
                detail?.counterpartAvatar ||
                detail?.profilePictureUrl ||
                detail?.profilePicture ||
                detail?.photoUrl ||
                detail?.imageUrl ||
                detail?.avatarUrl ||
                detail?.avatar ||
                "";

            if (needsLookup && detail?.counterpartId) {
                try {
                    const userRes = await friendApi.getUserById(
                        detail.counterpartId,
                    );
                    const profile = userRes?.data || userRes;
                    counterpartDisplayName = pickBestDisplayName(
                        [
                            isGenericDisplayName(detail?.counterpartName)
                                ? ""
                                : detail?.counterpartName,
                            profile?.userName,
                            profile?.username,
                            profile?.name,
                            profile?.displayName,
                            profile?.nickName,
                            profile?.nickname,
                            profile?.fullName,
                            name,
                        ],
                        "Tro chuyen",
                    );
                    counterpartDisplayAvatar =
                        counterpartDisplayAvatar ||
                        profile?.avatarUrl ||
                        profile?.avatar ||
                        profile?.profilePictureUrl ||
                        profile?.profilePicture ||
                        profile?.photoUrl ||
                        profile?.imageUrl ||
                        "";
                } catch (error) {
                    console.error(
                        "[ChatScreen] counterpart lookup error:",
                        error,
                    );
                }
            }

            const mapped = dedupeMessages(
                Array.isArray(detail?.messages)
                    ? detail.messages.map(mapApiMessageToUi)
                    : [],
            );
            console.log("[ChatScreen] Loaded messages:", mapped.length);
            setMessages(mapped);
            setCounterpartId(detail?.counterpartId || "");
            setCounterpartName(counterpartDisplayName);
            setCounterpartAvatar(counterpartDisplayAvatar);
            setCounterpartLastActiveAt(
                detail?.counterpartLastActiveAt || detail?.lastActiveAt || "",
            );
            setCounterpartOnline(
                Boolean(
                    detail?.counterpartOnline ||
                    detail?.online ||
                    detail?.isOnline,
                ) ||
                    (Boolean(
                        detail?.counterpartLastActiveAt || detail?.lastActiveAt,
                    ) &&
                        Date.now() -
                            new Date(
                                detail?.counterpartLastActiveAt ||
                                    detail?.lastActiveAt,
                            ).getTime() <
                            5 * 60 * 1000),
            );

            await chatApi.markRead(normalizedConversationId);
            console.log("[ChatScreen] Marked as read");
        } catch (error: any) {
            console.error(
                "[ChatScreen] loadConversationDetail error:",
                error?.message,
            );
            const errorMsg = error?.message || "Không thể tải cuộc trò chuyện.";
            Alert.alert("Lỗi", errorMsg);
        } finally {
            setLoading(false);
        }
    }, [mapApiMessageToUi, name, normalizedConversationId]);

    useEffect(() => {
        (async () => {
            try {
                const sub = await chatAuthUtils.getCurrentUserId();
                if (sub) {
                    setCurrentUserId(sub);
                }
            } catch (error) {
                console.error("Error getting current user ID:", error);
                setCurrentUserId("");
            }
        })();
    }, []);

    useEffect(() => {
        loadConversationDetail();
    }, [loadConversationDetail]);

    const handleIncomingRealtimeMessage = useCallback(
        (payload: any) => {
            const incoming = payload?.data || payload?.message || payload;

            const incomingConversationId =
                incoming?.conversationId || payload?.conversationId;
            const incomingType = String(
                incoming?.type || payload?.type || payload?.eventType || "",
            ).toUpperCase();

            if (
                incomingConversationId &&
                incomingConversationId !== normalizedConversationId
            ) {
                return;
            }

            if (incomingType === "TYPING") {
                setRemoteTyping(true);
                if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                }
                typingTimerRef.current = setTimeout(() => {
                    setRemoteTyping(false);
                }, 2000);
                return;
            }

            if (incomingType === "READ" || incomingType === "SEEN") {
                const readMessageId = incoming?.messageId || incoming?.id;
                if (readMessageId) {
                    setMessages((prev) =>
                        prev.map((item) =>
                            (item?.id || item?.raw?.id) === readMessageId
                                ? {
                                      ...item,
                                      readAt:
                                          incoming?.readAt ||
                                          incoming?.seenAt ||
                                          new Date().toISOString(),
                                      pending: false,
                                      raw: {
                                          ...(item?.raw || {}),
                                          readAt:
                                              incoming?.readAt ||
                                              incoming?.seenAt ||
                                              new Date().toISOString(),
                                          status: "READ",
                                      },
                                  }
                                : item,
                        ),
                    );
                }
                return;
            }

            if (!incoming?.id) {
                loadConversationDetail();
                return;
            }
            mergeIncomingMessage(incoming);
        },
        [
            loadConversationDetail,
            mergeIncomingMessage,
            normalizedConversationId,
        ],
    );

    const { connected } = useChatRealtime({
        currentUserId,
        conversationId: normalizedConversationId,
        onConversationMessage: handleIncomingRealtimeMessage,
    });

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }
        };
    }, []);

    const handleSend = async () => {
        const content = message.trim();
        if (!normalizedConversationId || !content) {
            console.warn(
                "[ChatScreen] Cannot send: conversationId or content missing",
            );
            return;
        }
        const payload = {
            conversationId: normalizedConversationId,
            senderId: currentUserId,
            type: "TEXT",
            content,
        };
        console.log("[ChatScreen] Sending message:", payload);

        const optimisticId = `tmp-${Date.now()}`;
        const now = new Date();

        const optimisticMessage = {
            id: optimisticId,
            text: content,
            type: "right",
            time: now.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            senderName: "",
            imageUri: null,
            videoUri: null,
            system: false,
            pending: true,
            raw: {
                id: optimisticId,
                content,
                type: "TEXT",
                senderId: currentUserId,
                displayPosition: "RIGHT",
                createdAt: now.toISOString(),
            },
        };

        setMessages((prev) => dedupeMessages([...prev, optimisticMessage]));
        setMessage("");

        try {
            const sent = await chatApi.sendMessage(payload);

            if (sent && typeof sent === "object" && "id" in sent) {
                const serverMessage = mapApiMessageToUi(sent);
                setMessages((prev) =>
                    dedupeMessages(
                        prev.map((item) =>
                            item.id === optimisticId
                                ? {
                                      ...serverMessage,
                                      pending: false,
                                  }
                                : item,
                        ),
                    ),
                );
                return;
            }

            setMessages((prev) =>
                dedupeMessages(
                    prev.map((item) =>
                        item.id === optimisticId
                            ? {
                                  ...item,
                                  pending: false,
                              }
                            : item,
                    ),
                ),
            );
        } catch (error: any) {
            console.error("[ChatScreen] sendMessage error:", error);
            console.error(
                "[ChatScreen] sendMessage response data:",
                error?.response?.data,
            );
            setMessages((prev) =>
                dedupeMessages(prev.filter((item) => item.id !== optimisticId)),
            );
            setMessage(content);
            const errorMsg =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể gửi tin nhắn";
            Alert.alert("Lỗi", errorMsg);
        }
    };

    const handlePickMedia = async () => {
        if (!normalizedConversationId) return;

        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Cần quyền", "Vui lòng cấp quyền thư viện ảnh.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsEditing: true,
            quality: 1,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const isVideo = asset.type === "video";

        try {
            await chatApi.sendFileMessage(normalizedConversationId, {
                uri: asset.uri,
                name: asset.fileName || `upload-${Date.now()}`,
                type: asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
            });
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể gửi file/media");
        }
    };

    const handleUnsendMessage = async () => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.revokeMessage(selectedMessage.id);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể thu hồi tin nhắn");
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.deleteMessage(selectedMessage.id);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể xóa tin nhắn");
        }
    };

    const loadForwardTargets = useCallback(async () => {
        setForwardLoading(true);
        try {
            const conversations = await chatApi.getConversations();
            setForwardTargets(
                Array.isArray(conversations)
                    ? conversations.filter(
                          (item: any) =>
                              item?.conversationId !== normalizedConversationId,
                      )
                    : [],
            );
        } catch (error) {
            console.error("[ChatScreen] loadForwardTargets error:", error);
            setForwardTargets([]);
        } finally {
            setForwardLoading(false);
        }
    }, [normalizedConversationId]);

    useEffect(() => {
        if (selectedMessage) {
            loadForwardTargets();
        } else {
            setForwardTargets([]);
        }
    }, [loadForwardTargets, selectedMessage]);

    const handleForwardMessage = async (targetConversationId: string) => {
        if (!selectedMessage?.id) return;
        if (!targetConversationId.trim()) {
            Alert.alert("Thiếu thông tin", "Chọn cuộc trò chuyện đích trước");
            return;
        }

        try {
            await chatApi.forwardMessage({
                sourceMessageId: selectedMessage.id,
                targetConversationId: targetConversationId.trim(),
            });
            Alert.alert("Thành công", "Đã chuyển tiếp tin nhắn");
            setSelectedMessage(null);
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.message || "Không thể chuyển tiếp tin nhắn",
            );
        }
    };

    const handleSearchMessages = async () => {
        if (!normalizedConversationId || !searchKeyword.trim()) return;
        setSearchLoading(true);
        try {
            const result = await chatApi.searchInConversation(
                normalizedConversationId,
                searchKeyword,
            );
            setSearchResults(Array.isArray(result) ? result : []);
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể tìm kiếm tin nhắn");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleLoadMedia = async () => {
        if (!normalizedConversationId) return;
        setMediaLoading(true);
        try {
            const result = await chatApi.getConversationMedia(
                normalizedConversationId,
            );
            setMediaItems(Array.isArray(result) ? result : []);
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể tải media");
        } finally {
            setMediaLoading(false);
        }
    };

    const handleHeaderBack = () => {
        if (from === "contact") {
            router.replace("/(tabs)/contact" as any);
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/(tabs)/message" as any);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
            >
                <View className="bg-blue-600 flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={handleHeaderBack}>
                            <MoveLeft size={26} color="white" />
                        </TouchableOpacity>

                        <View className="ml-3">
                            <Text className="text-white font-semibold text-[16px]">
                                {displayName}
                            </Text>
                            <View className="flex-row items-center flex-wrap">
                                <Text className="text-white text-[12px] opacity-80">
                                    {remoteTyping
                                        ? "đang nhập"
                                        : counterpartOnline
                                          ? "đang hoạt động"
                                          : counterpartLastActiveAt
                                            ? `Hoạt động ${formatRelativeActivity(counterpartLastActiveAt)}`
                                            : "không hiển thị trạng thái"}
                                </Text>
                                <Text className="text-white text-[12px] opacity-80 ml-2">
                                    {connected
                                        ? "• realtime on"
                                        : "• realtime off"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row items-center ml-9">
                        <TouchableOpacity>
                            <Phone size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 10 }}>
                            <Video size={26} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() => {
                                router.push({
                                    pathname:
                                        "/(tabs)/message/option/account-option" as any,
                                    params: {
                                        conversationId:
                                            normalizedConversationId,
                                        targetUserId: counterpartId,
                                        name: displayName,
                                        avatar: avatar || "",
                                    },
                                });
                            }}
                        >
                            <MoreHorizontal size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    className="flex-1 px-3 pt-4"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            opacity: entranceAnim,
                            transform: [
                                {
                                    translateY: entranceAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [8, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        {loading && (
                            <View className="py-8 items-center justify-center">
                                <ActivityIndicator
                                    size="small"
                                    color="#2563eb"
                                />
                            </View>
                        )}

                        {!loading &&
                            messages.map((msg, index) => {
                                const messageKey = getMessageKey(msg, index);
                                const messageSide = getMessageSide(msg);

                                if (messageSide === "center") {
                                    return (
                                        <View
                                            key={messageKey}
                                            className="flex-row justify-center mb-3"
                                        >
                                            <View className="bg-gray-200 px-3 py-2 rounded-full max-w-[85%]">
                                                {msg.text !== "" && (
                                                    <Text className="text-[13px] text-gray-700 text-center">
                                                        {msg.text}
                                                    </Text>
                                                )}

                                                {!msg.isUnsent && (
                                                    <Text className="text-gray-500 text-[11px] mt-1 text-center">
                                                        {msg.time}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                }

                                if (messageSide === "left") {
                                    return (
                                        <View
                                            key={messageKey}
                                            className="flex-row mb-3"
                                        >
                                            {avatarUrl ? (
                                                <RNImage
                                                    source={{ uri: avatarUrl }}
                                                    className="w-8 h-8 rounded-full mr-2"
                                                />
                                            ) : (
                                                <View className="w-8 h-8 rounded-full bg-blue-500 mr-2 items-center justify-center">
                                                    <Text className="text-white text-xs font-semibold">
                                                        {getInitials(
                                                            displayName,
                                                        )}
                                                    </Text>
                                                </View>
                                            )}

                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    if (
                                                        msg.imageUri ||
                                                        msg.videoUri
                                                    ) {
                                                        setViewingMediaMessage(
                                                            msg,
                                                        );
                                                    }
                                                }}
                                                onLongPress={() => {
                                                    if (!msg.system) {
                                                        setSelectedMessage(
                                                            msg.raw || msg,
                                                        );
                                                    }
                                                }}
                                                className="bg-white px-4 py-2 rounded-2xl max-w-[70%]"
                                            >
                                                {msg.senderName && (
                                                    <Text className="mb-1 text-[11px] font-medium text-gray-400">
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
                                                            backgroundColor:
                                                                "black",
                                                        }}
                                                    >
                                                        <AVVideo
                                                            source={{
                                                                uri: msg.videoUri,
                                                            }}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                            }}
                                                            resizeMode={
                                                                ResizeMode.COVER
                                                            }
                                                            shouldPlay={false}
                                                        />
                                                    </View>
                                                ) : msg.imageUri ? (
                                                    <RNImage
                                                        source={{
                                                            uri: msg.imageUri,
                                                        }}
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
                                                    <Text className="text-[15px] text-black">
                                                        {msg.text}
                                                    </Text>
                                                )}

                                                <Text className="text-gray-500 text-[11px] mt-1">
                                                    {msg.time}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }

                                return (
                                    <View
                                        key={messageKey}
                                        className="flex-row justify-end mb-3"
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                if (
                                                    msg.imageUri ||
                                                    msg.videoUri
                                                ) {
                                                    setViewingMediaMessage(msg);
                                                }
                                            }}
                                            onLongPress={() => {
                                                if (!msg.system) {
                                                    setSelectedMessage(
                                                        msg.raw || msg,
                                                    );
                                                }
                                            }}
                                            className={`bg-blue-600 px-4 py-2 rounded-2xl max-w-[70%] ${
                                                msg.pending ? "opacity-70" : ""
                                            }`}
                                        >
                                            {msg.videoUri ? (
                                                <View
                                                    style={{
                                                        width: 150,
                                                        height: 150,
                                                        borderRadius: 10,
                                                        marginBottom: 4,
                                                        overflow: "hidden",
                                                        backgroundColor:
                                                            "black",
                                                    }}
                                                >
                                                    <AVVideo
                                                        source={{
                                                            uri: msg.videoUri,
                                                        }}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                        }}
                                                        resizeMode={
                                                            ResizeMode.COVER
                                                        }
                                                        shouldPlay={false}
                                                    />
                                                </View>
                                            ) : msg.imageUri ? (
                                                <RNImage
                                                    source={{
                                                        uri: msg.imageUri,
                                                    }}
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
                                                <Text className="text-[15px] text-white">
                                                    {msg.text}
                                                </Text>
                                            )}

                                            <Text className="text-blue-100 text-[11px] mt-1 text-right">
                                                {getMessageStatusLabel(msg)}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                    </Animated.View>
                </ScrollView>

                <View className="bg-white px-3 py-2 border-t border-gray-200">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={handlePickMedia}
                            className="mr-2"
                        >
                            <Paperclip size={22} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowSearchSheet(true)}
                            className="mr-2"
                        >
                            <Search size={22} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setShowMediaSheet(true);
                                handleLoadMedia();
                            }}
                            className="mr-2"
                        >
                            <Image size={22} color="#6b7280" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mt-1 text-[15px]"
                            placeholder="Nhập tin nhắn"
                            value={message}
                            onChangeText={setMessage}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            className="ml-2 bg-blue-600 rounded-full p-2"
                        >
                            <Send size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={!!selectedMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setSelectedMessage(null)}
                >
                    <View className="flex-1 bg-black/40 justify-end px-4 pb-10">
                        <View className="bg-white rounded-2xl p-4">
                            <TouchableOpacity
                                className="py-3 flex-row items-center"
                                onPress={handleUnsendMessage}
                            >
                                <Image size={18} color="#f97316" />
                                <Text className="ml-2 text-sm text-gray-700">
                                    Thu hồi
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="py-3 flex-row items-center"
                                onPress={handleDeleteMessage}
                            >
                                <Trash2 size={18} color="#ef4444" />
                                <Text className="ml-2 text-sm text-red-500">
                                    Xóa phía mình
                                </Text>
                            </TouchableOpacity>

                            <View className="mt-2 border-t border-gray-100 pt-3">
                                <Text className="text-sm font-semibold text-gray-900 mb-2">
                                    Chuyển tiếp tới
                                </Text>

                                {forwardLoading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#2563eb"
                                    />
                                ) : (
                                    <ScrollView
                                        className="max-h-[240px]"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {forwardTargets.length === 0 ? (
                                            <Text className="text-xs text-gray-500">
                                                Không có cuộc trò chuyện khác.
                                            </Text>
                                        ) : (
                                            forwardTargets.map((item: any) => (
                                                <TouchableOpacity
                                                    key={item.conversationId}
                                                    className="flex-row items-center py-3 border-b border-gray-100"
                                                    onPress={() =>
                                                        handleForwardMessage(
                                                            item.conversationId,
                                                        )
                                                    }
                                                >
                                                    <View className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center mr-3">
                                                        <Text className="text-white text-[11px] font-semibold">
                                                            {getInitials(
                                                                pickBestDisplayName(
                                                                    [
                                                                        item.counterpartName,
                                                                    ],
                                                                    "Nguoi dung",
                                                                ),
                                                            )}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-sm font-medium text-gray-900">
                                                            {pickBestDisplayName(
                                                                [
                                                                    item.counterpartName,
                                                                ],
                                                                "Nguoi dung",
                                                            )}
                                                        </Text>
                                                        <Text className="text-[11px] text-gray-500 mt-0.5">
                                                            {item.lastMessage ||
                                                                "Nhấn để chuyển tiếp"}
                                                        </Text>
                                                    </View>
                                                    <CornerUpLeft
                                                        size={18}
                                                        color="#2563eb"
                                                    />
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                )}
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={showSearchSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSearchSheet(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setShowSearchSheet(false)}
                >
                    <View className="flex-1 bg-black/30 justify-end">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-t-3xl px-4 pt-4 pb-7 max-h-[70%]">
                                <Text className="text-base font-semibold text-gray-900 mb-3">
                                    Tìm trong cuộc trò chuyện
                                </Text>
                                <View className="flex-row items-center mb-3">
                                    <TextInput
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                        placeholder="Search keyword"
                                        value={searchKeyword}
                                        onChangeText={setSearchKeyword}
                                    />
                                    <TouchableOpacity
                                        className="ml-2 px-3 py-2 rounded-xl bg-gray-700"
                                        onPress={handleSearchMessages}
                                    >
                                        <Text className="text-white text-xs">
                                            Search
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {searchLoading && (
                                    <ActivityIndicator
                                        size="small"
                                        color="#2563eb"
                                    />
                                )}

                                <ScrollView>
                                    {searchResults.length === 0 &&
                                        !searchLoading && (
                                            <Text className="text-xs text-gray-500">
                                                Chưa có kết quả tìm kiếm
                                            </Text>
                                        )}
                                    {searchResults.map((item: any) => (
                                        <View
                                            key={item.id}
                                            className="py-2 border-b border-gray-100"
                                        >
                                            <Text className="text-sm text-gray-800">
                                                {item.content || "(trống)"}
                                            </Text>
                                            <Text className="text-xs text-gray-500 mt-1">
                                                {item.createdAt
                                                    ? new Date(
                                                          item.createdAt,
                                                      ).toLocaleString("vi-VN")
                                                    : ""}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={showMediaSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowMediaSheet(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setShowMediaSheet(false)}
                >
                    <View className="flex-1 bg-black/30 justify-end">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-t-3xl px-4 pt-4 pb-7 max-h-[70%]">
                                <Text className="text-base font-semibold text-gray-900 mb-3">
                                    Media trong cuộc trò chuyện
                                </Text>

                                {mediaLoading && (
                                    <ActivityIndicator
                                        size="small"
                                        color="#2563eb"
                                    />
                                )}

                                <ScrollView>
                                    {mediaItems.length === 0 &&
                                        !mediaLoading && (
                                            <Text className="text-xs text-gray-500">
                                                Chưa có media
                                            </Text>
                                        )}
                                    {mediaItems.map((item: any) => {
                                        const fileUrl = resolveFileUrl(
                                            item?.attachment?.fileUrl,
                                        );
                                        const isVideo = item?.type === "VIDEO";
                                        const isImage = item?.type === "IMAGE";

                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                className="py-2 border-b border-gray-100"
                                                onPress={() => {
                                                    if (!fileUrl) return;
                                                    setViewingMediaMessage({
                                                        imageUri: isImage
                                                            ? fileUrl
                                                            : null,
                                                        videoUri: isVideo
                                                            ? fileUrl
                                                            : null,
                                                    });
                                                }}
                                            >
                                                <Text className="text-sm text-gray-800">
                                                    {item?.type === "VIDEO"
                                                        ? "Video"
                                                        : item?.type === "IMAGE"
                                                          ? "Hình ảnh"
                                                          : "Media"}
                                                </Text>
                                                <Text className="text-xs text-gray-500 mt-1">
                                                    {item?.createdAt
                                                        ? new Date(
                                                              item.createdAt,
                                                          ).toLocaleString(
                                                              "vi-VN",
                                                          )
                                                        : ""}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={!!viewingMediaMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setViewingMediaMessage(null)}
            >
                {viewingMediaMessage && (
                    <View className="flex-1 bg-black justify-center items-center">
                        <TouchableOpacity
                            className="absolute top-14 right-5 z-20"
                            onPress={() => setViewingMediaMessage(null)}
                        >
                            <Text className="text-white text-lg">Đóng</Text>
                        </TouchableOpacity>

                        {viewingMediaMessage.videoUri ? (
                            <AVVideo
                                source={{ uri: viewingMediaMessage.videoUri }}
                                style={{ width: "95%", height: "60%" }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                            />
                        ) : viewingMediaMessage.imageUri ? (
                            <RNImage
                                source={{ uri: viewingMediaMessage.imageUri }}
                                style={{
                                    width: "95%",
                                    height: "70%",
                                    resizeMode: "contain",
                                }}
                            />
                        ) : null}
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}
