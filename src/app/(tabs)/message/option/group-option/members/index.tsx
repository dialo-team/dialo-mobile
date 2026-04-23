import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ChevronLeft,
    MessageCircle,
    MoreVertical,
    Search,
    UserPlus,
    X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import API và Types
import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { groupApi } from "@/src/api/group/groupApi";
import { GroupMember } from "@/src/api/group/types";
import { userApi } from "@/src/api/user/userApi";
import { pickBestDisplayName } from "@/src/utils/displayUser";

// Các tab hiển thị
type TabType = "ALL" | "ADMINS" | "BLOCKED";

const CHAT_BASE_URL = "http://14.225.254.174:8085";
const resolveFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${CHAT_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

// ===== HELPER FUNCTIONS (từ GroupChatScreen) =====
const extractValidId = (item: any) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    return String(
        item?.userId ||
            item?.id ||
            item?.targetId ||
            item?.senderId ||
            item?.user?.id ||
            "",
    ).trim();
};

const extractNameCandidates = (item: any) => {
    if (!item) return [];
    return [
        item?.remarkName,
        item?.displayName,
        item?.fullName,
        item?.userName,
        item?.name,
        item?.user?.displayName,
        item?.user?.fullName,
        item?.user?.name,
        item?.friend?.displayName,
    ];
};

const extractAvatar = (profile: any) => {
    if (!profile) return null;
    return (
        profile?.avatarUrl ||
        profile?.avatar ||
        profile?.profilePictureUrl ||
        profile?.profilePicture ||
        profile?.photoUrl ||
        profile?.imageUrl ||
        profile?.user?.avatarUrl ||
        profile?.user?.profilePictureUrl ||
        null
    );
};

const normalizeMembers = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.members)) return data.members;
    if (Array.isArray(data.participants)) return data.participants;
    if (data.data && Array.isArray(data.data.members)) return data.data.members;
    if (data.data && Array.isArray(data.data.participants))
        return data.data.participants;
    return [];
};

// ===== ENRICHED MEMBER TYPE =====
type EnrichedMember = GroupMember & {
    enrichedDisplayName?: string;
    enrichedAvatarUrl?: string | null;
};

