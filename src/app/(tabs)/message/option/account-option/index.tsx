import { chatApi } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { getInitials } from "@/src/utils/displayUser";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
    const targetUserId = paramStr(params.targetUserId) || id || "";
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);

    const [isBlocked, setIsBlocked] = useState(false);
    const [loadingBlockState, setLoadingBlockState] = useState(false);
    const [loadingBlockAction, setLoadingBlockAction] = useState(false);
    const entranceAnim = useRef(new Animated.Value(0)).current;

    const [openRename, setOpenRename] = useState(false);
    const [remarkName, setRemarkName] = useState(name || "");
    const [renamingLoading, setRenamingLoading] = useState(false);

    const [displayName, setDisplayName] = useState(name || "");

    useEffect(() => {
        let mounted = true;

        const loadConversationDetail = async () => {
            if (!conversationId) return;
            try {
                const detail =
                    await chatApi.getConversationDetail(conversationId);
                if (mounted && detail?.remarkName) {
                    setDisplayName(detail.remarkName);
                    setRemarkName(detail.remarkName);
                }
            } catch (error) {
                console.error("[ChatOptions] Load detail error:", error);
            }
        };

        loadConversationDetail();
        return () => {
            mounted = false;
        };
    }, [conversationId]);

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
                    const candidate =
                        item?.id || item?.targetId || item?.userId || item;
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
    }, [targetUserId]);

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
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.message || "Không thể xóa lịch sử trò chuyện",
            );
        }
    };

    const handleToggleBlock = async () => {
        if (!targetUserId) return;

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
                            } else {
                                await friendApi.blockUser(targetUserId);
                                setIsBlocked(true);
                            }
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
                    ...(name != null ? { name } : {}),
                    ...(avatar != null ? { avatar } : {}),
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
                        <View className="flex-row justify-around w-full mt-6">
                            <View className="items-center">
                                <TouchableOpacity
                                    className="bg-gray-100 p-3 rounded-full"
                                    onPress={handleOpenProfile}
                                >
                                    <Search size={22} />
                                </TouchableOpacity>
                                <Text className="text-xs mt-1">
                                    Tìm tin nhắn
                                </Text>
                            </View>

                            <View className="items-center">
                                <TouchableOpacity
                                    className="bg-gray-100 p-3 rounded-full"
                                    onPress={handleOpenProfile}
                                >
                                    <User size={22} />
                                </TouchableOpacity>
                                <Text className="text-xs mt-1">
                                    Trang cá nhân
                                </Text>
                            </View>

                            <View className="items-center">
                                <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                                    <Pin size={22} />
                                </TouchableOpacity>
                                <Text className="text-xs mt-1">
                                    Đổi hình nền
                                </Text>
                            </View>

                            <View className="items-center">
                                <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                                    <Bell size={22} />
                                </TouchableOpacity>
                                <Text className="text-xs mt-1">
                                    Tắt thông báo
                                </Text>
                            </View>
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
                        />
                        <OptionItem
                            icon={<UserPlus size={20} />}
                            title={`Thêm ${name} vào nhóm`}
                        />
                        <OptionItem
                            icon={<Users size={20} />}
                            title="Xem nhóm chung (4)"
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
                            right={
                                <TouchableOpacity
                                    onPress={handleToggleBlock}
                                    disabled={
                                        loadingBlockState || loadingBlockAction
                                    }
                                >
                                    <Text
                                        className={`text-sm font-semibold ${isBlocked ? "text-green-600" : "text-red-500"}`}
                                    >
                                        {isBlocked ? "Bỏ chặn" : "Chặn"}
                                    </Text>
                                </TouchableOpacity>
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
            onPress={onPress} // Thêm onPress vào đây
            disabled={!onPress} // Nếu không truyền onPress thì vô hiệu hóa hiệu ứng bấm
        >
            <View className="mr-3">{icon}</View>
            <Text className="flex-1 text-[15px]">{title}</Text>
            {right}
        </TouchableOpacity>
    );
}
