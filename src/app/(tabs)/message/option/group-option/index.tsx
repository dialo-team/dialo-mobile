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
    X,
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

    // --- STATE MỚI CHO CHỨC NĂNG RỜI NHÓM ---
    const [membersList, setMembersList] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>("");
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [transferringId, setTransferringId] = useState<string | null>(null);

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
            console.log("[GroupOption] loadGroupData started:", {
                conversationId,
                currentUserId,
            });

            const [detailRes, membersRes] = await Promise.all([
                chatApi.getConversationDetail(conversationId),
                groupApi.getGroupMembers(conversationId, currentUserId),
            ]);

            const detail = detailRes?.data || detailRes;

            console.log("[GroupOption] loadGroupData responses:", {
                detail: {
                    groupName: detail?.groupName,
                    groupAvatarUrl: detail?.groupAvatarUrl,
                    fields: Object.keys(detail || {}),
                },
                membersCount: Array.isArray(membersRes) ? membersRes.length : 0,
            });

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

            // Tìm quyền của user hiện tại
            const me = members.find(
                (m) => String(m.userId) === String(currentUserId),
            );
            if (me) {
                setCurrentUserRole(me.role);
            }

            setGroupName(nextName);
            setGroupAvatar(nextAvatar);
            setMemberCount(members.length);
            setMembersList(members); // Lưu lại list để dùng cho Modal chuyển quyền
            setJoiningLink(
                detail?.groupLink || detail?.inviteLink || detail?.link || "",
            );

            console.log("[GroupOption] loadGroupData completed:", {
                groupName: nextName,
                memberCount: members.length,
                currentUserRole: me?.role,
            });
        } catch (error) {
            console.log(
                "[GroupOption] loadGroupData error:",
                error?.message || error,
            );
        }
    }, [conversationId, currentUserId, initialAvatar, initialName]);

    useFocusEffect(
        useCallback(() => {
            loadGroupData();
        }, [loadGroupData]),
    );

    // --- LOGIC RỜI NHÓM & CHUYỂN QUYỀN MỚI ---
    const handleLeaveGroup = () => {
        if (!conversationId || loadingLeave) return;

        // Nếu là Trưởng nhóm và có người khác trong nhóm -> Bật Modal chuyển quyền
        if (currentUserRole === "OWNER" && membersList.length > 1) {
            console.log("[GroupOption] Owner leaving with other members", {
                currentUserRole,
                memberCount: membersList.length,
            });
            setIsTransferModalVisible(true);
            return;
        }

        // Luồng rời nhóm bình thường
        Alert.alert("Rời nhóm?", "Bạn chắc chắn rời nhóm?", [
            { text: "Huỷ", style: "cancel" },
            {
                text: "Rời",
                style: "destructive",
                onPress: async () => {
                    setLoadingLeave(true);
                    try {
                        console.log("[GroupOption] leaveGroup request:", {
                            conversationId,
                        });

                        const response =
                            await groupApi.leaveGroup(conversationId);

                        console.log("[GroupOption] leaveGroup response:", {
                            status: response?.status,
                        });

                        router.replace("/(tabs)/message" as any);
                    } catch (error: any) {
                        const errorMsg =
                            error?.response?.data?.message ||
                            error?.message ||
                            "Không thể rời nhóm lúc này.";
                        console.log(
                            "[GroupOption] leaveGroup error:",
                            errorMsg,
                            {
                                status: error?.response?.status,
                                url: error?.config?.url,
                            },
                        );
                        Alert.alert("Lỗi", errorMsg);
                    } finally {
                        setLoadingLeave(false);
                    }
                },
            },
        ]);
    };

    const handleTransferAndLeave = (selectedMember: any) => {
        Alert.alert(
            "Chuyển quyền và rời nhóm",
            `Bạn sẽ chuyển quyền Trưởng nhóm cho ${selectedMember.displayName || "người này"} và rời nhóm ngay lập tức?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đồng ý",
                    style: "destructive",
                    onPress: async () => {
                        setTransferringId(selectedMember.userId);
                        try {
                            console.log(
                                "[GroupOption] Transfer & Leave started:",
                                {
                                    newOwnerId: selectedMember.userId,
                                    conversationId,
                                },
                            );

                            // Gọi API 1: Phân quyền
                            await groupApi.assignRole(
                                conversationId as string,
                                selectedMember.userId,
                                "OWNER" as any,
                            );

                            console.log(
                                "[GroupOption] assignRole success, now leaving",
                            );

                            // Gọi API 2: Rời nhóm
                            await groupApi.leaveGroup(conversationId as string);

                            console.log(
                                "[GroupOption] leaveGroup success, redirecting",
                            );

                            setIsTransferModalVisible(false);
                            router.replace("/(tabs)/message" as any);
                        } catch (error: any) {
                            const errorMsg =
                                error?.response?.data?.message ||
                                error?.message ||
                                "Không thể thực hiện chuyển quyền hoặc rời nhóm.";
                            console.log(
                                "[GroupOption] Transfer & Leave error:",
                                errorMsg,
                                {
                                    status: error?.response?.status,
                                    url: error?.config?.url,
                                },
                            );
                            Alert.alert("Lỗi", errorMsg);
                        } finally {
                            setTransferringId(null);
                        }
                    },
                },
            ],
        );
    };
    // ----------------------------------------

    const handleUpdateGroupName = async () => {
        const newName = tempGroupName;

        console.log("DEBUG: newName value =", newName);
        console.log("DEBUG: newName type =", typeof newName);
        console.log("DEBUG: Thực hiện đổi tên cho ID:", conversationId);
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
            console.log("[GroupOption] updateGroupName request:", {
                conversationId,
                currentUserId,
                newName,
            });

            if (conversationId === currentUserId) {
                Alert.alert(
                    "Lỗi dữ liệu",
                    "Đây có vẻ là cuộc hội thoại cá nhân, không thể đổi tên nhóm.",
                );
                return;
            }

            const response = await groupApi.updateGroupName(
                conversationId,
                currentUserId,
                newName,
            );

            console.log("[GroupOption] updateGroupName response:", {
                status: response?.status,
                groupName: response?.groupName,
                fields: Object.keys(response || {}),
            });

            // Verify response contains updated group name
            const updatedName = response?.groupName || newName;
            setGroupName(updatedName);
            setIsNamingModalVisible(false);
            Alert.alert("Thành công", "Đã cập nhật tên nhóm.");
        } catch (error: any) {
            const errorMsg =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể cập nhật tên nhóm.";
            console.log(
                "[GroupOption] updateGroupName error:",
                error?.response?.status,
                errorMsg,
                {
                    url: error?.config?.url,
                    method: error?.config?.method,
                    data: error?.config?.data,
                },
            );
            Alert.alert("Lỗi", errorMsg);
        } finally {
            setUpdatingName(false);
        }
    };

    const handleUpdateAvatar = async () => {
        if (!conversationId || !currentUserId) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                setUpdatingAvatar(true);
                const asset = result.assets[0];

                if (!asset.base64) {
                    Alert.alert(
                        "Lỗi",
                        "Không thể mã hóa ảnh. Vui lòng thử ảnh khác.",
                    );
                    return;
                }

                const mimeType =
                    asset.mimeType ||
                    (asset.uri.endsWith(".png") ? "image/png" : "image/jpeg");

                // Validate MIME type
                const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                if (!validMimeTypes.includes(mimeType)) {
                    Alert.alert("Lỗi", "Chỉ hỗ trợ định dạng JPEG, PNG, GIF");
                    return;
                }

                const base64String = `data:${mimeType};base64,${asset.base64}`;

                console.log("[GroupOption] updateGroupAvatar request:", {
                    conversationId,
                    currentUserId,
                    mimeType,
                    base64Length: asset.base64.length,
                });

                const response = await groupApi.updateGroupAvatar(
                    conversationId,
                    currentUserId,
                    base64String,
                );

                console.log("[GroupOption] updateGroupAvatar response:", {
                    status: response?.status,
                    groupAvatarUrl: response?.groupAvatarUrl,
                    fields: Object.keys(response || {}),
                });

                // Use response avatar URL if available, otherwise fallback to local URI
                const updatedAvatarUrl = response?.groupAvatarUrl || asset.uri;
                setGroupAvatar(updatedAvatarUrl);
                Alert.alert("Thành công", "Đã cập nhật ảnh nhóm.");
            }
        } catch (error: any) {
            const errorMsg =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể cập nhật ảnh nhóm.";
            console.log("[GroupOption] updateGroupAvatar error:", errorMsg, {
                status: error?.response?.status,
                url: error?.config?.url,
                method: error?.config?.method,
                fullError: error,
            });
            Alert.alert("Lỗi", errorMsg);
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const handleDissolveGroup = () => {
        if (!conversationId || !currentUserId || loadingLeave) return;

        Alert.alert(
            "Giải tán nhóm?",
            "Nhóm sẽ bị xóa vĩnh viễn và không thể khôi phục.",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Giải tán",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoadingLeave(true);
                            console.log(
                                "[GroupOption] dissolveGroup request:",
                                { conversationId },
                            );

                            const response =
                                await groupApi.dissolveGroup(conversationId);

                            console.log(
                                "[GroupOption] dissolveGroup response:",
                                response,
                            );

                            Alert.alert("Thành công", "Đã giải tán nhóm.");
                            router.replace("/(tabs)/message" as any);
                        } catch (error: any) {
                            const errorMsg =
                                error?.response?.data?.message ||
                                error?.message ||
                                "Không thể giải tán nhóm lúc này.";
                            console.log(
                                "[GroupOption] dissolveGroup error:",
                                errorMsg,
                                {
                                    status: error?.response?.status,
                                    url: error?.config?.url,
                                },
                            );
                            Alert.alert("Lỗi", errorMsg);
                        } finally {
                            setLoadingLeave(false);
                        }
                    },
                },
            ],
        );
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
                            className="px-4 py-4 items-center border-b border-gray-100"
                            onPress={handleDissolveGroup}
                            disabled={loadingLeave || !conversationId}
                        >
                            <Text className="text-red-600 text-[15px] font-medium">
                                {loadingLeave
                                    ? "Đang xử lý..."
                                    : "Giải tán nhóm"}
                            </Text>
                        </TouchableOpacity>
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

            {/* MODAL CHỌN TRƯỞNG NHÓM MỚI (CHỈ OWNER MỚI THẤY) */}
            <Modal
                visible={isTransferModalVisible}
                animationType="slide"
                transparent
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-2xl p-5 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">
                                Chọn trưởng nhóm mới
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsTransferModalVisible(false)}
                            >
                                <X size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-gray-500 mb-4 text-sm">
                            Bạn đang là Trưởng nhóm. Vui lòng chuyển quyền cho
                            một thành viên khác trước khi rời đi.
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {membersList
                                .filter(
                                    (m) =>
                                        String(m.userId) !==
                                        String(currentUserId),
                                )
                                .map((member) => (
                                    <TouchableOpacity
                                        key={member.userId}
                                        className="flex-row items-center py-3 border-b border-gray-100"
                                        onPress={() =>
                                            handleTransferAndLeave(member)
                                        }
                                        disabled={transferringId !== null}
                                    >
                                        {member.avatarUrl ? (
                                            <Image
                                                source={{
                                                    uri: member.avatarUrl,
                                                }}
                                                className="w-12 h-12 rounded-full mr-3 bg-gray-200"
                                            />
                                        ) : (
                                            <View className="w-12 h-12 rounded-full bg-blue-400 items-center justify-center mr-3">
                                                <Text className="text-white font-bold text-lg">
                                                    {member.displayName
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || "U"}
                                                </Text>
                                            </View>
                                        )}
                                        <View className="flex-1 justify-center">
                                            <Text className="text-base font-medium text-black">
                                                {member.displayName}
                                            </Text>
                                            {member.role === "ADMIN" && (
                                                <Text className="text-[13px] text-blue-500 mt-0.5">
                                                    Phó nhóm
                                                </Text>
                                            )}
                                        </View>

                                        {transferringId === member.userId && (
                                            <ActivityIndicator
                                                size="small"
                                                color="#3b82f6"
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>
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
