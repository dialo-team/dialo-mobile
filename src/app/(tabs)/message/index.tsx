import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { useChatRealtime } from "@/src/hooks/useChatRealtime";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useFocusEffect, useRouter } from "expo-router";
import {
    Plus,
    ScanQrCode,
    Search,
    UserRoundPlus,
    Users,
} from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Easing,
    Image,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Conversation = {
    conversationId: string;
    counterpartId?: string;
    counterpartName?: string;
    counterpartAvatarUrl?: string;
    lastMessage?: string;
    lastMessageAt?: string;
    lastMessageType?: string;
    unreadCount?: number;
    dissolved?: boolean;
};

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

export default function MessagesScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(
        new Set(),
    );
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listEntrance = useRef(new Animated.Value(0)).current;

    const loadConversations = useCallback(
        async (currentBlockedIds?: Set<string>) => {
            if (!currentUserId) return;
            setLoading(true);

            try {
                const response = await chatApi.getConversations();
                const rawList = Array.isArray(response)
                    ? response
                    : (response as any)?.data || [];

                const activeList = rawList.filter((conv: any) => {
                    const isDissolved = conv.dissolved === true;
                    const isDissolveSystemMessage =
                        conv.lastMessageSystem === true &&
                        conv.lastMessage === "Nhóm đã được giải tán";
                    return !isDissolved && !isDissolveSystemMessage;
                });

                const extractProfileDisplayInfo = (profile: any) => {
                    const combinedName =
                        `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();
                    return {
                        name: pickBestDisplayName(
                            [
                                profile?.remarkName,
                                profile?.displayName,
                                profile?.fullName,
                                combinedName,
                                profile?.userName,
                                profile?.username,
                                profile?.name,
                                profile?.nickName,
                                profile?.nickname,
                            ],
                            "Người dùng",
                        ),
                        avatar:
                            profile?.avatarUrl ||
                            profile?.avatar ||
                            profile?.profilePictureUrl ||
                            profile?.profilePicture ||
                            "",
                    };
                };

                const enriched = await Promise.all(
                    activeList.map(async (conversation: any) => {
                        const baseName = pickBestDisplayName(
                            [
                                conversation.counterpartName,
                                conversation.remarkName,
                                conversation.counterpartUserName,
                                conversation.displayName,
                            ],
                            "Người dùng",
                        );

                        const baseAvatar =
                            conversation.counterpartAvatarUrl ||
                            conversation.avatarUrl ||
                            "";

                        if (!isGenericDisplayName(baseName) && baseAvatar) {
                            return {
                                ...conversation,
                                counterpartName: baseName,
                                counterpartAvatarUrl: baseAvatar,
                            };
                        }

                        try {
                            if (!conversation.counterpartId)
                                return conversation;
                            const userRes = await friendApi.getUserById(
                                conversation.counterpartId,
                            );
                            const profile = userRes?.data || userRes;
                            const profileDisplay =
                                extractProfileDisplayInfo(profile);

                            return {
                                ...conversation,
                                counterpartName: !isGenericDisplayName(baseName)
                                    ? baseName
                                    : profileDisplay.name,
                                counterpartAvatarUrl:
                                    baseAvatar || profileDisplay.avatar,
                            };
                        } catch {
                            return {
                                ...conversation,
                                counterpartName: baseName,
                                counterpartAvatarUrl: baseAvatar,
                            };
                        }
                    }),
                );

                setConversations(enriched);
            } catch (e: any) {
                setError("Không thể tải danh sách cuộc trò chuyện");
            } finally {
                setLoading(false);
            }
        },
        [currentUserId],
    ); // 👈 CHỈ phụ thuộc vào currentUserId

    const debounceRefreshConversations = useCallback(
        (payload?: any) => {
            if (payload) {
                const senderId = payload?.senderId;
                if (senderId && blockedUserIds.has(String(senderId))) {
                    console.log(
                        "[MessagesScreen] Ignoring realtime update from blocked sender:",
                        senderId,
                    );
                    return;
                }
            }
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
            console.log("[MessagesScreen] Debounced refresh scheduled");
            refreshTimerRef.current = setTimeout(() => {
                loadConversations();
            }, 1000);
        },
        [loadConversations, blockedUserIds],
    );

    useEffect(() => {
        (async () => {
            try {
                const userId = await chatAuthUtils.getCurrentUserId();
                if (userId) {
                    setCurrentUserId(userId);
                } else {
                    setCurrentUserId("");
                    setError("Bạn chưa đăng nhập hoặc phiên đã hết hạn.");
                }
            } catch (error) {
                console.error("Error getting current user ID:", error);
                setCurrentUserId("");
                setError("Không thể xác thực người dùng hiện tại.");
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const initScreenData = async () => {
                if (!currentUserId) return;

                try {
                    // 1. Lấy danh sách chặn mới nhất (Dùng biến cục bộ)
                    const blockedList = await friendApi.getBlockedUsers();
                    const freshBlockedIds = new Set<string>();
                    (Array.isArray(blockedList) ? blockedList : []).forEach(
                        (item: any) => {
                            const id =
                                item?.blockedUserId ||
                                item?.targetId ||
                                item?.id;
                            if (id) freshBlockedIds.add(String(id));
                        },
                    );

                    if (!isMounted) return;

                    // 2. Cập nhật state để dùng cho các logic khác
                    setBlockedUserIds(freshBlockedIds);

                    // 3. Gọi loadConversations và truyền trực tiếp IDs vừa lấy được
                    await loadConversations(freshBlockedIds);
                } catch (err) {
                    console.error("Lỗi khởi tạo MessagesScreen:", err);
                }
            };

            initScreenData();

            // Animation khởi tạo
            Animated.timing(listEntrance, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: Platform.OS !== "web",
            }).start();

            return () => {
                isMounted = false;
            };
        }, [currentUserId, loadConversations]),
    );

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, []);

    const { connected } = useChatRealtime({
        currentUserId,
        onInboxPayload: debounceRefreshConversations,
    });

    const getAvatarColor = (value: string) => {
        const colors = [
            "bg-blue-500",
            "bg-sky-500",
            "bg-cyan-500",
            "bg-indigo-500",
            "bg-emerald-500",
            "bg-rose-500",
            "bg-amber-500",
            "bg-violet-500",
        ];
        const hash = value
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const getConversationDisplayName = (conversation: Conversation) =>
        pickBestDisplayName(
            [
                (conversation as any)?.counterpartName,
                (conversation as any)?.remarkName,
                (conversation as any)?.counterpartUserName,
                (conversation as any)?.displayName,
                (conversation as any)?.userName,
                (conversation as any)?.name,
                (conversation as any)?.fullName,
                (conversation as any)?.nickName,
            ],
            "Người dùng",
        );

    const plusMenu = [
        {
            id: "1",
            icon: <UserRoundPlus size={20} color="gray" />,
            title: "Thêm bạn",
            route: "/contact/friend/add",
        },
        {
            id: "2",
            icon: <Users size={20} color="gray" />,
            title: "Tạo nhóm",
            route: "/contact/group/create",
        },
    ];

    useEffect(() => {
        Animated.timing(listEntrance, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
        }).start();
    }, [listEntrance]);

    const filteredConversations = useMemo(
        () =>
            conversations.filter((conversation) => {
                // Kiểm tra giải tán
                if (conversation.dissolved === true) return false;

                // Kiểm tra tìm kiếm
                return getConversationDisplayName(conversation)
                    .toLowerCase()
                    .includes(searchText.toLowerCase().trim());
            }),
        [conversations, searchText],
    );

    const formatLastTime = (value?: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatPreview = (item: Conversation) => {
        const isGroup = item.conversationId === item.counterpartId;
        const counterpartId = String(
            item?.counterpartId || item?.targetUserId || "",
        );
        if (!isGroup && counterpartId && blockedUserIds.has(counterpartId)) {
            return "Tin nhắn đã ẩn do chặn";
        }
        if (item.lastMessageType === "IMAGE") return "[Ảnh]";
        if (item.lastMessageType === "VIDEO") return "[Video]";
        if (item.lastMessageType === "FILE") return "[File]";
        return item.lastMessage || "";
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <Search size={26} color="white" />
                <TextInput
                    placeholder="Tìm kiếm"
                    placeholderTextColor="#93C5FD"
                    className="flex-1 text-white text-[16px] ml-3 opacity-80"
                    value={searchText}
                    onChangeText={setSearchText}
                />

                <TouchableOpacity
                    className="ml-3"
                    onPress={() => router.push("/message/qr-scanner" as any)}
                >
                    <ScanQrCode size={26} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="ml-3"
                    onPress={() => setShowMenu(!showMenu)}
                >
                    <Plus size={26} color="white" />
                </TouchableOpacity>
            </View>

            {!connected && (
                <View className="px-4 py-2 bg-amber-50 border-b border-amber-200">
                    <Text className="text-xs text-amber-800">
                        Realtime đang gián đoạn, danh sách có thể cập nhật chậm.
                    </Text>
                </View>
            )}

            {!!error && (
                <View className="px-4 py-2 bg-red-50 border-b border-red-200">
                    <Text className="text-red-500 text-sm">{error}</Text>
                </View>
            )}

            {/* Conversations List */}
            <Animated.View
                style={{
                    flex: 1,
                    opacity: listEntrance,
                    transform: [
                        {
                            translateY: listEntrance.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                            }),
                        },
                    ],
                }}
            >
                <ScrollView
                    className="flex-1"
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={loadConversations}
                        />
                    }
                >
                    {loading && (
                        <Text className="text-center text-gray-500 mt-6">
                            Đang tải cuộc trò chuyện...
                        </Text>
                    )}
                    {filteredConversations.map((conversation) => {
                        const displayName =
                            getConversationDisplayName(conversation);
                        const initials = getInitials(displayName);
                        const isGroup =
                            conversation.conversationId ===
                            conversation.counterpartId;

                        return (
                            <TouchableOpacity
                                key={conversation.conversationId}
                                onPress={() => {
                                    router.push({
                                        pathname: isGroup
                                            ? "/(tabs)/message/group-chat/[id]" // Nếu là group
                                            : "/message/chat/[id]", // Nếu là chat đơn
                                        params: {
                                            id: conversation.conversationId,
                                            name: getConversationDisplayName(
                                                conversation,
                                            ),
                                            avatar:
                                                conversation.counterpartAvatarUrl ||
                                                "",
                                            isGroup: isGroup ? "true" : "false",
                                        },
                                    });
                                }}
                                className="mx-3 mt-2 flex-row items-center px-3 py-3 rounded-2xl border border-gray-100 bg-white"
                            >
                                {/* Avatar */}
                                <View className="relative">
                                    {conversation.counterpartAvatarUrl ? (
                                        <Image
                                            source={{
                                                uri: conversation.counterpartAvatarUrl,
                                            }}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <View
                                            className={`w-12 h-12 rounded-full items-center justify-center ${getAvatarColor(
                                                initials,
                                            )}`}
                                        >
                                            <Text className="text-white font-semibold text-base">
                                                {initials}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Content */}
                                <View className="flex-1 ml-3">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="font-semibold text-gray-900 text-base">
                                            {displayName}
                                        </Text>
                                        <Text className="text-gray-400 text-xs">
                                            {formatLastTime(
                                                conversation.lastMessageAt,
                                            )}
                                        </Text>
                                    </View>
                                    <Text
                                        className="text-gray-600 text-sm mt-1 pr-2"
                                        numberOfLines={1}
                                    >
                                        {formatPreview(conversation)}
                                    </Text>
                                </View>

                                {/* Unread indicator */}
                                {(() => {
                                    const counterpartId = String(
                                        conversation?.counterpartId ||
                                            conversation?.targetUserId ||
                                            "",
                                    );
                                    const isBlocked =
                                        !isGroup &&
                                        counterpartId &&
                                        blockedUserIds.has(counterpartId);
                                    const displayUnreadCount = isBlocked
                                        ? 0
                                        : conversation.unreadCount || 0;

                                    return displayUnreadCount > 0 ? (
                                        <View className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 items-center justify-center ml-2">
                                            <Text className="text-white text-[11px] font-semibold">
                                                {displayUnreadCount > 99
                                                    ? "99+"
                                                    : displayUnreadCount}
                                            </Text>
                                        </View>
                                    ) : null;
                                })()}
                            </TouchableOpacity>
                        );
                    })}

                    {!loading && filteredConversations.length === 0 && (
                        <Text className="text-center text-gray-500 mt-6">
                            Chưa có cuộc trò chuyện
                        </Text>
                    )}
                </ScrollView>
            </Animated.View>

            <Modal visible={showMenu} transparent animationType="fade">
                <Pressable
                    className="flex-1 bg-black/20"
                    onPress={() => setShowMenu(false)}
                >
                    <View className="absolute top-16 right-3 bg-white rounded-xl w-56 shadow-lg">
                        {plusMenu.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                className={`px-4 py-3 flex-row items-center ${
                                    index !== 0
                                        ? "border-t border-gray-100"
                                        : ""
                                }`}
                                onPress={() => {
                                    setShowMenu(false);
                                    if (item.route) {
                                        router.push(item.route as any);
                                    }
                                }}
                            >
                                {item.icon}
                                <Text className="text-base ml-1">
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
