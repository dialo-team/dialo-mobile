import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ChevronLeft,
    MoreVertical,
    Search,
    UserPlus,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import API và Types
import { chatAuthUtils } from "@/src/api/chat/chatApi";
import { groupApi } from "@/src/api/group/groupApi";
import { GroupMember } from "@/src/api/group/types";

// Các tab hiển thị
type TabType = "ALL" | "ADMINS" | "BLOCKED";

const CHAT_BASE_URL = "http://14.225.254.174:8085";
const resolveFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${CHAT_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

export default function GroupMembersPage() {
    const router = useRouter();
    const { conversationId } = useLocalSearchParams<{
        conversationId: string;
    }>();

    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<TabType>("ALL");

    // Lấy current user ID
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

    // Load danh sách members
    const loadMembers = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            setLoading(true);
            const response = await groupApi.getGroupMembers(
                conversationId,
                currentUserId,
            );

            // Xử lý normalize data nếu API trả về lồng trong data (đề phòng)
            let membersData = Array.isArray(response)
                ? response
                : (response as any)?.data || [];

            setMembers(membersData);
        } catch (error) {
            console.error("[GroupMembers] Load members error:", error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, currentUserId]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Logic lọc danh sách dựa trên Tab hiện tại
    const filteredMembers = members.filter((m) => {
        if (activeTab === "ADMINS") {
            return m.role === "OWNER" || m.role === "ADMIN";
        }
        if (activeTab === "BLOCKED") {
            return false; // Giả định chưa có logic block
        }
        return true; // Tab ALL
    });

    // Hàm render label role bên dưới tên user
    const renderRoleLabel = (role: string, isMe: boolean) => {
        if (role === "OWNER") return isMe ? "Bạn (Trưởng nhóm)" : "Trưởng nhóm";
        if (role === "ADMIN") return isMe ? "Bạn (Phó nhóm)" : "Phó nhóm";
        return isMe ? "Bạn" : "Thành viên";
    };

    // Sự kiện bấm vào nút 3 chấm để mở tùy chọn (Xóa/Gán quyền)
    const handleMemberOptions = (member: GroupMember) => {
        // TODO: Mở Modal/ActionSheet để thực hiện groupApi.removeMember hoặc groupApi.assignRole
        console.log("Mở tùy chọn cho member:", member.userId);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-blue-500 flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4"
                    >
                        <ChevronLeft color="white" size={28} />
                    </TouchableOpacity>
                    <Text className="text-white text-[18px] font-semibold">
                        Quản lý thành viên
                    </Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity>
                        <UserPlus color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Search color="white" size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-200">
                <TabButton
                    title="Tất cả"
                    isActive={activeTab === "ALL"}
                    onPress={() => setActiveTab("ALL")}
                />
                <TabButton
                    title="Trưởng và phó nhóm"
                    isActive={activeTab === "ADMINS"}
                    onPress={() => setActiveTab("ADMINS")}
                />
                <TabButton
                    title="Đã chặn"
                    isActive={activeTab === "BLOCKED"}
                    onPress={() => setActiveTab("BLOCKED")}
                />
            </View>

            {/* Mục Duyệt thành viên (Static Demo) */}
            <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3 border border-gray-300">
                    <UserPlus color="#4b5563" size={20} />
                </View>
                <Text className="text-[16px] text-gray-800">
                    Duyệt thành viên
                </Text>
            </TouchableOpacity>

            {/* Header Danh sách */}
            <View className="px-4 pt-4 pb-2">
                <Text className="text-blue-500 font-semibold">
                    Thành viên ({filteredMembers.length})
                </Text>
            </View>

            {/* Danh sách thành viên */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredMembers.map((member) => {
                        const isMe = member.userId === currentUserId;
                        const avatarUri = resolveFileUrl(member.avatarUrl);

                        return (
                            <View
                                key={member.userId}
                                className="flex-row items-center px-4 py-3"
                            >
                                {/* Avatar & Role Icon Badge */}
                                <View className="relative mr-3">
                                    {avatarUri ? (
                                        <Image
                                            source={{ uri: avatarUri }}
                                            className="w-12 h-12 rounded-full bg-gray-200"
                                        />
                                    ) : (
                                        <View className="w-12 h-12 rounded-full bg-blue-400 items-center justify-center">
                                            <Text className="text-white text-lg font-bold">
                                                {member.displayName
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    {/* Badge chìa khóa cho Owner/Admin */}
                                    {(member.role === "OWNER" ||
                                        member.role === "ADMIN") && (
                                        <View className="absolute -bottom-1 -right-1 bg-gray-200 rounded-full p-[2px] border-2 border-white">
                                            {/* Ở đây bạn có thể dùng hình ảnh chìa khóa vàng/bạc thay thế */}
                                            <View
                                                className={`w-3 h-3 rounded-full ${member.role === "OWNER" ? "bg-yellow-400" : "bg-gray-400"}`}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Name & Role */}
                                <View className="flex-1 justify-center">
                                    <Text className="text-[16px] text-black mb-0.5">
                                        {member.displayName}
                                    </Text>
                                    <Text className="text-[13px] text-gray-500">
                                        {renderRoleLabel(member.role, isMe)}
                                    </Text>
                                </View>

                                {/* Nút tùy chọn (Chỉ hiện nếu mình là Admin/Owner HOẶC hiện cho người khác nếu là chức năng nhắn tin/thêm bạn) */}
                                {!isMe && (
                                    <TouchableOpacity
                                        className="p-2"
                                        onPress={() =>
                                            handleMemberOptions(member)
                                        }
                                    >
                                        <MoreVertical
                                            color="#9ca3af"
                                            size={20}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                    <View className="h-10" />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// Component Tab tái sử dụng
function TabButton({
    title,
    isActive,
    onPress,
}: {
    title: string;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            className="flex-1 items-center justify-center py-3"
            onPress={onPress}
        >
            <Text
                className={`text-[14px] ${
                    isActive ? "text-blue-500 font-semibold" : "text-gray-500"
                }`}
            >
                {title}
            </Text>
            {isActive && (
                <View className="absolute bottom-0 w-full h-[2px] bg-blue-500" />
            )}
        </TouchableOpacity>
    );
}
