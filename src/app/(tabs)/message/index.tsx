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
};

export default function MessagesScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listEntrance = useRef(new Animated.Value(0)).current;

    const loadConversations = useCallback(async () => {
        if (!currentUserId) {
            setConversations([]);
            setError("Bạn chưa đăng nhập hoặc phiên đã hết hạn.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            console.log("[MessagesScreen] Loading conversations...");
            const data = await chatApi.getConversations();
            const list = Array.isArray(data) ? data : [];

            const extractProfileDisplayInfo = (profile: any) => ({
                name: pickBestDisplayName(
                    [
                        profile?.userName,
                        profile?.username,
                        profile?.name,
                        profile?.displayName,
                        profile?.nickName,
                        profile?.nickname,
                        profile?.fullName,
                    ],
                    "Nguoi dung",
                ),
                avatar:
                    profile?.avatarUrl ||
                    profile?.avatar ||
                    profile?.profilePictureUrl ||
                    profile?.profilePicture ||
                    profile?.photoUrl ||
                    profile?.imageUrl ||
                    "",
            });

            const enriched = await Promise.all(
                list.map(async (conversation: any) => {
                    const baseName = pickBestDisplayName(
                        [
                            conversation.counterpartName,
                            conversation.remarkName,
                            conversation.counterpartUserName,
                            conversation.displayName,
                            conversation.userName,
                            conversation.name,
                            conversation.fullName,
                        ],
                        "Nguoi dung",
                    );

                    const baseAvatar =
                        conversation.counterpartAvatarUrl ||
                        conversation.counterpartAvatar ||
                        conversation.profilePictureUrl ||
                        conversation.profilePicture ||
                        conversation.photoUrl ||
                        conversation.imageUrl ||
                        conversation.avatarUrl ||
                        conversation.avatar ||
                        "";

                    const needsLookup =
                        !baseName || baseName === "Nguoi dung" || !baseAvatar;

                    if (!needsLookup || !conversation.counterpartId) {
                        return {
                            ...conversation,
                            counterpartName: baseName,
                            counterpartAvatarUrl: baseAvatar,
                        };
                    }

                    try {
                        const userRes = await friendApi.getUserById(
                            conversation.counterpartId,
                        );
                        const profile = userRes?.data || userRes;
                        const profileDisplay =
                            extractProfileDisplayInfo(profile);

                        return {
                            ...conversation,
                            counterpartName:
                                baseName !== "Nguoi dung"
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

            console.log(
                "[MessagesScreen] Loaded conversations:",
                enriched?.length,
            );
            setConversations(enriched);
        } catch (e: any) {
            let errorMsg =
                e?.message || "Không thể tải danh sách cuộc trò chuyện";
            if (
                typeof errorMsg === "string" &&
                errorMsg.toLowerCase().includes("cors")
            ) {
                errorMsg =
                    "Web đang bị chặn CORS từ backend. Hãy bật CORS trên server hoặc test bằng Expo Go trên thiết bị thật.";
            }
            console.error(
                "[MessagesScreen] loadConversations error:",
                errorMsg,
            );
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    const debounceRefreshConversations = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }
        console.log("[MessagesScreen] Debounced refresh scheduled");
        refreshTimerRef.current = setTimeout(() => {
            console.log("[MessagesScreen] Executing debounced refresh");
            loadConversations();
        }, 800);
    }, [loadConversations]);

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

    useEffect(() => {
        if (!currentUserId) return;
        loadConversations();
    }, [currentUserId, loadConversations]);

    useFocusEffect(
        useCallback(() => {
            if (currentUserId) {
                loadConversations();
            }
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
                conversation.counterpartName,
                (conversation as any)?.remarkName,
                (conversation as any)?.counterpartUserName,
                (conversation as any)?.displayName,
                (conversation as any)?.userName,
                (conversation as any)?.name,
                (conversation as any)?.fullName,
            ],
            "Nguoi dung",
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
            useNativeDriver: true,
        }).start();
    }, [listEntrance]);

    const filteredConversations = useMemo(
        () =>
            conversations.filter((conversation) =>
                getConversationDisplayName(conversation)
                    .toLowerCase()
                    .includes(searchText.toLowerCase().trim()),
            ),
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
                                {(conversation.unreadCount || 0) > 0 ? (
                                    <View className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 items-center justify-center ml-2">
                                        <Text className="text-white text-[11px] font-semibold">
                                            {conversation.unreadCount &&
                                            conversation.unreadCount > 99
                                                ? "99+"
                                                : conversation.unreadCount}
                                        </Text>
                                    </View>
                                ) : null}
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
