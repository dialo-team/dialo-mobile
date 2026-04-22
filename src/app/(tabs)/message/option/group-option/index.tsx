import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { groupApi } from "@/src/api/group/groupApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
    Bell,
    Clock,
    EyeOff,
    Flag,
    Image as ImageIcon,
    Link,
    MoveLeft,
    Pencil,
    Pin,
    Trash,
    UserPlus,
    Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Image,
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const paramToString = (value: string | string[] | undefined) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value[0] != null) return value[0];
    return "";
};

const normalizeMembers = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.members)) return data.members;
    if (Array.isArray(data?.data?.members)) return data.data.members;
    return [];
};

export default function GroupChatOptionsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
    }>();

    const conversationId = paramToString(params.id);
    const initialName = paramToString(params.name);
    const initialAvatar = paramToString(params.avatar);
    const entranceAnim = useRef(new Animated.Value(0)).current;

    const [currentUserId, setCurrentUserId] = useState("");
    const [groupName, setGroupName] = useState(initialName);
    const [groupAvatar, setGroupAvatar] = useState(initialAvatar);
    const [memberCount, setMemberCount] = useState(0);
    const [joiningLink, setJoiningLink] = useState("");
    const [loadingLeave, setLoadingLeave] = useState(false);

    const [isNamingModalVisible, setIsNamingModalVisible] = useState(false);
    const [tempGroupName, setTempGroupName] = useState("");
    const [updatingName, setUpdatingName] = useState(false);

    const [updatingAvatar, setUpdatingAvatar] = useState(false);

    useEffect(() => {
        Animated.timing(entranceAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [entranceAnim]);

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

    const loadGroupData = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            const [detailRes, membersRes] = await Promise.all([
                chatApi.getConversationDetail(conversationId),
                groupApi.getGroupMembers(conversationId, currentUserId),
            ]);

            const detail = detailRes?.data || detailRes;

            const nextName = pickBestDisplayName(
                [
                    detail?.groupName,
                    detail?.conversationName,
                    detail?.name,
                    initialName,
                ],
                "Nhóm",
            );

            const nextAvatar =
                detail?.groupAvatarUrl ||
                detail?.avatarUrl ||
                detail?.avatar ||
                initialAvatar ||
                "";

            const members = normalizeMembers(membersRes);

            setGroupName(nextName);
            setGroupAvatar(nextAvatar);
            setMemberCount(members.length);
            setJoiningLink(
                detail?.groupLink || detail?.inviteLink || detail?.link || "",
            );
        } catch (error) {
            console.log("[GroupOption] loadGroupData error", error);
        }
    }, [conversationId, currentUserId, initialAvatar, initialName]);

    useFocusEffect(
        useCallback(() => {
            loadGroupData();
        }, [loadGroupData]),
    );

    const handleLeaveGroup = () => {
        if (!conversationId || loadingLeave) return;

        Alert.alert("Rời nhóm?", "Bạn chắc chắn rời nhóm?", [
            { text: "Huỷ", style: "cancel" },
            {
                text: "Rời",
                style: "destructive",
                onPress: async () => {
                    setLoadingLeave(true);
                    try {
                        await groupApi.leaveGroup(conversationId);
                        router.replace("/(tabs)/message" as any);
                    } catch (error: any) {
                        console.log("[GroupOption] leaveGroup error", error);

                        const isServerError =
                            error?.response?.status === 500 ||
                            error?.status === 500;
                        if (isServerError) {
                            Alert.alert(
                                "Không thể rời nhóm",
                                "Bạn đang là trưởng nhóm. Theo quy định, vui lòng chuyển quyền trưởng nhóm cho một thành viên khác trước khi rời đi.",
                                [
                                    { text: "Hủy", style: "cancel" },
                                    {
                                        text: "Đến danh sách thành viên",
                                        onPress: () =>
                                            router.push({
                                                pathname:
                                                    "/message/option/group-option/members",
                                                params: { conversationId },
                                            }),
                                    },
                                ],
                            );
                        } else {
                            Alert.alert("Lỗi", "Không thể rời nhóm lúc này.");
                        }
                    } finally {
                        setLoadingLeave(false);
                    }
                },
            },
        ]);
    };

    const handleUpdateGroupName = async () => {
        const newName = tempGroupName.trim();
        if (
            !newName ||
            newName === groupName ||
            !conversationId ||
            !currentUserId
        ) {
            setIsNamingModalVisible(false);
            return;
        }

        setUpdatingName(true);
        try {
            await groupApi.updateGroupName(
                conversationId,
                currentUserId,
                newName,
            );

            setGroupName(newName);
            setIsNamingModalVisible(false);
            Alert.alert("Thành công", "Đã cập nhật tên nhóm.");
        } catch (error: any) {
            console.log(
                "[GroupOption] updateGroupName error",
                error?.response?.status,
                error?.response?.data || error?.message || error,
            );
            Alert.alert(
                "Lỗi",
                error?.response?.data?.message ||
                    "Không thể cập nhật tên nhóm.",
            );
        } finally {
            setUpdatingName(false);
        }
    };

    const handleUpdateAvatar = async () => {
        if (!conversationId || !currentUserId) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images", // Dùng chữ thường để tránh cảnh báo của Expo
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3, // Nén ảnh xuống 30% để chuỗi Base64 không bị quá nặng gây sập server
                base64: true, // KÍCH HOẠT CHẾ ĐỘ XUẤT BASE64
            });

            if (!result.canceled && result.assets[0]) {
                setUpdatingAvatar(true);
                const asset = result.assets[0];

                // Kiểm tra xem có lấy được base64 không
                if (!asset.base64) {
                    Alert.alert(
                        "Lỗi",
                        "Không thể mã hóa ảnh. Vui lòng thử ảnh khác.",
                    );
                    return;
                }

                // 1. Tạo chuỗi Data URL Base64 theo chuẩn
                const mimeType =
                    asset.mimeType ||
                    (asset.uri.endsWith(".png") ? "image/png" : "image/jpeg");
                const base64String = `data:${mimeType};base64,${asset.base64}`;

                // 2. Gửi chuỗi Base64 này thẳng lên API updateGroupAvatar thay vì gửi đường dẫn https
                // Chú ý: Ở file groupApi.ts, hàm này phải nhận 'groupAvatarUrl' là chuỗi (string)
                await groupApi.updateGroupAvatar(
                    conversationId,
                    currentUserId,
                    base64String,
                );

                // 3. Cập nhật UI tạm bằng đường dẫn local để giao diện mượt mà
                setGroupAvatar(asset.uri);
                Alert.alert("Thành công", "Đã cập nhật ảnh nhóm.");
            }
        } catch (error: any) {
            console.log("Update avatar error:", error?.response?.data || error);
            Alert.alert(
                "Lỗi",
                "Backend không nhận định dạng ảnh này. Vui lòng báo backend bổ sung API Upload.",
            );
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const initials = useMemo(() => getInitials(groupName, "G"), [groupName]);

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={() => router.back()}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg ml-6 font-semibold">
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
                    <View className="bg-white items-center py-6">
                        <TouchableOpacity
                            onPress={handleUpdateAvatar}
                            disabled={updatingAvatar}
                            className="relative"
                        >
                            {groupAvatar ? (
                                <Image
                                    source={{ uri: groupAvatar }}
                                    className="w-24 h-24 rounded-full"
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center">
                                    <Text className="text-white text-3xl font-semibold">
                                        {initials}
                                    </Text>
                                </View>
                            )}

                            {updatingAvatar && (
                                <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center">
                                    <ActivityIndicator color="white" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setTempGroupName(groupName || "");
                                setIsNamingModalVisible(true);
                            }}
                            className="mt-3 px-6 "
                        >
                            <View className="flex-row items-center justify-center">
                                <Text className="text-xl font-semibold">
                                    {groupName || "Nhóm"}
                                </Text>
                                <Pencil
                                    size={20}
                                    color="gray"
                                    className="ml-2"
                                />
                            </View>
                        </TouchableOpacity>

                        <Text className="text-sm text-gray-500 mt-1">
                            {memberCount} thành viên
                        </Text>

                        <View className="flex-row justify-around w-full mt-6">
                            <Action
                                icon={<ImageIcon size={22} />}
                                title="Tìm tin nhắn"
                            />
                            <Action
                                icon={<UserPlus size={22} />}
                                title="Thêm thành viên"
                                onPress={() => {
                                    router.push({
                                        pathname: "/contact/group/add-member",
                                        params: { conversationId },
                                    });
                                }}
                            />
                            <Action
                                icon={<ImageIcon size={22} />}
                                title="Đổi hình nền"
                            />
                            <Action
                                icon={<Bell size={22} />}
                                title="Tắt thông báo"
                            />
                        </View>
                    </View>

                    <View className="bg-white mt-2">
                        <OptionItem title="Thêm mô tả nhóm" />
                    </View>

                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<ImageIcon size={20} />}
                            title="Ảnh, file, link"
                            onPress={() =>
                                router.push({
                                    pathname: "/message/option/media-list",
                                    params: { conversationId, name: groupName },
                                })
                            }
                        />
                    </View>

                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<Clock size={20} />}
                            title="Lịch nhóm"
                        />
                        <OptionItem
                            icon={<Pin size={20} />}
                            title="Tin nhắn đã ghim"
                        />
                    </View>

                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<Users size={20} />}
                            title={`Xem thành viên (${memberCount})`}
                            onPress={() => {
                                router.push({
                                    pathname:
                                        "/message/option/group-option/members",
                                    params: { conversationId },
                                });
                            }}
                        />
                        <OptionItem
                            icon={<Link size={20} />}
                            title="Link nhóm"
                            description={joiningLink || "Chưa có link mới"}
                        />
                    </View>

                    <View className="bg-white mt-2">
                        <OptionItem
                            icon={<Pin size={20} />}
                            title="Ghim cuộc trò chuyện"
                            right={<Switch />}
                        />
                        <OptionItem
                            icon={<EyeOff size={20} />}
                            title="Ẩn cuộc trò chuyện"
                            right={<Switch />}
                        />
                    </View>

                    <View className="bg-white mt-2">
                        <OptionItem icon={<Flag size={20} />} title="Báo xấu" />
                        <OptionItem
                            icon={<Clock size={20} />}
                            title="Dung lượng cuộc trò chuyện"
                        />
                        <OptionItem
                            icon={<Trash size={20} />}
                            title="Xóa lịch sử trò chuyện"
                            onPress={async () => {
                                try {
                                    await chatApi.clearHistory(conversationId);
                                    Alert.alert(
                                        "Thành công",
                                        "Đã xóa lịch sử trò chuyện.",
                                    );
                                    router.replace("/(tabs)/message" as any);
                                } catch (error) {
                                    console.log(
                                        "[GroupOption] clearHistory error",
                                        error,
                                    );
                                    Alert.alert(
                                        "Lỗi",
                                        "Không thể xóa lịch sử trò chuyện.",
                                    );
                                }
                            }}
                        />
                    </View>

                    <View className="bg-white mt-2">
                        <TouchableOpacity
                            className="px-4 py-4 items-center"
                            onPress={handleLeaveGroup}
                            disabled={loadingLeave || !conversationId}
                        >
                            <Text className="text-red-500 text-[15px] font-medium">
                                {loadingLeave ? "Đang xử lý..." : "Rời nhóm"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="h-12" />
                </ScrollView>
            </Animated.View>

            <Modal
                visible={isNamingModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsNamingModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-xl p-5">
                        <Text className="text-lg font-semibold text-black mb-4">
                            Đổi tên nhóm
                        </Text>

                        <TextInput
                            className="bg-gray-100 px-4 py-3 rounded-lg text-base text-black mb-5"
                            value={tempGroupName}
                            onChangeText={setTempGroupName}
                            placeholder="Nhập tên nhóm mới"
                            placeholderTextColor="#9ca3af"
                            autoFocus
                        />

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                onPress={() => setIsNamingModalVisible(false)}
                                className="px-4 py-2"
                                disabled={updatingName}
                            >
                                <Text className="text-gray-500 font-medium">
                                    Hủy
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleUpdateGroupName}
                                className="bg-blue-500 px-5 py-2 rounded-lg"
                                disabled={updatingName || !tempGroupName.trim()}
                            >
                                {updatingName ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="white"
                                    />
                                ) : (
                                    <Text className="text-white font-medium">
                                        Lưu
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function OptionItem({ icon, title, description, right, onPress }: any) {
    return (
        <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
            onPress={onPress}
            disabled={!onPress}
        >
            {icon && <View className="mr-3">{icon}</View>}

            <View className="flex-1">
                <Text className="text-[15px] text-black">{title}</Text>

                {description ? (
                    <Text className="text-gray-400 text-xs mt-1">
                        {description}
                    </Text>
                ) : null}
            </View>

            {right}
        </TouchableOpacity>
    );
}

function Action({ icon, title, onPress }: any) {
    return (
        <View className="items-center">
            <TouchableOpacity
                className="bg-gray-100 p-3 rounded-full"
                onPress={onPress}
                disabled={!onPress}
            >
                {icon}
            </TouchableOpacity>
            <Text className="text-xs mt-1 text-black">{title}</Text>
        </View>
    );
}
