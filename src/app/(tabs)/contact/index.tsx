import { chatApi, normalizeConversationIdentity } from "@/src/api/chat/chatApi";
import { ChatConversationItem } from "@/src/api/chat/types";
import { connectionsApi } from "@/src/api/friend/connectionsApi";
import { extractBlockedUserId, friendApi } from "@/src/api/friend/friendApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Cake, Phone, Search, Users, Video } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const isValidImage = (url?: string | null) => {
    return (
        typeof url === "string" &&
        url.trim() !== "" &&
        /^https?:\/\//i.test(url)
    );
};

type Contact = {
    id: string;
    name: string;
    avatar: string;
};

type GroupConversation = ChatConversationItem & {
    conversationId: string;
};

export default function ContactsScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState<"FRIENDS" | "GROUPS">("FRIENDS");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [groups, setGroups] = useState<GroupConversation[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [blockedCount, setBlockedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    const timestamp = new Date().getTime();

                    const [
                        friendsResult,
                        pendingResult,
                        blockedResult,
                        conversationsResult,
                    ] = await Promise.allSettled([
                        connectionsApi.getFriendsList(),
                        friendApi.getPendingRequests(),
                        friendApi.getBlockedUsers(),
                        chatApi.getConversations(),
                    ]);

                    const friendsResRaw =
                        friendsResult.status === "fulfilled"
                            ? friendsResult.value
                            : [];
                    const pendingRes =
                        pendingResult.status === "fulfilled"
                            ? pendingResult.value
                            : [];
                    const blockedUsersList =
                        blockedResult.status === "fulfilled"
                            ? blockedResult.value
                            : [];
                    const conversationsRes =
                        conversationsResult.status === "fulfilled"
                            ? conversationsResult.value
                            : [];

                    if (!isMounted) return;

                    // --- PHẦN QUAN TRỌNG: Mapping Bạn bè không để mất data ---
                    const rawArray = Array.isArray(friendsResRaw)
                        ? friendsResRaw
                        : [];
                    const mappedFriends = rawArray
                        .map((item: any) => {
                            // Backend có thể trả về thông tin nằm trong object 'friend', 'user' hoặc nằm ngoài cùng
                            const u = item.friend || item.user || item;

                            return {
                                id: String(
                                    u.id ||
                                        u.userId ||
                                        item.friendId ||
                                        item.id ||
                                        "",
                                ),
                                name: pickBestDisplayName(
                                    [
                                        item.remarkName, // Ưu tiên tên gợi nhớ bạn đặt
                                        u.displayName,
                                        u.fullName,
                                        u.userName,
                                        item.friendUserName, // Trường từ log cũ của bạn
                                        u.name,
                                    ],
                                    "Người dùng",
                                ),
                                avatar:
                                    u.avatar ||
                                    u.avatarUrl ||
                                    item.friendAvatar ||
                                    u.profilePicture ||
                                    "",
                            };
                        })
                        .filter((f) => f.id !== ""); // Chỉ lọc những người ko có ID, tuyệt đối ko lọc mất tên

                    // --- PHẦN MỚI: Mapping Danh sách Chặn để gộp vào Danh bạ ---
                    const rawBlocked = Array.isArray(blockedUsersList)
                        ? blockedUsersList
                        : [];
                    const mappedBlocked = rawBlocked
                        .map((item: any) => {
                            const id = extractBlockedUserId(item);
                            return {
                                id: id,
                                name:
                                    item.blockedUserName ||
                                    item.name ||
                                    item.userName ||
                                    "Người dùng",
                                avatar:
                                    item.blockedAvatar ||
                                    item.avatarUrl ||
                                    item.avatar ||
                                    "",
                            };
                        })
                        .filter((b) => b.id !== "");

                    // --- PHẦN MỚI: Mapping Danh sách Cuộc trò chuyện đơn để gộp vào Danh bạ ---
                    const rawConversations = Array.isArray(conversationsRes)
                        ? conversationsRes
                        : [];
                    const mappedConversationsDirect = rawConversations
                        .map((conv: any) => normalizeConversationIdentity(conv))
                        .filter((conv) => !conv.isGroup)
                        .map((conv) => {
                            const counterpartId = String(
                                conv.counterpartId || conv.targetUserId || "",
                            );
                            const counterpartName = pickBestDisplayName(
                                [
                                    conv.remarkName,
                                    conv.counterpartName,
                                    conv.displayName,
                                    conv.fullName,
                                    conv.userName,
                                    conv.name,
                                ],
                                "Người dùng",
                            );
                            const counterpartAvatar =
                                conv.counterpartAvatarUrl ||
                                conv.avatarUrl ||
                                "";
                            return {
                                id: counterpartId,
                                name: counterpartName,
                                avatar: counterpartAvatar,
                            };
                        })
                        .filter((c) => c.id !== "");

                    // Gộp ba danh sách và loại bỏ trùng lặp bằng Map (ưu tiên mappedFriends -> mappedConversationsDirect -> mappedBlocked)
                    const combinedMap = new Map<string, Contact>();
                    mappedFriends.forEach((f) => combinedMap.set(f.id, f));
                    mappedConversationsDirect.forEach((c) => {
                        if (!combinedMap.has(c.id)) {
                            combinedMap.set(c.id, c);
                        }
                    });
                    mappedBlocked.forEach((b) => {
                        if (!combinedMap.has(b.id)) {
                            combinedMap.set(b.id, b);
                        }
                    });
                    const rawCombinedList = Array.from(combinedMap.values());

                    const isGenericName = (val?: string) => {
                        const norm = (val || "").trim().toLowerCase();
                        return (
                            !norm ||
                            norm === "nguoi dung" ||
                            norm === "người dùng" ||
                            norm === "user" ||
                            norm === "unknown"
                        );
                    };

                    const finalFriendsList = await Promise.all(
                        rawCombinedList.map(async (contact) => {
                            // Nếu đã có trong danh sách bạn bè chuẩn và không phải tên mặc định thì dùng luôn
                            const isAlreadyFriend = rawArray.some(
                                (item: any) => {
                                    const u = item.friend || item.user || item;
                                    const fid = String(
                                        u.id ||
                                            u.userId ||
                                            item.friendId ||
                                            item.id ||
                                            "",
                                    );
                                    return fid === contact.id;
                                },
                            );

                            if (
                                isAlreadyFriend &&
                                !isGenericName(contact.name) &&
                                contact.avatar
                            ) {
                                return contact;
                            }

                            // Ngược lại, hoặc nếu thiếu avatar/tên mặc định, ta gọi API để enrich chính xác
                            try {
                                const userRes = await friendApi.getUserById(
                                    contact.id,
                                );
                                const profile = userRes?.data || userRes;

                                const combinedName =
                                    `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();
                                const correctName = pickBestDisplayName(
                                    [
                                        profile?.remarkName,
                                        profile?.displayName,
                                        profile?.fullName,
                                        combinedName,
                                        profile?.userName,
                                        profile?.username,
                                        profile?.name,
                                        profile?.nickName,
                                        profile?.nickname,
                                    ],
                                    contact.name || "Người dùng",
                                );

                                const correctAvatar =
                                    profile?.avatarUrl ||
                                    profile?.avatar ||
                                    profile?.profilePictureUrl ||
                                    profile?.profilePicture ||
                                    contact.avatar ||
                                    "";

                                return {
                                    id: contact.id,
                                    name: correctName,
                                    avatar: correctAvatar,
                                };
                            } catch {
                                return contact;
                            }
                        }),
                    );

                    // --- Mapping Nhóm (giữ nguyên logic chuẩn) ---
                    const normalizedGroups = (
                        Array.isArray(conversationsRes) ? conversationsRes : []
                    )
                        .map((conversation) =>
                            normalizeConversationIdentity(conversation),
                        )
                        .filter((conv) => conv.isGroup)
                        .map((group) => ({
                            ...group,
                            counterpartName: pickBestDisplayName(
                                [
                                    group.groupName,
                                    group.counterpartName,
                                    group.name,
                                ],
                                "Nhóm",
                            ),
                            counterpartAvatarUrl:
                                group.groupAvatarUrl ||
                                group.counterpartAvatarUrl ||
                                "",
                        }));

                    if (!isMounted) return;

                    // --- Cập nhật State ---
                    setContacts(finalFriendsList);
                    setGroups(normalizedGroups);

                    const pData = pendingRes?.data || pendingRes || [];
                    setPendingCount(Array.isArray(pData) ? pData.length : 0);
                    setBlockedCount(
                        Array.isArray(blockedUsersList)
                            ? blockedUsersList.length
                            : 0,
                    );
                } catch (error) {
                    console.error("[ContactsScreen] Lỗi fetchData:", error);
                } finally {
                    if (isMounted) setIsLoading(false);
                }
            };

            fetchData();

            return () => {
                isMounted = false; // Chống leak memory khi user chuyển sang tab khác nhanh
            };
        }, []), // Dependency rỗng để chỉ chạy khi màn hình được Focus
    );

    const groupContacts = (contactList: Contact[]) => {
        const grouped: Record<string, Contact[]> = {};

        contactList.forEach((contact) => {
            const nameParts = contact.name.trim().split(/\s+/);
            const firstName = nameParts[nameParts.length - 1];
            const firstLetter = firstName.charAt(0).toUpperCase();

            if (!grouped[firstLetter]) {
                grouped[firstLetter] = [];
            }
            grouped[firstLetter].push(contact);
        });

        return Object.keys(grouped)
            .sort()
            .map((letter) => ({
                section: letter,
                data: grouped[letter].sort((a, b) =>
                    a.name.localeCompare(b.name),
                ),
            }));
    };

    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchText.toLowerCase().trim()),
    );

    const contactsData = groupContacts(filteredContacts);

    const filteredGroups = useMemo(
        () =>
            groups.filter((group) =>
                pickBestDisplayName(
                    [group.groupName, group.counterpartName],
                    "Nhóm",
                )
                    .toLowerCase()
                    .includes(searchText.toLowerCase().trim()),
            ),
        [groups, searchText],
    );

    const formatLastTime = (value?: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const now = new Date();
        const diffHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60),
        );

        if (diffHours > 0 && diffHours < 24) {
            return `${diffHours} giờ`;
        }

        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatPreview = (item: GroupConversation) => {
        if (item.lastMessageType === "IMAGE") return "[Ảnh]";
        if (item.lastMessageType === "VIDEO") return "[Video]";
        if (item.lastMessageType === "FILE") return "[File]";
        return item.lastMessage || "";
    };

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={["top", "left", "right"]}
        >
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
                    onPress={() => router.push("/contact/friend/add" as any)}
                >
                    <Feather name="user-plus" size={26} color="white" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 bg-white">
                <View className="flex-row border-b border-gray-200">
                    <TouchableOpacity
                        className={`flex-1 items-center py-3 ${
                            activeTab === "FRIENDS"
                                ? "border-b-2 border-blue-600"
                                : ""
                        }`}
                        onPress={() => setActiveTab("FRIENDS")}
                    >
                        <Text
                            className={`font-medium text-[15px] ${
                                activeTab === "FRIENDS"
                                    ? "text-blue-600"
                                    : "text-gray-500"
                            }`}
                        >
                            Bạn bè
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 items-center py-3 ${
                            activeTab === "GROUPS"
                                ? "border-b-2 border-blue-600"
                                : ""
                        }`}
                        onPress={() => setActiveTab("GROUPS")}
                    >
                        <Text
                            className={`font-medium text-[15px] ${
                                activeTab === "GROUPS"
                                    ? "text-blue-600"
                                    : "text-gray-500"
                            }`}
                        >
                            Nhóm
                        </Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#0068FF" />
                    </View>
                ) : (
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 12 }}
                    >
                        {activeTab === "FRIENDS" ? (
                            <>
                                <View className="py-2">
                                    <TouchableOpacity
                                        className="flex-row items-center px-4 py-3"
                                        onPress={() =>
                                            router.push(
                                                "/contact/friend/requests" as any,
                                            )
                                        }
                                    >
                                        <View className="w-10 h-10 rounded-full bg-[#0091FF] items-center justify-center">
                                            <Users size={24} color={"white"} />
                                        </View>
                                        <View className="flex-row items-center flex-1 ml-3">
                                            <Text className="text-base font-normal text-black">
                                                Lời mời kết bạn
                                            </Text>
                                            {pendingCount > 0 && (
                                                <Text className="text-gray-400 ml-1 text-base">
                                                    ({pendingCount})
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity className="flex-row items-center px-4 py-3">
                                        <View className="w-10 h-10 rounded-full bg-[#0091FF] items-center justify-center">
                                            <Cake size={24} color={"white"} />
                                        </View>
                                        <Text className="text-base font-normal text-black ml-3">
                                            Sinh nhật
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="flex-row items-center px-4 py-3"
                                        onPress={() =>
                                            router.push(
                                                "/contact/friend/blocked" as any,
                                            )
                                        }
                                    >
                                        <View className="w-10 h-10 rounded-full bg-[#FF6B6B] items-center justify-center">
                                            <Users size={22} color={"white"} />
                                        </View>
                                        <Text className="text-base font-normal text-black ml-3">
                                            Danh sách đã chặn ({blockedCount})
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center px-4 py-2 border-y border-gray-100 bg-gray-50/50">
                                    <TouchableOpacity className="bg-gray-200 px-4 py-1.5 rounded-full flex-row items-center mr-2">
                                        <Text className="text-black font-medium text-[13px]">
                                            Tất cả{" "}
                                        </Text>
                                        <Text className="text-black font-semibold text-[13px]">
                                            {contacts.length}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="bg-white border border-gray-300 px-4 py-1.5 rounded-full flex-row items-center">
                                        <Text className="text-gray-600 font-medium text-[13px]">
                                            Mới truy cập{" "}
                                        </Text>
                                        <Text className="text-gray-600 font-semibold text-[13px]">
                                            0
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {contactsData.length === 0 ? (
                                    <View className="mt-10 items-center justify-center">
                                        <Text className="text-gray-500">
                                            Bạn chưa có bạn bè nào trong danh
                                            bạ.
                                        </Text>
                                    </View>
                                ) : (
                                    contactsData.map((section, index) => (
                                        <View key={index}>
                                            <View className="flex-row items-center justify-between px-4 py-3 bg-white">
                                                <View className="flex-row items-center">
                                                    <Text className="font-bold text-black text-[14px]">
                                                        {section.section}
                                                    </Text>
                                                </View>
                                            </View>

                                            {section.data.map((user) => (
                                                <TouchableOpacity
                                                    key={user.id}
                                                    className="flex-row items-center px-4 py-2 bg-white border-b border-gray-50"
                                                    onPress={async () => {
                                                        let chatId = user.id;

                                                        try {
                                                            const existingId =
                                                                await chatApi.findConversationIdByUserId(
                                                                    user.id,
                                                                );
                                                            if (existingId) {
                                                                chatId =
                                                                    existingId;
                                                            }
                                                        } catch (error) {
                                                            console.warn(
                                                                "Could not resolve conversationId for contact:",
                                                                error,
                                                            );
                                                        }

                                                        router.push({
                                                            pathname:
                                                                "/message/chat/[id]",
                                                            params: {
                                                                id: chatId,
                                                                targetUserId:
                                                                    user.id,
                                                                name: user.name,
                                                                avatar: user.avatar,
                                                                from: "contact",
                                                            },
                                                        } as any);
                                                    }}
                                                >
                                                    {isValidImage(
                                                        user.avatar,
                                                    ) ? (
                                                        <Image
                                                            source={{
                                                                uri: user.avatar,
                                                            }}
                                                            className="w-[46px] h-[46px] rounded-full"
                                                        />
                                                    ) : (
                                                        <View className="w-[46px] h-[46px] rounded-full bg-blue-500 items-center justify-center">
                                                            <Text className="text-white font-bold text-lg">
                                                                {getInitials(
                                                                    user.name,
                                                                )}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    <Text className="flex-1 text-[16px] font-normal text-black ml-3">
                                                        {user.name}
                                                    </Text>

                                                    <View className="flex-row items-center space-x-4">
                                                        <TouchableOpacity className="p-2">
                                                            <Phone
                                                                size={22}
                                                                color="#666"
                                                            />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity className="p-2">
                                                            <Video
                                                                size={24}
                                                                color="#666"
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ))
                                )}
                            </>
                        ) : (
                            <>
                                {/* THÊM MỚI: Nút Tạo nhóm */}
                                <TouchableOpacity
                                    className="flex-row items-center px-4 py-3 bg-white"
                                    onPress={() =>
                                        router.push(
                                            "/contact/group/create" as any,
                                        )
                                    }
                                >
                                    <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center border border-blue-100">
                                        <Feather
                                            name="users"
                                            size={22}
                                            color="#0068FF"
                                        />
                                    </View>
                                    <Text className="text-[16px] text-[#0068FF] font-medium ml-3">
                                        Tạo nhóm
                                    </Text>
                                </TouchableOpacity>

                                {/* THÊM MỚI: Thanh tiêu đề số lượng nhóm */}
                                <View className="flex-row items-center justify-between px-4 py-2 border-y border-gray-100 bg-gray-50/50">
                                    <Text className="text-black font-medium text-[13px]">
                                        Nhóm đang tham gia ({groups.length})
                                        {searchText && (
                                            <Text className="text-gray-500">
                                                {" "}
                                                · Tìm thấy (
                                                {filteredGroups.length})
                                            </Text>
                                        )}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-500 text-[13px]">
                                            ↓ Hoạt động cuối
                                        </Text>
                                    </View>
                                </View>

                                {/* DANH SÁCH NHÓM ĐƯỢC GIỮ NGUYÊN GIAO DIỆN */}
                                {filteredGroups.length === 0 ? (
                                    <View className="mt-10 items-center justify-center">
                                        <Text className="text-gray-500">
                                            Chưa có nhóm nào.
                                        </Text>
                                    </View>
                                ) : (
                                    filteredGroups.map((group) => {
                                        const displayName = pickBestDisplayName(
                                            [
                                                group.groupName,
                                                group.counterpartName,
                                            ],
                                            "Nhóm",
                                        );
                                        const avatar =
                                            group.groupAvatarUrl ||
                                            group.counterpartAvatarUrl ||
                                            "";

                                        return (
                                            <TouchableOpacity
                                                key={group.conversationId}
                                                onPress={() =>
                                                    router.push({
                                                        pathname:
                                                            "/(tabs)/message/group-chat/[id]",
                                                        params: {
                                                            id: group.conversationId,
                                                            name: displayName,
                                                            avatar,
                                                            isGroup: "true",
                                                        },
                                                    })
                                                }
                                                className="mx-3 mt-2 flex-row items-center px-3 py-3 rounded-2xl border border-gray-100 bg-white"
                                            >
                                                <View className="relative">
                                                    {isValidImage(avatar) ? (
                                                        <Image
                                                            source={{
                                                                uri: avatar,
                                                            }}
                                                            className="w-12 h-12 rounded-full"
                                                        />
                                                    ) : (
                                                        <View className="w-12 h-12 rounded-full items-center justify-center bg-blue-500">
                                                            <Text className="text-white font-semibold text-base">
                                                                {getInitials(
                                                                    displayName,
                                                                )}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <View className="flex-1 ml-3">
                                                    <View className="flex-row items-center justify-between">
                                                        <Text className="font-semibold text-gray-900 text-base">
                                                            {displayName}
                                                        </Text>
                                                        <Text className="text-gray-400 text-xs">
                                                            {formatLastTime(
                                                                group.lastMessageAt,
                                                            )}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        className="text-gray-600 text-sm mt-1 pr-2"
                                                        numberOfLines={1}
                                                    >
                                                        {formatPreview(group)}
                                                    </Text>
                                                </View>

                                                {(group.unreadCount || 0) >
                                                0 ? (
                                                    <View className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 items-center justify-center ml-2">
                                                        <Text className="text-white text-[11px] font-semibold">
                                                            {group.unreadCount &&
                                                            group.unreadCount >
                                                                99
                                                                ? "99+"
                                                                : group.unreadCount}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}
