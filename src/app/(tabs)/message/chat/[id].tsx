import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { useChatAttachments } from "@/src/hooks/useChatAttchment";
import { useChatRealtime } from "@/src/hooks/useChatRealtime";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { Video as AVVideo, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
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

    if (
        message?.readAt ||
        message?.raw?.readAt ||
        message?.raw?.seenAt ||
        message?.raw?.isRead === true ||
        message?.raw?.is_read === true
    ) {
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
        targetUserId?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        from?: string | string[];
    }>();

    const id = paramStr(params.id);
    const targetUserId = paramStr(params.targetUserId);
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);
    const from = paramStr(params.from);

    const [resolvedConversationId, setResolvedConversationId] =
        useState<string>("");
    const normalizedConversationId = id || resolvedConversationId;

    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [forwardTargets, setForwardTargets] = useState<any[]>([]);
    const [counterpartId, setCounterpartId] = useState("");
    const [counterpartName, setCounterpartName] = useState("");
    const [counterpartAvatar, setCounterpartAvatar] = useState("");
    const [counterpartOnline, setCounterpartOnline] = useState(false);
    const [counterpartLastActiveAt, setCounterpartLastActiveAt] = useState("");
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [showSearchSheet, setShowSearchSheet] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [viewingMediaMessage, setViewingMediaMessage] = useState<any>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entranceAnim = useRef(new Animated.Value(0)).current;

    const scrollViewRef = useRef<ScrollView>(null);
    const realNameRef = useRef<string>("");

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
            const isMe = !isCenter && mineBySender;

            const fileUrl = item?.attachment?.fileUrl;
            const type = item?.type || "TEXT";

            const rawSenderName = item?.senderName || "";
            const isSenderPhone = /^\+?\d{8,15}$/.test(
                rawSenderName.replace(/[\s.-]/g, ""),
            );
            const finalSenderName =
                !isMe && !isCenter && isSenderPhone && realNameRef.current
                    ? realNameRef.current
                    : rawSenderName;

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
                senderName: finalSenderName,
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

                if (!mappedId) return;

                setMessages((prev) => {
                    const index = prev.findIndex(
                        (item) => (item?.id || item?.raw?.id) === mappedId,
                    );
                    if (index === -1) {
                        return [...prev, mapped];
                    }

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
        if (!normalizedConversationId && !targetUserId) {
            return;
        }

        const conversationKey = normalizedConversationId || targetUserId || "";
        if (!conversationKey) {
            return;
        }

        setLoading(true);

        const updateConversationState = async (detail: any) => {
            const rawCounterpartName = detail?.counterpartName || "";

            const isPhoneNumber = /^\+?\d{8,15}$/.test(
                rawCounterpartName.replace(/[\s.-]/g, ""),
            );

            const needsLookup =
                isGenericDisplayName(rawCounterpartName) ||
                isPhoneNumber ||
                !(
                    detail?.counterpartAvatarUrl ||
                    detail?.counterpartAvatar ||
                    detail?.profilePicture ||
                    detail?.avatar
                );

            let counterpartDisplayName = pickBestDisplayName(
                [
                    isGenericDisplayName(rawCounterpartName)
                        ? ""
                        : rawCounterpartName,
                    detail?.counterpartUserName,
                    detail?.counterpartDisplayName,
                    detail?.displayName,
                    detail?.userName,
                    detail?.username,
                    detail?.name,
                    name,
                ],
                "Tro chuyen",
            );

            let counterpartDisplayAvatar =
                detail?.counterpartAvatarUrl ||
                detail?.counterpartAvatar ||
                detail?.avatar ||
                "";

            const counterpartId =
                detail?.counterpartId || detail?.targetUserId || "";

            if (needsLookup && counterpartId) {
                try {
                    const userRes = await friendApi.getUserById(counterpartId);
                    const profile = userRes?.data || userRes;

                    const combinedName =
                        `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();

                    counterpartDisplayName = pickBestDisplayName(
                        [
                            profile?.fullName,
                            combinedName,
                            profile?.displayName,
                            profile?.name,
                            profile?.userName,
                            profile?.username,
                            name,
                            isGenericDisplayName(rawCounterpartName)
                                ? ""
                                : rawCounterpartName,
                        ],
                        "Tro chuyen",
                    );

                    counterpartDisplayAvatar =
                        counterpartDisplayAvatar ||
                        profile?.avatarUrl ||
                        profile?.avatar ||
                        "";
                } catch (error) {
                    console.error(
                        "[ChatScreen] counterpart lookup error:",
                        error,
                    );
                }
            }

            realNameRef.current = counterpartDisplayName;

            const mapped = dedupeMessages(
                Array.isArray(detail?.messages)
                    ? detail.messages.map(mapApiMessageToUi)
                    : [],
            );
            setMessages(mapped);
            setCounterpartId(
                detail?.counterpartId || detail?.targetUserId || "",
            );
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
                ),
            );
        };

        try {
            const detail = await chatApi.getConversationDetail(conversationKey);
            if (!normalizedConversationId && targetUserId) {
                setResolvedConversationId(conversationKey);
            }

            updateConversationState(detail);
            chatApi.markRead(conversationKey);
        } catch (error: any) {
            if (targetUserId && conversationKey === targetUserId) {
                try {
                    const resolvedId =
                        await chatApi.findConversationIdByUserId(targetUserId);
                    if (resolvedId) {
                        setResolvedConversationId(resolvedId);
                        const detail =
                            await chatApi.getConversationDetail(resolvedId);
                        await updateConversationState(detail);
                        await chatApi.markRead(resolvedId);
                        return;
                    }
                } catch (resolveError) {
                    console.warn(
                        "resolveConversationIdByUserId failed:",
                        resolveError,
                    );
                }
            }

            Alert.alert(
                "Lỗi",
                error?.message || "Không thể tải cuộc trò chuyện.",
            );
        } finally {
            setLoading(false);
        }
    }, [mapApiMessageToUi, name, normalizedConversationId, targetUserId]);

    const { handlePickMedia, handlePickFile, handleOpenFile } =
        useChatAttachments(normalizedConversationId, loadConversationDetail);

    useEffect(() => {
        (async () => {
            try {
                const sub = await chatAuthUtils.getCurrentUserId();
                if (sub) {
                    setCurrentUserId(sub);
                }
            } catch (error) {
                setCurrentUserId("");
            }
        })();
    }, []);

    useEffect(() => {
        loadConversationDetail();
    }, [loadConversationDetail]);

    const handleIncomingRealtimeMessage = useCallback(
        (payload: any) => {
            if (Array.isArray(payload)) {
                const currentConv = payload.find(
                    (conv) => conv?.conversationId === normalizedConversationId,
                );

                if (currentConv) {
                    loadConversationDetail();
                }
                return;
            }

            const incoming = payload?.data || payload?.message || payload;
            const incomingConversationId =
                incoming?.conversationId || payload?.conversationId;
            const incomingType = String(
                incoming?.type ||
                    payload?.type ||
                    incoming?.action ||
                    payload?.action ||
                    "",
            ).toUpperCase();

            if (
                incomingConversationId &&
                incomingConversationId !== normalizedConversationId
            ) {
                return;
            }

            if (incomingType === "TYPING") {
                setRemoteTyping(true);
                if (typingTimerRef.current)
                    clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(
                    () => setRemoteTyping(false),
                    2000,
                );
                return;
            }

            const isReadEvent =
                incomingType === "READ" ||
                incomingType === "SEEN" ||
                incomingType === "MARK_READ" ||
                incoming?.status === "READ" ||
                incoming?.isRead === true;

            if (isReadEvent) {
                loadConversationDetail();
                return;
            }

            if (incoming?.id) {
                mergeIncomingMessage(incoming);

                if (normalizedConversationId) {
                    chatApi.markRead(normalizedConversationId).catch((err) => {
                        console.log("[ChatScreen] Mark read error:", err);
                    });
                }
                return;
            }

            loadConversationDetail();
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

    const handleSend = async () => {
        const content = message.trim();
        if (!normalizedConversationId || !content) return;

        const payload = {
            conversationId: normalizedConversationId,
            senderId: currentUserId,
            type: "TEXT",
            content,
        };

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
                                ? { ...serverMessage, pending: false }
                                : item,
                        ),
                    ),
                );
            }
        } catch (error: any) {
            setMessages((prev) =>
                prev.filter((item) => item.id !== optimisticId),
            );
            setMessage(content);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn");
        }
    };

    const handleUnsendMessage = async () => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.revokeMessage(selectedMessage.id);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể thu hồi tin nhắn");
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.deleteMessage(selectedMessage.id);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể xóa tin nhắn");
        }
    };

    const handleForwardMessage = async (targetId: string) => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.forwardMessage({
                sourceMessageId: selectedMessage.id,
                targetConversationId: targetId,
            });
            Alert.alert("Thành công", "Đã chuyển tiếp");
            setSelectedMessage(null);
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể chuyển tiếp");
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
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectMessage = async (msg: any) => {
        setSelectedMessage(msg.raw || msg);

        try {
            const conversations = await chatApi.getConversations();
            let targets = Array.isArray(conversations)
                ? conversations.filter(
                      (conv) =>
                          conv.conversationId !== normalizedConversationId,
                  )
                : [];

            targets = await Promise.all(
                targets.map(async (target) => {
                    const rawCounterpartName = target?.counterpartName || "";

                    const isPhoneNumber = /^\+?\d{8,15}$/.test(
                        rawCounterpartName.replace(/[\s.-]/g, ""),
                    );

                    const needsLookup =
                        isGenericDisplayName(rawCounterpartName) ||
                        isPhoneNumber ||
                        !(
                            target?.counterpartAvatarUrl ||
                            target?.counterpartAvatar ||
                            target?.profilePicture ||
                            target?.avatar
                        );

                    let displayName = pickBestDisplayName(
                        [
                            isGenericDisplayName(rawCounterpartName)
                                ? ""
                                : rawCounterpartName,
                            target?.counterpartUserName,
                            target?.counterpartDisplayName,
                            target?.displayName,
                            target?.userName,
                            target?.username,
                            target?.name,
                        ],
                        "Trò chuyện",
                    );

                    let displayAvatar =
                        target?.counterpartAvatarUrl ||
                        target?.counterpartAvatar ||
                        target?.avatar ||
                        "";

                    const targetUserId =
                        target?.counterpartId || target?.targetUserId || "";

                    if (needsLookup && targetUserId) {
                        try {
                            const userRes =
                                await friendApi.getUserById(targetUserId);
                            const profile = userRes?.data || userRes;

                            const combinedName =
                                `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();

                            displayName = pickBestDisplayName(
                                [
                                    profile?.fullName,
                                    combinedName,
                                    profile?.displayName,
                                    profile?.name,
                                    profile?.userName,
                                    profile?.username,
                                    isGenericDisplayName(rawCounterpartName)
                                        ? ""
                                        : rawCounterpartName,
                                ],
                                "Trò chuyện",
                            );

                            displayAvatar =
                                displayAvatar ||
                                profile?.avatarUrl ||
                                profile?.avatar ||
                                "";
                        } catch (error) {
                            console.warn(
                                "[handleSelectMessage] User lookup failed for",
                                targetUserId,
                                error,
                            );
                        }
                    }

                    return {
                        ...target,
                        _displayName: displayName,
                        _displayAvatar: displayAvatar,
                    };
                }),
            );

            setForwardTargets(targets);
        } catch (error) {
            console.error(
                "[ChatScreen] Error fetching forward targets:",
                error,
            );
            setForwardTargets([]);
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
                {/* Header */}
                <View className="bg-blue-600 flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={handleHeaderBack}>
                            <MoveLeft size={26} color="white" />
                        </TouchableOpacity>

                        <View className="ml-3">
                            <TouchableOpacity
                                onPress={() =>
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
                                    })
                                }
                            >
                                <Text className="text-white font-semibold text-[16px]">
                                    {displayName}
                                </Text>
                                <View className="flex-row items-center flex-wrap">
                                    <Text className="text-white text-[12px] opacity-80">
                                        {counterpartOnline
                                            ? "đang hoạt động"
                                            : counterpartLastActiveAt
                                              ? `Hoạt động ${formatRelativeActivity(counterpartLastActiveAt)}`
                                              : "ngoại tuyến"}
                                    </Text>
                                    <Text className="text-white text-[12px] opacity-80 ml-2">
                                        {connected
                                            ? "• realtime on"
                                            : "• realtime off"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
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
                            onPress={() =>
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
                                })
                            }
                        >
                            <MoreHorizontal size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages List */}
                <ScrollView
                    className="flex-1 px-3 pt-4"
                    showsVerticalScrollIndicator={false}
                    ref={scrollViewRef}
                    onContentSizeChange={() =>
                        scrollViewRef.current?.scrollToEnd({ animated: true })
                    }
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
                            <View className="py-8 items-center">
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

                                // CENTER MESSAGE
                                if (messageSide === "center") {
                                    return (
                                        <View
                                            key={messageKey}
                                            className="flex-row justify-center mb-3"
                                        >
                                            <View className="bg-gray-200 px-3 py-2 rounded-full max-w-[85%]">
                                                <Text className="text-[13px] text-gray-700 text-center">
                                                    {msg.text}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                }

                                // LEFT & RIGHT MESSAGE
                                const isMe = messageSide === "right";
                                return (
                                    <View
                                        key={messageKey}
                                        className={`flex-row mb-3 ${isMe ? "justify-end" : ""}`}
                                    >
                                        {!isMe &&
                                            (avatarUrl ? (
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
                                            ))}
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onLongPress={() =>
                                                !msg.system &&
                                                handleSelectMessage(msg)
                                            }
                                            onPress={() => {
                                                if (
                                                    msg.imageUri ||
                                                    msg.videoUri
                                                ) {
                                                    setViewingMediaMessage(msg);
                                                } else if (
                                                    msg.raw?.type === "FILE" ||
                                                    msg.raw?.attachment
                                                ) {
                                                    const url = resolveFileUrl(
                                                        msg.raw?.attachment
                                                            ?.fileUrl,
                                                    );
                                                    handleOpenFile(
                                                        url,
                                                        msg.text || "Tài liệu",
                                                    );
                                                }
                                            }}
                                            className={`${isMe ? "bg-blue-500" : "bg-white"} px-4 py-2 rounded-2xl max-w-[70%] ${msg.pending ? "opacity-70" : ""}`}
                                        >
                                            {!isMe && msg.senderName && (
                                                <Text className="mb-1 text-[11px] font-medium text-gray-400">
                                                    {msg.senderName}
                                                </Text>
                                            )}

                                            {/* FILE BLOCK */}
                                            {msg.raw?.type === "FILE" && (
                                                <View
                                                    className={`flex-row items-center mb-1 p-2 rounded-lg ${isMe ? "bg-blue-700" : "bg-gray-100"}`}
                                                >
                                                    <Paperclip
                                                        size={16}
                                                        color={
                                                            isMe
                                                                ? "white"
                                                                : "#4b5563"
                                                        }
                                                    />
                                                    <Text
                                                        className={`ml-2 font-medium ${isMe ? "text-white" : "text-blue-600"}`}
                                                        numberOfLines={1}
                                                    >
                                                        {msg.text || "Tài liệu"}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* MEDIA BLOCK */}
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

                                            {/* TEXT */}
                                            {msg.text !== "" &&
                                                !(msg.raw?.type === "FILE") && (
                                                    <Text
                                                        className={`text-[15px] ${isMe ? "text-white" : "text-black"}`}
                                                    >
                                                        {msg.text}
                                                    </Text>
                                                )}
                                            <Text
                                                className={`text-[11px] mt-1 ${isMe ? "text-blue-100 text-right" : "text-gray-500"}`}
                                            >
                                                {isMe
                                                    ? getMessageStatusLabel(msg)
                                                    : msg.time}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                    </Animated.View>
                </ScrollView>

                {/* Input Bar */}
                <View className="bg-white px-3 py-2 border-t border-gray-200">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={handlePickFile}
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
                            onPress={handlePickMedia}
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
                            className="ml-2 bg-blue-400 rounded-full p-2"
                        >
                            <Send size={18} color="white" />
                        </TouchableOpacity>
                    </View>
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
                                <Text className="text-sm font-semibold mb-2">
                                    Chuyển tiếp tới
                                </Text>
                                <ScrollView className="max-h-[200px]">
                                    {forwardTargets.map((item: any) => {
                                        const displayName =
                                            item._displayName ||
                                            item.counterpartName ||
                                            "Trò chuyện";
                                        const displayAvatar =
                                            item._displayAvatar ||
                                            item.counterpartAvatarUrl ||
                                            item.counterpartAvatar ||
                                            "";

                                        return (
                                            <TouchableOpacity
                                                key={item.conversationId}
                                                className="flex-row items-center py-3 border-b border-gray-100"
                                                onPress={() =>
                                                    handleForwardMessage(
                                                        item.conversationId,
                                                    )
                                                }
                                            >
                                                {displayAvatar ? (
                                                    <RNImage
                                                        source={{
                                                            uri: displayAvatar,
                                                        }}
                                                        className="w-9 h-9 rounded-full mr-3"
                                                    />
                                                ) : (
                                                    <View className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center mr-3">
                                                        <Text className="text-white text-xs font-semibold">
                                                            {getInitials(
                                                                displayName,
                                                            )}
                                                        </Text>
                                                    </View>
                                                )}
                                                <Text className="text-sm font-medium text-gray-800 flex-1">
                                                    {displayName}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Media Viewer Modal */}
            <Modal
                visible={!!viewingMediaMessage}
                transparent
                animationType="fade"
            >
                <View className="flex-1 bg-black justify-center items-center">
                    <TouchableOpacity
                        className="absolute top-14 right-5 z-20"
                        onPress={() => setViewingMediaMessage(null)}
                    >
                        <Text className="text-white text-lg">Đóng</Text>
                    </TouchableOpacity>
                    {viewingMediaMessage?.videoUri ? (
                        <AVVideo
                            source={{ uri: viewingMediaMessage.videoUri }}
                            style={{ width: "95%", height: "60%" }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                        />
                    ) : viewingMediaMessage?.imageUri ? (
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
            </Modal>

            {/* Search Modal */}
            <Modal visible={showSearchSheet} transparent animationType="slide">
                <View className="flex-1 bg-black/30 justify-end">
                    <View className="bg-white rounded-t-3xl px-4 pt-4 pb-7 max-h-[70%]">
                        <Text className="text-base font-semibold mb-3">
                            Tìm trong cuộc trò chuyện
                        </Text>
                        <View className="flex-row mb-3">
                            <TextInput
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
                                placeholder="Nhập từ khóa"
                                value={searchKeyword}
                                onChangeText={setSearchKeyword}
                            />
                            <TouchableOpacity
                                className="ml-2 px-4 py-2 bg-blue-600 rounded-xl"
                                onPress={handleSearchMessages}
                            >
                                <Text className="text-white">Tìm</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {searchResults.map((item: any) => (
                                <View
                                    key={item.id}
                                    className="py-2 border-b border-gray-100"
                                >
                                    <Text className="text-sm">
                                        {item.content}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowSearchSheet(false)}
                            className="mt-4 items-center"
                        >
                            <Text className="text-blue-600">Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
