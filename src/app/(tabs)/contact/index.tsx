import { friendApi } from "@/src/api/friend/friendApi"; // Thêm API
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router"; // Thêm useFocusEffect
import { Cake, Phone, Search, Users, Video } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
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

// Định nghĩa kiểu dữ liệu Bạn bè
type Contact = {
    id: string;
    name: string;
    avatar: string;
};

export default function ContactsScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");

    // === STATE DỮ LIỆU THẬT TỪ BE ===
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [pendingCount, setPendingCount] = useState(0); // Số lời mời kết bạn
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("Danh bạ hiện tại trong App:", contacts);
    }, [contacts]);

    // Lấy chữ cái đầu làm Avatar dự phòng
    const getInitials = (text: string) => {
        if (!text || text === "undefined") return "U";
        const words = text.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    // Kiểm tra link ảnh hợp lệ
    const isValidImage = (url: string | undefined) => {
        return url && url !== "undefined" && url.trim() !== "";
    };

    // === TỰ ĐỘNG LOAD DỮ LIỆU KHI VÀO TRANG ===
    useFocusEffect(
        useCallback(() => {
            const fetchContacts = async () => {
                setContacts([]);
                setIsLoading(true);

                try {
                    const [friendsRes, pendingRes] = await Promise.all([
                        friendApi.getFriends(),
                        friendApi.getPendingRequests(),
                    ]);

                    const friendsList = friendsRes?.data || friendsRes || {};
                    const pendingList = pendingRes?.data || pendingRes || [];

                    console.log(
                        "=== DANH SÁCH BẠN BÈ TỪ SERVER ===",
                        JSON.stringify(friendsList, null, 2),
                    );

                    if (Array.isArray(pendingList)) {
                        setPendingCount(pendingList.length);
                    }

                    // SỬA Ở ĐÂY: Trích xuất mảng từ thuộc tính .friends
                    const friendsArray =
                        friendsList.friends ||
                        (Array.isArray(friendsList) ? friendsList : []);

                    if (Array.isArray(friendsArray)) {
                        const mappedFriends = friendsArray.map((item: any) => ({
                            id: item.friendId,
                            name: item.friendUserName || "Người dùng",
                            avatar: item.friendAvatar || "",
                        }));

                        // Sau khi có dữ liệu mới nhất từ Server (đã có người mới accept)
                        setContacts(mappedFriends);
                    }
                } catch (error) {
                    console.log("Lỗi tải danh bạ:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchContacts();
        }, []), // Giữ nguyên mảng rỗng để useCallback không bị tạo lại liên tục
    );

    // groupBy chữ cái đầu tiên của tên
    const groupContacts = (contactList: Contact[]) => {
        const grouped: Record<string, Contact[]> = {};

        contactList.forEach((contact) => {
            const firstLetter = contact.name[0].toUpperCase();

            if (!grouped[firstLetter]) {
                grouped[firstLetter] = [];
            }
            grouped[firstLetter].push(contact);
        });

        return Object.keys(grouped)
            .sort()
            .map((letter) => ({
                section: letter,
                data: grouped[letter],
                isStarred: false,
            }));
    };

    // filter contacts by search text
    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchText.toLowerCase().trim()),
    );

    // Bỏ section bạn thân (hoặc bạn có thể tự code API bạn thân sau), chỉ hiện danh sách gom nhóm
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
                                            {section.isStarred ? (
                                                <AntDesign
                                                    name="star"
                                                    size={14}
                                                    color="#E58A00"
                                                    className="mr-2"
                                                />
                                            ) : null}
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
                                            onPress={() =>
                                                router.push({
                                                    pathname:
                                                        "/message/chat/[id]",
                                                    params: {
                                                        id: user.id,
                                                        name: user.name,
                                                        avatar: user.avatar,
                                                        from: "contact",
                                                    },
                                                } as any)
                                            }
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
