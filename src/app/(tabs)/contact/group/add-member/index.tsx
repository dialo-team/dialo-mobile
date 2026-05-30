import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { connectionsApi } from "@/src/api/friend/connectionsApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { groupApi } from "@/src/api/group/groupApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowRight,
    CheckCircle2,
    Circle,
    Search,
    X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SelectableUser = {
    counterpartId: string;
    counterpartName: string;
    counterpartAvatarUrl: string;
    lastMessageAt?: string;
};

function formatRelativeTime(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
}

const buildProfileDisplay = (profile: any) => ({
    name: pickBestDisplayName(
        [
            profile?.displayName,
            profile?.fullName,
            profile?.userName,
            profile?.username,
            profile?.name,
        ],
        "Người dùng",
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

export default function AddMemberToGroup() {
    const router = useRouter();
    // Lấy conversationId từ URL params để biết đang thêm vào nhóm nào
    const params = useLocalSearchParams<{
        conversationId?: string;
        preselectedUserId?: string;
    }>();
    const conversationId = params.conversationId as string;
    const preselectedUserId = params.preselectedUserId as string | undefined;

    const [currentUserId, setCurrentUserId] = useState("");
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState<"RECENT" | "CONTACTS">("RECENT");
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState<SelectableUser[]>([]);
    const [contactUsers, setContactUsers] = useState<SelectableUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SelectableUser[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [hasAutoSelected, setHasAutoSelected] = useState(false);

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

    const loadSelectableUsers = useCallback(async () => {
        if (!currentUserId || !conversationId) return;
        setLoading(true);
        try {
            // Lấy danh sách đoạn chat, bạn bè VÀ danh sách thành viên HIỆN TẠI của nhóm
            const [conversationsRes, contactsRes, groupMembersRes] =
                await Promise.all([
                    chatApi.getConversations(),
                    connectionsApi.getFriendsList(),
                    groupApi.getGroupMembers(conversationId, currentUserId),
                ]);

            // Trích xuất ID của những người ĐÃ CÓ trong nhóm
            const existingMembers = Array.isArray(groupMembersRes)
                ? groupMembersRes
                : (groupMembersRes as any)?.data || [];
            const existingMemberIds = new Set(
                existingMembers.map((m: any) => String(m.userId)),
            );

            const conversationList = Array.isArray(conversationsRes)
                ? conversationsRes
                : [];

            // Xử lý tab Gần đây
            const recentMapped = await Promise.all(
                conversationList.map(async (conversation: any) => {
                    // Loại bỏ nhóm (group)
                    const isGroup =
                        conversation?.isGroup === true ||
                        String(
                            conversation?.conversationType ||
                                conversation?.type ||
                                "",
                        ).toLowerCase() === "group" ||
                        !!conversation?.groupName;

                    if (isGroup) return null;
                    if (!conversation?.counterpartId) return null;

                    const baseName = pickBestDisplayName(
                        [
                            conversation?.remarkName,

                            // direct
                            conversation?.counterpartName,
                            conversation?.counterpartUserName,

                            // counterpart object
                            conversation?.counterpart?.displayName,
                            conversation?.counterpart?.fullName,
                            conversation?.counterpart?.name,
                            conversation?.counterpart?.userName,
                            conversation?.counterpart?.username,

                            // user object fallback
                            conversation?.user?.displayName,
                            conversation?.user?.fullName,
                            conversation?.user?.name,
                            conversation?.user?.userName,
                            conversation?.user?.username,

                            // root fallback
                            conversation?.displayName,
                            conversation?.fullName,
                            conversation?.name,
                            conversation?.userName,
                        ],
                        "Người dùng",
                    );

                    const baseAvatar =
                        conversation?.counterpartAvatarUrl ||
                        conversation?.counterpartAvatar ||
                        conversation?.profilePictureUrl ||
                        conversation?.profilePicture ||
                        conversation?.photoUrl ||
                        conversation?.imageUrl ||
                        conversation?.avatarUrl ||
                        conversation?.avatar ||
                        "";

                    if (baseName !== "Người dùng" && baseAvatar) {
                        return {
                            counterpartId: String(conversation.counterpartId),
                            counterpartName: baseName,
                            counterpartAvatarUrl: baseAvatar,
                            lastMessageAt: conversation.lastMessageAt,
                        };
                    }

                    try {
                        const userRes = await friendApi.getUserById(
                            conversation.counterpartId,
                        );
                        const profile = userRes?.data || userRes;
                        const display = buildProfileDisplay(profile);
                        const isDefaultName = baseName === "Người dùng";

                        return {
                            counterpartId: String(conversation.counterpartId),
                            counterpartName:
                                !isDefaultName && baseName !== display.name
                                    ? baseName
                                    : display.name,
                            counterpartAvatarUrl: baseAvatar || display.avatar,
                            lastMessageAt: conversation.lastMessageAt,
                        };
                    } catch {
                        return {
                            counterpartId: String(conversation.counterpartId),
                            counterpartName: baseName,
                            counterpartAvatarUrl: baseAvatar,
                            lastMessageAt: conversation.lastMessageAt,
                        };
                    }
                }),
            );

            // Lọc danh sách gần đây, CHỈ LOẠI BỎ những người đã có sẵn trong nhóm
            const recent = recentMapped.filter(Boolean) as SelectableUser[];
            const filteredRecent = recent.filter(
                (item) => !existingMemberIds.has(item.counterpartId),
            );

            // Xử lý tab Danh bạ
            const contacts = (Array.isArray(contactsRes) ? contactsRes : [])
                .map((item: any) => {
                    const profile = item?.friend || item?.user || item;
                    const display = buildProfileDisplay(profile);
                    const id = String(
                        profile?.id ||
                            profile?.userId ||
                            item?.friendId ||
                            item?.id ||
                            "",
                    );

                    if (!id) return null;

                    return {
                        counterpartId: id,
                        counterpartName: display.name,
                        counterpartAvatarUrl: display.avatar,
                    };
                })
                .filter(Boolean) as SelectableUser[];

            // Lọc danh bạ, CHỈ LOẠI BỎ những người đã có sẵn trong nhóm (để hiện toàn bộ bạn bè)
            const validContacts = contacts.filter(
                (item) => !existingMemberIds.has(item.counterpartId),
            );

            setRecentUsers(filteredRecent);
            setContactUsers(validContacts);
        } catch (error) {
            console.error("[AddMember] loadSelectableUsers error:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    }, [conversationId, currentUserId]);

    useEffect(() => {
        loadSelectableUsers();
    }, [loadSelectableUsers]);

    useEffect(() => {
        if (!preselectedUserId || hasAutoSelected || loading) return;
        const allUsers = [...recentUsers, ...contactUsers];
        const match = allUsers.find(
            (u) => u.counterpartId === preselectedUserId,
        );
        if (match) {
            setSelectedUsers([match]);
            setHasAutoSelected(true);
        }
    }, [
        preselectedUserId,
        recentUsers,
        contactUsers,
        hasAutoSelected,
        loading,
    ]);

    const toggleSelectUser = (user: SelectableUser) => {
        setSelectedUsers((prev) => {
            const isSelected = prev.some(
                (item) => item.counterpartId === user.counterpartId,
            );

            return isSelected
                ? prev.filter(
                      (item) => item.counterpartId !== user.counterpartId,
                  )
                : [...prev, user];
        });
    };

    const removeUser = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.filter((item) => item.counterpartId !== userId),
        );
    };

    const sourceList = activeTab === "RECENT" ? recentUsers : contactUsers;
    const filteredList = useMemo(() => {
        const keyword = searchText.toLowerCase().trim();
        if (!keyword) return sourceList;

        return sourceList.filter((item) =>
            item.counterpartName.toLowerCase().includes(keyword),
        );
    }, [searchText, sourceList]);

    // Gọi API thêm thành viên
    const handleAddMembers = async () => {
        // 1. Kiểm tra trạng thái cơ bản
        if (selectedUsers.length === 0) {
            Alert.alert("Thông báo", "Vui lòng chọn ít nhất 1 thành viên.");
            return;
        }

        if (isAdding || !currentUserId || !conversationId) return;

        setIsAdding(true);

        try {
            // 2. Lấy lại danh sách thành viên hiện tại ngay trước khi Add
            // Mục đích: Tránh việc gửi ID người đã có trong nhóm khiến Backend crash (Lỗi 500)
            const groupMembersRes = await groupApi.getGroupMembers(
                conversationId,
                currentUserId,
            );

            // Xử lý linh hoạt format trả về của API
            const existingMembers = Array.isArray(groupMembersRes)
                ? groupMembersRes
                : (groupMembersRes as any)?.data || [];

            const existingMemberIds = new Set(
                existingMembers.map((m: any) => String(m.userId)),
            );

            // 3. Lọc danh sách memberIds FINAL cực kỳ sạch:
            // - Loại bỏ ID rỗng
            // - Loại bỏ chính mình (currentUserId)
            // - LOẠI BỎ những người đã có trong nhóm (existingMemberIds)
            const memberIds = selectedUsers
                .map((user) => user.counterpartId)
                .filter(
                    (id) =>
                        id &&
                        id !== currentUserId &&
                        !existingMemberIds.has(id),
                );

            console.log("memberIds FINAL sau khi lọc sạch:", memberIds);

            // 4. Nếu sau khi lọc không còn ai mới thì không gọi API nữa
            if (memberIds.length === 0) {
                Alert.alert(
                    "Thông báo",
                    "Người dùng bạn chọn đều đã có mặt trong nhóm.",
                );
                setIsAdding(false);
                return;
            }

            await groupApi.addMembers(conversationId, currentUserId, memberIds);

            Alert.alert("Thành công", "Đã thêm thành viên vào nhóm!");

            // Reset danh sách chọn và quay lại màn hình trước
            setSelectedUsers([]);
            router.back();
        } catch (error: any) {
            // Log chi tiết payload để đối chiếu nếu vẫn gặp lỗi 500
            console.error(
                "[AddMember] Chi tiết lỗi:",
                error?.response?.status,
                JSON.stringify(error?.response?.data, null, 2),
            );

            const errorMsg =
                error?.response?.data?.message ||
                "Không thể thêm thành viên vào nhóm.";
            Alert.alert("Lỗi hệ thống", errorMsg);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4"
                    >
                        <X size={26} color="black" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-bold text-black">
                            Thêm thành viên
                        </Text>
                        <Text className="text-xs text-gray-500">
                            Đã chọn: {selectedUsers.length}
                        </Text>
                    </View>
                </View>

                <View className="px-4 py-3">
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <Search size={20} color="gray" />
                        <TextInput
                            className="flex-1 ml-2 text-base"
                            placeholder="Tìm tên bạn bè"
                            placeholderTextColor="#9ca3af"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                </View>

                <View className="flex-row px-4 border-b border-gray-200">
                    <TouchableOpacity
                        className={`py-3 mr-6 ${activeTab === "RECENT" ? "border-b-2 border-blue-600" : ""}`}
                        onPress={() => setActiveTab("RECENT")}
                    >
                        <Text
                            className={`font-semibold ${activeTab === "RECENT" ? "text-blue-600" : "text-gray-500"}`}
                        >
                            GẦN ĐÂY
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`py-3 ${activeTab === "CONTACTS" ? "border-b-2 border-blue-600" : ""}`}
                        onPress={() => setActiveTab("CONTACTS")}
                    >
                        <Text
                            className={`font-semibold ${activeTab === "CONTACTS" ? "text-blue-600" : "text-gray-500"}`}
                        >
                            DANH BẠ
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1 bg-white"
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View className="py-10 items-center">
                            <ActivityIndicator size="small" color="#2563eb" />
                        </View>
                    ) : filteredList.length === 0 ? (
                        <Text className="text-center text-gray-500 mt-10">
                            Không tìm thấy người dùng
                        </Text>
                    ) : (
                        filteredList.map((user) => {
                            const isSelected = selectedUsers.some(
                                (item) =>
                                    item.counterpartId === user.counterpartId,
                            );
                            const initials = getInitials(user.counterpartName);

                            return (
                                <TouchableOpacity
                                    key={user.counterpartId}
                                    className="flex-row items-center px-4 py-3 border-b border-gray-50"
                                    activeOpacity={0.7}
                                    onPress={() => toggleSelectUser(user)}
                                >
                                    <View className="mr-4">
                                        {isSelected ? (
                                            <CheckCircle2
                                                size={24}
                                                color="#2563eb"
                                                fill="white"
                                            />
                                        ) : (
                                            <Circle size={24} color="#d1d5db" />
                                        )}
                                    </View>

                                    {user.counterpartAvatarUrl ? (
                                        <Image
                                            source={{
                                                uri: user.counterpartAvatarUrl,
                                            }}
                                            className="w-12 h-12 rounded-full bg-gray-200"
                                        />
                                    ) : (
                                        <View className="w-12 h-12 rounded-full bg-blue-400 items-center justify-center">
                                            <Text className="text-white font-semibold text-lg">
                                                {initials}
                                            </Text>
                                        </View>
                                    )}

                                    <View className="flex-1 ml-3 justify-center">
                                        <Text className="text-base font-medium text-black">
                                            {user.counterpartName}
                                        </Text>
                                        {user.lastMessageAt ? (
                                            <Text className="text-xs text-gray-500 mt-0.5">
                                                {formatRelativeTime(
                                                    user.lastMessageAt,
                                                )}
                                            </Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>

                {selectedUsers.length > 0 ? (
                    <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-200">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="flex-1 mr-4"
                        >
                            {selectedUsers.map((user) => (
                                <TouchableOpacity
                                    key={user.counterpartId}
                                    className="mr-3 relative"
                                    onPress={() =>
                                        removeUser(user.counterpartId)
                                    }
                                >
                                    {user.counterpartAvatarUrl ? (
                                        <Image
                                            source={{
                                                uri: user.counterpartAvatarUrl,
                                            }}
                                            className="w-11 h-11 rounded-full bg-gray-200"
                                        />
                                    ) : (
                                        <View className="w-11 h-11 rounded-full bg-blue-400 items-center justify-center">
                                            <Text className="text-white font-semibold">
                                                {getInitials(
                                                    user.counterpartName,
                                                )}
                                            </Text>
                                        </View>
                                    )}
                                    <View className="absolute -top-1 -right-1 bg-gray-500 rounded-full p-0.5 border-2 border-white">
                                        <X size={10} color="white" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                                selectedUsers.length >= 1
                                    ? "bg-blue-600"
                                    : "bg-gray-400"
                            }`}
                            onPress={handleAddMembers}
                            disabled={isAdding || selectedUsers.length < 1}
                        >
                            {isAdding ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <ArrowRight size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                ) : null}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
