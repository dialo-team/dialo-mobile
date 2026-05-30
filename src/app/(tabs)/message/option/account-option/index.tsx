import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { getInitials } from "@/src/utils/displayUser";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
    Bell,
    Clock,
    EyeOff,
    FileImage,
    Flag,
    Folder,
    MoveLeft,
    Pin,
    Search,
    Shield,
    Trash,
    User,
    UserPlus,
    Users,
    X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function paramStr(v: string | string[] | undefined): string | undefined {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v[0] != null) return v[0];
    return undefined;
}

export default function ChatOptionsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        conversationId?: string | string[];
        targetUserId?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        from?: string | string[];
    }>();

    const id = paramStr(params.id);
    const conversationId = paramStr(params.conversationId) || id || "";

    // FIX 1: Dùng State cho targetUserId, KHÔNG fallback sang id (vì id có thể là conversationId gây lỗi 500)
    const initialTargetUserId = paramStr(params.targetUserId) || "";
    const [targetUserId, setTargetUserId] = useState(initialTargetUserId);

    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);

    const [isBlocked, setIsBlocked] = useState(false);
    const [loadingBlockState, setLoadingBlockState] = useState(false);
    const [loadingBlockAction, setLoadingBlockAction] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [mutualGroupCount, setMutualGroupCount] = useState(0);
    const entranceAnim = useRef(new Animated.Value(0)).current;

    const [openRename, setOpenRename] = useState(false);
    const [remarkName, setRemarkName] = useState(name || "");
    const [renamingLoading, setRenamingLoading] = useState(false);

    const [showGroupPicker, setShowGroupPicker] = useState(false);
    const [groupList, setGroupList] = useState<
        { conversationId: string; name: string; avatar: string }[]
    >([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [displayName, setDisplayName] = useState(name || "");

    useEffect(() => {
        let mounted = true;

        const loadConversationDetail = async () => {
            if (!conversationId) return;
            try {
                const detail =
                    await chatApi.getConversationDetail(conversationId);
                if (mounted) {
                    if (detail?.remarkName) {
                        setDisplayName(detail.remarkName);
                        setRemarkName(detail.remarkName);
                    }

                    // FIX 2: Tự động cập nhật targetUserId nếu params bị rỗng
                    const serverTargetId =
                        detail?.counterpartId || detail?.targetUserId;
                    if (!targetUserId && serverTargetId) {
                        setTargetUserId(serverTargetId);
                    }
                }
            } catch (error) {
                console.error("[ChatOptions] Load detail error:", error);
            }
        };

        loadConversationDetail();
        return () => {
            mounted = false;
        };
    }, [conversationId, targetUserId]);

    const handleSaveRemark = async () => {
        if (!conversationId || !remarkName.trim()) return;

        setRenamingLoading(true);
        try {
            await chatApi.updateConversationRemark(
                conversationId,
                remarkName.trim(),
            );
            setDisplayName(remarkName.trim());
            Alert.alert("Thành công", "Đã cập nhật tên gợi nhớ");
            setOpenRename(false);
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể lưu tên");
        } finally {
            setRenamingLoading(false);
        }
    };

    useEffect(() => {
        Animated.timing(entranceAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [entranceAnim]);

    const avatarUrl = useMemo(
        () => (typeof avatar === "string" ? avatar : ""),
        [avatar],
    );

    const initials = useMemo(() => getInitials(displayName), [displayName]);

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

    useEffect(() => {
        let mounted = true;

        const loadMutualGroupCount = async () => {
            if (!targetUserId || !currentUserId) {
                if (mounted) setMutualGroupCount(0);
                return;
            }

            try {
                const conversations = await chatApi.getConversations();
                const list = Array.isArray(conversations) ? conversations : [];

                const count = list.filter((conversation: any) => {
                    const isGroup =
                        conversation?.isGroup === true ||
                        String(
                            conversation?.conversationType ||
                                conversation?.type ||
                                "",
                        ).toLowerCase() === "group" ||
                        !!conversation?.groupName ||
                        !!conversation?.groupAvatarUrl ||
                        Array.isArray(conversation?.participants);

                    if (!isGroup) return false;

                    const participants = Array.isArray(
                        conversation?.participants,
                    )
                        ? conversation.participants.map((item: any) =>
                              String(item),
                          )
                        : [];

                    return (
                        participants.includes(String(currentUserId)) &&
                        participants.includes(String(targetUserId))
                    );
                }).length;

                if (mounted) setMutualGroupCount(count);
            } catch (error) {
                console.error(
                    "[account-option] loadMutualGroupCount error:",
                    error,
                );
                if (mounted) setMutualGroupCount(0);
            }
        };

        loadMutualGroupCount();

        return () => {
            mounted = false;
        };
    }, [currentUserId, targetUserId]);

    useEffect(() => {
        let mounted = true;

        const loadBlockState = async () => {
            if (!targetUserId) return;
            setLoadingBlockState(true);
            try {
                const result = await friendApi.getBlockedUsers();
                const blockedList = Array.isArray(result)
                    ? result
                    : Array.isArray((result as any)?.data)
                      ? (result as any).data
                      : [];

                const blocked = blockedList.some((item: any) => {
                    // FIX 3: Mở rộng các field để vét cạn ID từ mảng của backend
                    const candidate =
                        item?.id ||
                        item?.targetId ||
                        item?.userId ||
                        item?.blockedId ||
                        item?.blockedUserId ||
                        item?.blockedUser?.id ||
                        item;
                    return String(candidate) === String(targetUserId);
                });

                if (mounted) setIsBlocked(blocked);
            } catch (error) {
                console.error("[account-option] loadBlockState error:", error);
            } finally {
                if (mounted) setLoadingBlockState(false);
            }
        };

        loadBlockState();

        return () => {
            mounted = false;
        };
    }, [targetUserId]); // Phụ thuộc vào targetUserId để load lại khi lấy được ID đúng

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const refreshBlockState = async () => {
                if (!targetUserId) {
                    if (mounted) setIsBlocked(false);
                    return;
                }

                setLoadingBlockState(true);
                try {
                    const blocked = await friendApi.isUserBlocked(targetUserId);
                    if (mounted) setIsBlocked(blocked);
                } catch (error) {
                    console.error(
                        "[account-option] refreshBlockState error:",
                        error,
                    );
                } finally {
                    if (mounted) setLoadingBlockState(false);
                }
            };

            refreshBlockState();

            return () => {
                mounted = false;
            };
        }, [targetUserId]),
    );

    const handleOpenProfile = () => {
        if (!targetUserId) return;
        router.push({
            pathname: "/(tabs)/contact/friend/[id]" as any,
            params: {
                id: targetUserId,
                name: displayName,
                avatar: avatarUrl,
            },
        });
    };

    const handleClearHistory = async () => {
        if (!conversationId) return;
        try {
            await chatApi.clearHistory(conversationId);
            Alert.alert("Thành công", "Đã xóa lịch sử trò chuyện");
            router.replace("/(tabs)/message" as any);
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.message || "Không thể xóa lịch sử trò chuyện",
            );
        }
    };

    const handleToggleBlock = async () => {
        if (!targetUserId || targetUserId === conversationId) {
            Alert.alert(
                "Lỗi",
                "Chưa xác định được người dùng. Vui lòng mở lại cuộc trò chuyện.",
            );
            return;
        }

        // Cảnh báo an toàn (không hiển thị lên UI, chỉ cho dev)
        if (targetUserId === conversationId) {
            console.warn("Lỗi tiềm ẩn: targetUserId trùng conversationId!");
        }

        Alert.alert(
            isBlocked ? "Bỏ chặn người dùng?" : "Chặn người dùng?",
            isBlocked
                ? `Bỏ chặn ${displayName} khỏi danh sách chặn.`
                : `Chặn ${displayName} để ngăn nhắn tin.`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: isBlocked ? "Bỏ chặn" : "Chặn",
                    style: "destructive",
                    onPress: async () => {
                        setLoadingBlockAction(true);
                        try {
                            if (isBlocked) {
                                await friendApi.unblockUser(targetUserId);
                                setIsBlocked(false);
                                Alert.alert(
                                    "Thành công",
                                    "Đã bỏ chặn người dùng",
                                );
                            } else {
                                await friendApi.blockUser(targetUserId);
                                setIsBlocked(true);
                                Alert.alert(
                                    "Thành công",
                                    "Đã chặn người dùng. Tin nhắn của họ sẽ không được hiển thị.",
                                );
                            }
                            // ✅ FIX 8: Reload ChatScreen sau khi block/unblock
                            // Quay lại ChatScreen để reload dữ liệu
                            setTimeout(() => {
                                if (conversationId) {
                                    router.replace({
                                        pathname:
                                            "/(tabs)/message/chat/[id]" as any,
                                        params: {
                                            id: conversationId,
                                            name: displayName,
                                            avatar: avatarUrl,
                                        },
                                    });
                                }
                            }, 500);
                        } catch (error: any) {
                            Alert.alert(
                                "Lỗi",
                                error?.message ||
                                    (isBlocked
                                        ? "Không thể bỏ chặn"
                                        : "Không thể chặn người dùng"),
                            );
                        } finally {
                            setLoadingBlockAction(false);
                        }
                    },
                },
            ],
        );
    };

    const handleHeaderBack = () => {
        if (conversationId) {
            router.replace({
                pathname: "/(tabs)/message/chat/[id]" as any,
                params: {
                    id: conversationId,
                    name: displayName,
                    avatar: avatarUrl,
                },
            });
            return;
        }

        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/(tabs)/message" as any);
    };

    const handleOpenMedia = () => {
        if (!conversationId) return;
        router.push({
            pathname: "/(tabs)/message/option/media-list" as any,
            params: { conversationId, name: displayName },
        });
    };

    const handleCreateGroupWithUser = () => {
        if (!targetUserId) return;

        router.push({
            pathname: "/(tabs)/contact/group/create" as any,
            params: {
                preselectedUserId: targetUserId,
                preselectedUserName: displayName,
                preselectedUserAvatar: avatarUrl,
            },
        });
    };

    const handleOpenGroupPicker = async () => {
        if (!targetUserId) return;
        setShowGroupPicker(true);
        setLoadingGroups(true);
        try {
            const conversations = await chatApi.getConversations();
            const list = Array.isArray(conversations) ? conversations : [];
            const groups = list
                .filter((c: any) => {
                    const isGroup =
                        c?.isGroup === true ||
                        String(
                            c?.conversationType || c?.type || "",
                        ).toLowerCase() === "group" ||
                        !!c?.groupName;
                    return isGroup && (c?.conversationId || c?.id);
                })
                .map((c: any) => ({
                    conversationId: String(c.conversationId || c.id),
                    name: c?.groupName || c?.name || "Nhóm không tên",
                    avatar:
                        c?.groupAvatarUrl ||
                        c?.groupAvatar ||
                        c?.avatarUrl ||
                        "",
                }));
            setGroupList(groups);
        } catch {
            Alert.alert("Lỗi", "Không thể tải danh sách nhóm");
        } finally {
            setLoadingGroups(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* HEADER */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={handleHeaderBack}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg ml-10 font-semibold">
                    Tuỳ chọn
                </Text>
            </View>

            <Animated.View
                style={{
                    flex: 1,
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
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* PROFILE */}
                    <View className="bg-white items-center py-6">
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                className="w-24 h-24 rounded-full"
                            />
                        ) : (
                            <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center">
                                <Text className="text-white text-2xl font-semibold">
                                    {initials}
                                </Text>
                            </View>
                        )}
                        <Text className="text-xl font-semibold mt-3">
                            {displayName}
                        </Text>

                        {/* ACTIONS */}
                        <View className="flex-row justify-around w-full mt-6 px-2">
                            {[
                                {
                                    icon: <Search size={22} color="#374151" />,
                                    label: "Tìm tin nhắn",
                                    onPress: () => {
                                        if (!conversationId) return;
                                        router.replace({
                                            pathname:
                                                "/(tabs)/message/chat/[id]" as any,
                                            params: {
                                                id: conversationId,
                                                name: displayName,
                                                avatar: avatarUrl,
                                                openSearch: "1",
                                            },
                                        });
                                    },
                                },
                                {
                                    icon: <User size={22} color="#374151" />,
                                    label: "Trang cá nhân",
                                    onPress: handleOpenProfile,
                                },
                                {
                                    icon: (
                                        <FileImage size={22} color="#374151" />
                                    ),
                                    label: "Ảnh & File",
                                    onPress: handleOpenMedia,
                                },
                                {
                                    icon: <Bell size={22} color="#374151" />,
                                    label: "Thông báo",
                                    onPress: undefined,
                                },
                            ].map(({ icon, label, onPress }) => (
                                <View key={label} className="items-center">
                                    <TouchableOpacity
                                        className="bg-gray-100 p-3 rounded-full"
                                        onPress={onPress}
                                        disabled={!onPress}
                                        activeOpacity={onPress ? 0.6 : 1}
                                    >
                                        {icon}
                                    </TouchableOpacity>
                                    <Text className="text-xs mt-1 text-gray-600 text-center">
                                        {label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* OPTION LIST */}
                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<User size={20} />}
                            title="Đổi tên gợi nhớ"
                            onPress={() => setOpenRename(true)}
                        />

                        <OptionItem
                            icon={<Pin size={20} />}
                            title="Đánh dấu bạn thân"
                            right={<Switch />}
                        />

                        <OptionItem
                            icon={<Clock size={20} />}
                            title="Nhật ký chung"
                        />
                        <OptionItem
                            icon={<FileImage size={20} />}
                            title="Ảnh, file, link"
                            onPress={handleOpenMedia}
                        />
                    </View>

                    {/* GROUP OPTIONS */}
                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<Users size={20} />}
                            title={`Tạo nhóm với ${name}`}
                            onPress={handleCreateGroupWithUser}
                        />
                        <OptionItem
                            icon={<UserPlus size={20} />}
                            title={`Thêm ${name} vào nhóm`}
                            onPress={handleOpenGroupPicker}
                        />
                        <OptionItem
                            icon={<Users size={20} />}
                            title={`Xem nhóm chung (${mutualGroupCount})`}
                        />
                    </View>

                    {/* CHAT SETTINGS */}
                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<Pin size={20} />}
                            title="Ghim trò chuyện"
                            right={<Switch />}
                        />

                        <OptionItem
                            icon={<EyeOff size={20} />}
                            title="Ẩn trò chuyện"
                            right={<Switch />}
                        />

                        <OptionItem
                            icon={<Bell size={20} />}
                            title="Báo cuộc gọi đến"
                            right={<Switch value={true} />}
                        />

                        <OptionItem
                            icon={<Shield size={20} />}
                            title="Cài đặt cá nhân"
                        />
                        <OptionItem
                            icon={<Clock size={20} />}
                            title="Tin nhắn tự xoá"
                        />
                    </View>

                    {/* DANGER ZONE */}
                    <View className="bg-white mt-2">
                        <OptionItem icon={<Flag size={20} />} title="Báo xấu" />
                        <OptionItem
                            icon={<Shield size={20} />}
                            title={
                                isBlocked
                                    ? "Bỏ chặn người dùng"
                                    : "Chặn người dùng"
                            }
                            onPress={
                                loadingBlockState || loadingBlockAction
                                    ? undefined
                                    : handleToggleBlock
                            }
                            right={
                                <Text
                                    className={`text-sm font-semibold ${isBlocked ? "text-green-600" : "text-red-500"}`}
                                >
                                    {isBlocked ? "Bỏ chặn" : "Chặn"}
                                </Text>
                            }
                        />
                        <OptionItem
                            icon={<Folder size={20} />}
                            title="Dung lượng trò chuyện"
                        />
                        <OptionItem
                            icon={<Trash size={20} />}
                            title="Xóa lịch sử trò chuyện"
                            right={
                                <TouchableOpacity onPress={handleClearHistory}>
                                    <Text className="text-sm font-semibold text-red-500">
                                        Xóa
                                    </Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                    <View className="h-10" />
                </ScrollView>
            </Animated.View>

            {/* GROUP PICKER MODAL */}
            <Modal
                visible={showGroupPicker}
                animationType="slide"
                transparent
                onRequestClose={() => setShowGroupPicker(false)}
            >
                <View className="flex-1 justify-end bg-black/30">
                    <View
                        className="bg-white rounded-t-3xl p-4"
                        style={{ maxHeight: "70%" }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="w-6" />
                            <Text className="text-lg font-semibold">
                                Chọn nhóm để thêm
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowGroupPicker(false)}
                            >
                                <X size={22} />
                            </TouchableOpacity>
                        </View>

                        {loadingGroups ? (
                            <ActivityIndicator
                                size="small"
                                color="#2563eb"
                                style={{ marginVertical: 32 }}
                            />
                        ) : groupList.length === 0 ? (
                            <Text className="text-center text-gray-400 py-10">
                                Bạn chưa có nhóm nào
                            </Text>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {groupList.map((group) => (
                                    <TouchableOpacity
                                        key={group.conversationId}
                                        className="flex-row items-center px-2 py-3 border-b border-gray-100"
                                        onPress={() => {
                                            setShowGroupPicker(false);
                                            router.push({
                                                pathname:
                                                    "/(tabs)/contact/group/add-member" as any,
                                                params: {
                                                    conversationId:
                                                        group.conversationId,
                                                    preselectedUserId:
                                                        targetUserId,
                                                },
                                            });
                                        }}
                                    >
                                        {group.avatar ? (
                                            <Image
                                                source={{ uri: group.avatar }}
                                                className="w-12 h-12 rounded-full bg-gray-200"
                                            />
                                        ) : (
                                            <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                                                <Text className="text-white font-semibold">
                                                    {getInitials(group.name)}
                                                </Text>
                                            </View>
                                        )}
                                        <Text className="ml-3 flex-1 text-base font-medium">
                                            {group.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* RENAME MODAL */}
            <Modal visible={openRename} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1 justify-end bg-black/30">
                        <View className="bg-white rounded-t-3xl p-4 min-h-[30%]">
                            {/* HEADER */}
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="w-6" />
                                <Text className="text-lg font-semibold">
                                    Đổi tên gợi nhớ
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setOpenRename(false)}
                                >
                                    <X size={22} />
                                </TouchableOpacity>
                            </View>

                            {/* INPUT */}
                            <View className="border-b border-gray-300 pb-2 flex-row items-center">
                                <TextInput
                                    value={remarkName}
                                    onChangeText={setRemarkName}
                                    maxLength={40}
                                    className="flex-1 text-lg"
                                    autoFocus
                                    placeholder="Nhập tên gợi nhớ"
                                />
                            </View>

                            {/* DESCRIPTION */}
                            <Text className="text-gray-400 mt-3">
                                Tên người này sẽ hiển thị là:{" "}
                                {remarkName || "Chưa nhập"}
                            </Text>

                            {/* SAVE BUTTON */}
                            <TouchableOpacity
                                className={`mt-6 py-4 rounded-full items-center ${
                                    remarkName.trim().length > 0
                                        ? "bg-blue-600"
                                        : "bg-gray-300 opacity-50"
                                }`}
                                disabled={
                                    remarkName.trim().length === 0 ||
                                    renamingLoading
                                }
                                onPress={handleSaveRemark}
                            >
                                <Text className="text-white text-lg font-medium">
                                    {renamingLoading ? "Đang lưu..." : "Lưu"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

function OptionItem({ icon, title, right, onPress }: any) {
    return (
        <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
            onPress={onPress}
            disabled={!onPress}
        >
            <View className="mr-3">{icon}</View>
            <Text className="flex-1 text-[15px]">{title}</Text>
            {right}
        </TouchableOpacity>
    );
}