export default function GroupMembersPage() {
    const router = useRouter();
    const { conversationId } = useLocalSearchParams<{
        conversationId: string;
    }>();

    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [members, setMembers] = useState<EnrichedMember[]>([]);
    const [enrichedProfiles, setEnrichedProfiles] = useState<
        Record<string, any>
    >({});
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<TabType>("ALL");
    const [actionLoadingMemberId, setActionLoadingMemberId] = useState("");
    const [selectedMember, setSelectedMember] = useState<EnrichedMember | null>(
        null,
    );
    const [isModalVisible, setIsModalVisible] = useState(false);

    const openMemberModal = (member: EnrichedMember) => {
        setSelectedMember(member);
        setIsModalVisible(true);
    };

    const closeMemberModal = () => {
        setIsModalVisible(false);
        setSelectedMember(null);
    };

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

    const handleRemoveMember = async (selectedMember: EnrichedMember) => {
        if (!selectedMember || !conversationId) return;

        Alert.alert(
            "Xác nhận",
            `Bạn có chắc chắn muốn xóa ${selectedMember.enrichedDisplayName} khỏi nhóm?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await groupApi.removeMember(
                                conversationId,
                                selectedMember.userId,
                            );
                            closeMemberModal();
                            await loadMembers();
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa thành viên");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        );
    };

    const handlePromoteToAdmin = async (memberId: string) => {
        try {
            setLoading(true);
            await groupApi.assignRole(conversationId, memberId, "ADMIN");
            closeMemberModal();
            await loadMembers(); // Load lại danh sách để cập nhật UI
            Alert.alert("Thành công", "Đã bổ nhiệm làm phó nhóm"); // Bật lên nếu muốn hiện thông báo
        } catch (error) {
            Alert.alert("Lỗi", "Không thể bổ nhiệm phó nhóm");
        } finally {
            setLoading(false);
        }
    };

    // Load danh sách members + bổ sung dữ liệu
    const loadMembers = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            setLoading(true);

            // === BƯỚC 1 ===
            const [membersRes, detailRes] = await Promise.all([
                groupApi.getGroupMembers(conversationId, currentUserId),
                chatApi.getConversationDetail(conversationId).catch(() => ({})),
            ]);

            // === BƯỚC 2 ===
            const nextEnrichedProfiles: Record<string, any> = {};

            const membersData = [
                ...normalizeMembers(membersRes),
                ...normalizeMembers(detailRes?.data?.participants),
                ...normalizeMembers(detailRes?.data?.members),
            ];

            membersData.forEach((member: any) => {
                const mId = extractValidId(member);
                if (mId && mId !== "null" && mId !== "undefined") {
                    nextEnrichedProfiles[mId] = {
                        displayName: pickBestDisplayName(
                            extractNameCandidates(member),
                            "",
                        ),
                        avatarUrl: extractAvatar(member)
                            ? resolveFileUrl(extractAvatar(member))
                            : null,
                    };
                }
            });

            // === BƯỚC 3 ===
            const missingUserIds = new Set<string>();
            const existingMembers = normalizeMembers(membersRes);

            existingMembers.forEach((member: any) => {
                const mId = extractValidId(member);

                if (mId && mId !== "null" && mId !== currentUserId) {
                    // ✅ FIX: chỉ fetch khi thiếu hoàn toàn
                    if (
                        !nextEnrichedProfiles[mId]?.displayName &&
                        !nextEnrichedProfiles[mId]?.avatarUrl
                    ) {
                        missingUserIds.add(mId);
                    }
                }
            });

            // === BƯỚC 4: FETCH BỔ SUNG ===
            for (const userId of Array.from(missingUserIds)) {
                try {
                    const userRes = await friendApi.getUserById(userId); // ✅ đúng API
                    const userData = userRes?.data || userRes;

                    if (userData) {
                        nextEnrichedProfiles[userId] = {
                            displayName:
                                nextEnrichedProfiles[userId]?.displayName ||
                                pickBestDisplayName(
                                    extractNameCandidates(userData),
                                    "",
                                ),

                            avatarUrl:
                                nextEnrichedProfiles[userId]?.avatarUrl ||
                                (extractAvatar(userData)
                                    ? resolveFileUrl(extractAvatar(userData))
                                    : null),
                        };
                    }
                } catch (e) {
                    console.log(`[GroupMembers] skip user ${userId}`);
                }
            }

            // === BƯỚC 5: OVERRIDE CURRENT USER ===
            try {
                const myProfile = await userApi.getProfile();

                if (myProfile) {
                    nextEnrichedProfiles[currentUserId] = {
                        displayName: pickBestDisplayName(
                            extractNameCandidates(myProfile),
                            "Bạn",
                        ),
                        avatarUrl: extractAvatar(myProfile)
                            ? resolveFileUrl(extractAvatar(myProfile))
                            : null,
                    };
                }
            } catch {
                console.log("Không lấy được profile của mình");
            }

            // === SET STATE ===
            setEnrichedProfiles(nextEnrichedProfiles);

            // === BƯỚC 6: MAP ===
            const enrichedMembers = existingMembers.map((member: any) => {
                const mId = extractValidId(member);
                const profile = nextEnrichedProfiles[mId];

                return {
                    ...member,
                    enrichedDisplayName:
                        profile?.displayName ||
                        member.displayName ||
                        "Thành viên",

                    enrichedAvatarUrl:
                        profile?.avatarUrl ||
                        (member.avatarUrl
                            ? resolveFileUrl(member.avatarUrl)
                            : null),
                };
            });

            setMembers(enrichedMembers);
        } catch (error) {
            console.error("[GroupMembers] Load members error:", error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, currentUserId]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const currentUserMember = members.find(
        (member) => member.userId === currentUserId,
    );
    const canManageMembers = currentUserMember?.role === "OWNER";

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
    const goToAddMembers = () => {
        if (!conversationId) return;

        router.push({
            pathname: "/contact/group/add-member",
            params: { conversationId },
        });
    };

    const handleMemberOptions = (member: EnrichedMember) => {
        if (!canManageMembers || member.userId === currentUserId) {
            return;
        }

        const buttons: { text: string; style?: any; onPress?: () => void }[] =
            [];

        if (member.role !== "OWNER") {
            buttons.push({
                text: "Chuyển thành trưởng nhóm",
                onPress: async () => {
                    setActionLoadingMemberId(member.userId);
                    try {
                        await groupApi.assignRole(
                            conversationId,
                            member.userId,
                            "OWNER",
                        );
                        await loadMembers();
                    } catch (error) {
                        console.error(
                            "[GroupMembers] assign OWNER error:",
                            error,
                        );
                    } finally {
                        setActionLoadingMemberId("");
                    }
                },
            });
        }

        if (member.role !== "ADMIN") {
            buttons.push({
                text: "Gán quyền ADMIN",
                onPress: async () => {
                    setActionLoadingMemberId(member.userId);
                    try {
                        await groupApi.assignRole(
                            conversationId,
                            member.userId,
                            "ADMIN",
                        );
                        await loadMembers();
                    } catch (error) {
                        console.error(
                            "[GroupMembers] assign ADMIN error:",
                            error,
                        );
                    } finally {
                        setActionLoadingMemberId("");
                    }
                },
            });
        }

        if (member.role !== "MEMBER") {
            buttons.push({
                text: "Hạ xuống MEMBER",
                onPress: async () => {
                    setActionLoadingMemberId(member.userId);
                    try {
                        await groupApi.assignRole(
                            conversationId,
                            member.userId,
                            "MEMBER",
                        );
                        await loadMembers();
                    } catch (error) {
                        console.error(
                            "[GroupMembers] assign MEMBER error:",
                            error,
                        );
                    } finally {
                        setActionLoadingMemberId("");
                    }
                },
            });
        }

        buttons.push({
            text: "Xóa khỏi nhóm",
            style: "destructive",
            onPress: async () => {
                setActionLoadingMemberId(member.userId);
                try {
                    await groupApi.removeMember(conversationId, member.userId);
                    await loadMembers();
                } catch (error) {
                    console.error("[GroupMembers] remove member error:", error);
                } finally {
                    setActionLoadingMemberId("");
                }
            },
        });

        buttons.push({ text: "Huỷ", style: "cancel" });

        Alert.alert(
            `Tùy chọn cho ${member.enrichedDisplayName}`,
            "Chọn thao tác",
            buttons as any,
        );
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
                    <TouchableOpacity onPress={goToAddMembers}>
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

            {/* Mục Duyệt thành viên */}
            <TouchableOpacity
                className="flex-row items-center px-4 py-4 border-b border-gray-100"
                onPress={goToAddMembers}
            >
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
                    {activeTab === "ADMINS" && (
                        <View>
                            <View className="px-4 py-3 bg-gray-50">
                                <Text className="text-gray-500 text-[13px]">
                                    Những người có thể thay đổi các cài đặt nhóm
                                </Text>
                            </View>

                            {/* Chỉ hiển thị nút này nếu bạn là Trưởng nhóm */}
                            {canManageMembers && (
                                <TouchableOpacity
                                    className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 active:bg-gray-50"
                                    onPress={() => {
                                        router.push({
                                            pathname:
                                                "/message/option/group-option/add-admin", // Trỏ tới file sắp tạo ở Bước 2
                                            params: { conversationId },
                                        });
                                    }}
                                >
                                    <View className="relative mr-3">
                                        <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center border border-blue-100">
                                            <UserPlus
                                                color="#3b82f6"
                                                size={20}
                                            />
                                        </View>
                                    </View>
                                    <View className="flex-1 justify-center">
                                        <Text className="text-[16px] text-black">
                                            Thêm phó nhóm
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {filteredMembers.map((member) => {
                        const isMe = member.userId === currentUserId;
                        const displayName =
                            member.enrichedDisplayName ||
                            member.displayName ||
                            "Thành viên";
                        const avatarUri = member.enrichedAvatarUrl || "";

                        return (
                            <TouchableOpacity
                                key={member.userId}
                                className="flex-row items-center px-4 py-3 active:bg-gray-50"
                                onPress={() => openMemberModal(member)} // Thay đổi ở đây
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
                                                {displayName
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
                                        {displayName}
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
                                        disabled={
                                            !canManageMembers ||
                                            actionLoadingMemberId ===
                                                member.userId
                                        }
                                    >
                                        {actionLoadingMemberId ===
                                        member.userId ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#9ca3af"
                                            />
                                        ) : (
                                            <MoreVertical
                                                color={
                                                    canManageMembers
                                                        ? "#9ca3af"
                                                        : "#d1d5db"
                                                }
                                                size={20}
                                            />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                    <View className="h-10" />
                </ScrollView>
            )}

            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setIsModalVisible(false)}
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-t-3xl pb-10">
                                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                                    <View className="w-10" />
                                    <Text className="text-lg font-bold">
                                        Thông tin thành viên
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setIsModalVisible(false)}
                                    >
                                        <X color="black" size={24} />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center px-5 py-6">
                                    {selectedMember?.enrichedAvatarUrl ? (
                                        <Image
                                            source={{
                                                uri: selectedMember.enrichedAvatarUrl,
                                            }}
                                            className="w-16 h-16 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-16 h-16 rounded-full bg-blue-400 items-center justify-center">
                                            <Text className="text-white text-2xl font-bold">
                                                {selectedMember?.enrichedDisplayName?.charAt(
                                                    0,
                                                )}
                                            </Text>
                                        </View>
                                    )}
                                    <Text className="ml-4 text-xl font-semibold flex-1">
                                        {selectedMember?.enrichedDisplayName}
                                    </Text>
                                    <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
                                        <MessageCircle
                                            color="black"
                                            size={24}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity className="px-5 py-4 border-b border-gray-50">
                                    <Text className="text-[16px]">
                                        Xem trang cá nhân
                                    </Text>
                                </TouchableOpacity>

                                {canManageMembers &&
                                    selectedMember?.userId !== currentUserId &&
                                    selectedMember?.role === "MEMBER" && (
                                        <TouchableOpacity
                                            className="px-5 py-4 border-b border-gray-50"
                                            onPress={() =>
                                                selectedMember &&
                                                handlePromoteToAdmin(
                                                    selectedMember.userId,
                                                )
                                            }
                                        >
                                            <Text className="text-[16px] text-black">
                                                Bổ nhiệm làm phó nhóm
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                <TouchableOpacity className="px-5 py-4 border-b border-gray-50">
                                    <Text className="text-[16px]">
                                        Chặn thành viên
                                    </Text>
                                </TouchableOpacity>

                                {canManageMembers &&
                                    selectedMember?.userId !==
                                        currentUserId && (
                                        <TouchableOpacity
                                            className="px-5 py-4"
                                            onPress={() =>
                                                selectedMember &&
                                                handleRemoveMember(
                                                    selectedMember,
                                                )
                                            }
                                        >
                                            <Text className="text-[16px] text-red-500">
                                                Xóa khỏi nhóm
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
