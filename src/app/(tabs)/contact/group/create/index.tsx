import { chatApi } from "@/src/api/chat/chatApi";
import { connectionsApi } from "@/src/api/friend/connectionsApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { groupApi } from "@/src/api/group/groupApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useRouter } from "expo-router";
import {
    ArrowRight,
    Camera,
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

    if (diffMinutes < 1) return "vua xong";
    if (diffMinutes < 60) return `${diffMinutes} phut truoc`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} gio truoc`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngay truoc`;

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

export default function CreateGroup() {
    const router = useRouter();

    const [groupName, setGroupName] = useState("");
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState<"RECENT" | "CONTACTS">("RECENT");
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState<SelectableUser[]>([]);
    const [contactUsers, setContactUsers] = useState<SelectableUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SelectableUser[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const loadSelectableUsers = useCallback(async () => {
        setLoading(true);
        try {
            const [conversationsRes, contactsRes] = await Promise.all([
                chatApi.getConversations(),
                connectionsApi.getFriendsList(),
            ]);

            const conversationList = Array.isArray(conversationsRes)
                ? conversationsRes
                : [];

            const recentMapped = await Promise.all(
                conversationList.map(async (conversation: any) => {
                    // Detect group: counterpartId === conversationId (group pattern from API)
                    const isGroup =
                        conversation?.isGroup === true ||
                        String(
                            conversation?.conversationType ||
                                conversation?.type ||
                                "",
                        ).toLowerCase() === "group" ||
                        !!conversation?.groupName ||
                        (conversation?.counterpartId &&
                            conversation?.conversationId &&
                            conversation?.counterpartId ===
                                conversation?.conversationId);

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
                            conversation?.username,
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

                    const isDefaultName =
                        !baseName ||
                        baseName.trim().toLowerCase() === "nguoi dung";

                    if (!isDefaultName && baseAvatar) {
                        console.log(
                            "[DEBUG CreateGroup] Using baseName from conversation:",
                            {
                                baseName,
                                counterpartId: conversation.counterpartId,
                            },
                        );
                        return {
                            counterpartId: String(conversation.counterpartId),
                            counterpartName: baseName,
                            counterpartAvatarUrl: baseAvatar,
                            lastMessageAt: conversation.lastMessageAt,
                        };
                    }

                    try {
                        console.log(
                            "[DEBUG CreateGroup] Fallback to getUserById:",
                            {
                                counterpartId: conversation.counterpartId,
                                reason:
                                    baseName === "Người dùng"
                                        ? "no name"
                                        : "no avatar",
                            },
                        );

                        const userRes = await friendApi.getUserById(
                            conversation.counterpartId,
                        );
                        const profile = userRes?.data || userRes;

                        console.log(
                            "[DEBUG CreateGroup] getUserById response:",
                            {
                                profile: profile ? Object.keys(profile) : null,
                                displayName: profile?.displayName,
                                fullName: profile?.fullName,
                                userName: profile?.userName,
                                name: profile?.name,
                            },
                        );

                        const display = buildProfileDisplay(profile);

                        console.log(
                            "[DEBUG CreateGroup] buildProfileDisplay result:",
                            {
                                name: display.name,
                                avatar: display.avatar ? "✓" : "✗",
                            },
                        );

                        return {
                            counterpartId: String(conversation.counterpartId),
                            counterpartName:
                                baseName &&
                                baseName.trim().toLowerCase() !== "nguoi dung"
                                    ? baseName
                                    : display.name || baseName || "User",
                            counterpartAvatarUrl: baseAvatar || display.avatar,
                            lastMessageAt: conversation.lastMessageAt,
                        };
                    } catch (error) {
                        console.log(
                            "[DEBUG CreateGroup] Error in getUserById, falling back:",
                            {
                                counterpartId: conversation.counterpartId,
                                error: String(error),
                                baseName,
                            },
                        );
                        return {
                            counterpartId: String(conversation.counterpartId),
                            counterpartName: baseName,
                            counterpartAvatarUrl: baseAvatar,
                            lastMessageAt: conversation.lastMessageAt,
                        };
                    }
                }),
            );

            const recent = recentMapped.filter(Boolean) as SelectableUser[];
            const recentIds = new Set(recent.map((item) => item.counterpartId));

            console.log(
                "[DEBUG CreateGroup] Final recent users:",
                recent.map((r) => ({
                    id: r.counterpartId,
                    name: r.counterpartName,
                    avatar: r.counterpartAvatarUrl ? "✓" : "✗",
                })),
            );

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

            const dedupedContacts = contacts.filter(
                (item) => !recentIds.has(item.counterpartId),
            );

            console.log(
                "[DEBUG CreateGroup] Final contacts (deduped):",
                dedupedContacts.map((c) => ({
                    id: c.counterpartId,
                    name: c.counterpartName,
                    avatar: c.counterpartAvatarUrl ? "✓" : "✗",
                })),
            );

            setRecentUsers(recent);
            setContactUsers(dedupedContacts);
        } catch (error) {
            console.error("[CreateGroup] loadSelectableUsers error:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSelectableUsers();
    }, [loadSelectableUsers]);

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

    const handleCreateGroup = async () => {
        // 1. Kiểm tra điều kiện trước khi gọi API
        if (selectedUsers.length < 3 || isCreating) {
            if (selectedUsers.length > 0 && selectedUsers.length < 3) {
                Alert.alert(
                    "Thiếu thành viên",
                    "Vui lòng chọn ít nhất 3 người để tạo nhóm.",
                );
            }
            return;
        }

        const defaultName = selectedUsers
            .map((user) => user.counterpartName)
            .join(", ");
        const finalGroupName =
            groupName.trim() !== "" ? groupName.trim() : defaultName;

        setIsCreating(true);
        try {
            const memberIds = selectedUsers.map((user) => user.counterpartId);
            const result = await groupApi.createGroup(
                finalGroupName,
                memberIds,
            );

            const payload = result?.data || result;
            const newConversationId =
                payload?.id || payload?.conversationId || payload?.groupId;

            if (newConversationId) {
                Alert.alert("Thành công", "Tạo nhóm thành công!");

                // 2. Điều hướng thẳng vào group-chat bằng replace để không quay lại màn hình tạo nhóm được nữa
                router.replace({
                    pathname: "/(tabs)/message/group-chat/[id]" as any,
                    params: {
                        id: newConversationId,
                        name: finalGroupName,
                        avatar: "",
                        isGroup: "true",
                    },
                });
            } else {
                // Nếu không lấy được ID, quay về danh sách và refresh
                await loadSelectableUsers();
                router.replace("/(tabs)/message" as any);
            }
        } catch (error: any) {
            console.error("[CreateGroup] Error creating group:", error);
            Alert.alert("Lỗi", error?.message || "Không thể tạo nhóm.");
        } finally {
            setIsCreating(false);
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
                        onPress={() => router.replace("/message")}
                        className="mr-4"
                    >
                        <X size={26} color="black" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-bold text-black">
                            Nhóm mới
                        </Text>
                        <Text className="text-xs text-gray-500">
                            Đã chọn: {selectedUsers.length}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
                    <TouchableOpacity className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3">
                        <Camera size={22} color="gray" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 text-base py-2"
                        placeholder="Đặt tên nhóm"
                        placeholderTextColor="#9ca3af"
                        value={groupName}
                        onChangeText={setGroupName}
                    />
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
                            Khong tim thay nguoi dung
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
                                selectedUsers.length >= 3
                                    ? "bg-blue-600"
                                    : "bg-gray-400"
                            }`}
                            onPress={handleCreateGroup}
                            disabled={isCreating || selectedUsers.length < 3}
                        >
                            {isCreating ? (
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
