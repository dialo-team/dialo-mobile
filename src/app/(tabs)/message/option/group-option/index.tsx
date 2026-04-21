import { chatApi } from "@/src/api/chat/chatApi";
import { groupApi } from "@/src/api/group/groupApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
    Bell,
    Clock,
    EyeOff,
    Flag,
    Image as ImageIcon,
    Link,
    MoveLeft,
    Pin,
    Trash,
    UserPlus,
    Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Easing,
    Image,
    ScrollView,
    Switch,
    Text,
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

    const [groupName, setGroupName] = useState(initialName);
    const [groupAvatar, setGroupAvatar] = useState(initialAvatar);
    const [memberCount, setMemberCount] = useState(0);
    const [joiningLink, setJoiningLink] = useState("");
    const [loadingLeave, setLoadingLeave] = useState(false);

    useEffect(() => {
        Animated.timing(entranceAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [entranceAnim]);

    const loadGroupData = useCallback(async () => {
        if (!conversationId) return;

        try {
            const [detail, membersRes] = await Promise.all([
                chatApi.getConversationDetail(conversationId),
                groupApi.getGroupMembers(conversationId),
            ]);

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
    }, [conversationId, initialAvatar, initialName]);

    useFocusEffect(
        useCallback(() => {
            loadGroupData();
        }, [loadGroupData]),
    );

    const handleLeaveGroup = () => {
        if (!conversationId || loadingLeave) return;

        Alert.alert(
            "Rời nhóm?",
            "Bạn sẽ không còn nhận tin nhắn từ nhóm này.",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Rời nhóm",
                    style: "destructive",
                    onPress: async () => {
                        setLoadingLeave(true);
                        try {
                            await groupApi.leaveGroup(conversationId);
                            router.replace("/(tabs)/message" as any);
                        } catch (error) {
                            console.log(
                                "[GroupOption] leaveGroup error",
                                error,
                            );
                            Alert.alert("Lỗi", "Không thể rời nhóm lúc này.");
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

                        <Text className="text-xl font-semibold mt-3 text-center px-6">
                            {groupName || "Nhom"}
                        </Text>
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
                <Text className="text-[15px]">{title}</Text>

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

function Action({ icon, title }: any) {
    return (
        <View className="items-center">
            <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                {icon}
            </TouchableOpacity>
            <Text className="text-xs mt-1">{title}</Text>
        </View>
    );
}
