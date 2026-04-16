import { chatApi } from "@/src/api/chat/chatApi";
import { connectionsApi } from "@/src/api/friend/connectionsApi";
import { friendApi } from "@/src/api/friend/friendApi"; // Thêm API
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router"; // Thêm useFocusEffect
import { Cake, Phone, Search, Users, Video } from "lucide-react-native";
import React, { useCallback, useState } from "react";
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

// Định nghĩa kiểu dữ liệu Bạn bè
type Contact = {
    id: string;
    name: string;
    avatar: string;
};

export default function ContactsScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [blockedCount, setBlockedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // ... (Giữ nguyên các phần khác)

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const fetchData = async () => {
                try {
                    setIsLoading(true);

                    // 1. Gọi API - Sử dụng trực tiếp apiClient hoặc xem response thô
                    const [friendsResRaw, pendingRes, blockedRes] =
                        await Promise.all([
                            // Gọi trực tiếp để xem cấu trúc thật
                            connectionsApi.getFriendsList(),
                            friendApi.getPendingRequests(),
                            connectionsApi.getBlockedList(),
                        ]);

                    // LOG KIỂM TRA: Bạn hãy xem log này ở terminal
                    console.log(
                        "DEBUG FRIENDS RES:",
                        JSON.stringify(friendsResRaw),
                    );

                    if (!isMounted) return;

                    // 2. Xử lý logic mapping cực kỳ linh hoạt
                    // Nếu friendsResRaw rỗng, có thể do normalizeList không quét đúng key
                    const rawArray = Array.isArray(friendsResRaw)
                        ? friendsResRaw
                        : [];

                    const mappedFriends = rawArray.map((item: any) => {
                        // Cố gắng tìm thông tin user dù Backend trả về kiểu gì
                        const u = item.friend || item.user || item;

                        return {
                            id:
                                u.id ||
                                u.userId ||
                                item.friendId ||
                                item.id ||
                                Math.random().toString(),
                            name: pickBestDisplayName(
                                [
                                    u.displayName,
                                    u.fullName,
                                    u.userName,
                                    item.friendUserName,
                                    u.name,
                                ],
                                "Người dùng",
                            ),
                            avatar:
                                u.avatar ||
                                u.avatarUrl ||
                                item.friendAvatar ||
                                "",
                        };
                    });

                    if (isMounted) {
                        setContacts(mappedFriends);

                        const pData = pendingRes?.data || pendingRes || [];
                        setPendingCount(
                            Array.isArray(pData) ? pData.length : 0,
                        );

                        setBlockedCount(
                            Array.isArray(blockedRes) ? blockedRes.length : 0,
                        );
                    }
                } catch (error) {
                    console.error("Lỗi fetch danh bạ:", error);
                } finally {
                    if (isMounted) setIsLoading(false);
                }
            };

            fetchData();
            return () => {
                isMounted = false;
            };
        }, []),
    );

    // groupBy: Ưu tiên group theo chữ cái đầu của TÊN (từ cuối cùng)
    const groupContacts = (contactList: Contact[]) => {
        const grouped: Record<string, Contact[]> = {};

        contactList.forEach((contact) => {
            const nameParts = contact.name.trim().split(/\s+/);
            const firstName = nameParts[nameParts.length - 1]; // Lấy "Anh" trong "Nguyễn Văn Anh"
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

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={["top", "left", "right"]}
        >
            {/* Header: Thanh tìm kiếm */}
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
                {/* Tabs: Bạn bè, Nhóm */}
                <View className="flex-row border-b border-gray-200">
                    <TouchableOpacity className="flex-1 items-center py-3 border-b-2 border-blue-600">
                        <Text className="text-blue-600 font-medium text-[15px]">
                            Bạn bè
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 items-center py-3">
                        <Text className="text-gray-500 font-medium text-[15px]">
                            Nhóm
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Nội dung cuộn chính */}
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
                        {/* Lời mời kết bạn & Sinh nhật */}
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
                                    {/* HIỂN THỊ SỐ LƯỢNG CHỜ XÁC NHẬN */}
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

                        {/* Bộ lọc (Pills) */}
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

                        {/* Danh sách người dùng */}
                        {contactsData.length === 0 ? (
                            <View className="mt-10 items-center justify-center">
                                <Text className="text-gray-500">
                                    Bạn chưa có bạn bè nào trong danh bạ.
                                </Text>
                            </View>
                        ) : (
                            contactsData.map((section, index) => (
                                <View key={index}>
                                    {/* Section Header */}
                                    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
                                        <View className="flex-row items-center">
                                            <Text className="font-bold text-black text-[14px]">
                                                {section.section}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Section Items */}
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
                                                        chatId = existingId;
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
                                                        targetUserId: user.id,
                                                        name: user.name,
                                                        avatar: user.avatar,
                                                        from: "contact",
                                                    },
                                                } as any);
                                            }}
                                        >
                                            {isValidImage(user.avatar) ? (
                                                <Image
                                                    source={{
                                                        uri: user.avatar,
                                                    }}
                                                    className="w-[46px] h-[46px] rounded-full"
                                                />
                                            ) : (
                                                <View className="w-[46px] h-[46px] rounded-full bg-blue-500 items-center justify-center">
                                                    <Text className="text-white font-bold text-lg">
                                                        {getInitials(user.name)}
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
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}
