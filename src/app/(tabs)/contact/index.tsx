import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Cake, Phone, Search, Users, Video } from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactsScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");

    // Dữ liệu phẳng
    const contacts = [
        {
            id: "1",
            name: "Angel Nguyễn",
            avatar: "https://i.pravatar.cc/150?img=5",
        },

        {
            id: "2",
            name: "a zai guột thừa",
            avatar: "https://i.pravatar.cc/150?img=11",
        },
        { id: "3", name: "A. Tí", avatar: "https://i.pravatar.cc/150?img=12" },
        { id: "4", name: "An", avatar: "https://i.pravatar.cc/150?img=13" },
        {
            id: "5",
            name: "Angel Nguyễn",
            avatar: "https://i.pravatar.cc/150?img=5",
        },

        {
            id: "6",
            name: "Bảo đại ca",
            avatar: "https://i.pravatar.cc/150?img=21",
        },
        { id: "7", name: "Bình", avatar: "https://i.pravatar.cc/150?img=22" },
        {
            id: "8",
            name: "Bích Ngọc",
            avatar: "https://i.pravatar.cc/150?img=23",
        },

        { id: "9", name: "Dũng", avatar: "https://i.pravatar.cc/150?img=24" },
        { id: "10", name: "Diệu", avatar: "https://i.pravatar.cc/150?img=25" },
        {
            id: "11",
            name: "Đạt da đen",
            avatar: "https://i.pravatar.cc/150?img=26",
        },

        { id: "12", name: "Tuấn", avatar: "https://i.pravatar.cc/150?img=27" },
        { id: "13", name: "Trang", avatar: "https://i.pravatar.cc/150?img=28" },
        {
            id: "14",
            name: "Thảo nấm lùn",
            avatar: "https://i.pravatar.cc/150?img=29",
        },
    ];

    // groupBy chữ cái đầu tiên của tên
    const groupContacts = (contacts: any[]) => {
        const grouped: Record<string, any[]> = {};

        contacts.forEach((contact) => {
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

    // section "Bạn thân"
    const starredSection = {
        section: "Bạn thân",
        isStarred: true,
        data: [
            {
                id: "1",
                name: "Angel Nguyễn",
                avatar: "https://i.pravatar.cc/150?img=5",
            },
        ],
    };

    // filter contacts by search text
    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchText.toLowerCase().trim()),
    );

    const contactsData = [starredSection, ...groupContacts(filteredContacts)];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header: Thanh tìm kiếm */}
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <Search size={24} color="white" />
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
                    <Feather name="user-plus" size={24} color="white" />
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
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Lời mời kết bạn & Sinh nhật */}
                    <View className="py-2">
                        <TouchableOpacity
                            className="flex-row items-center px-4 py-3"
                            onPress={() =>
                                router.push("/contact/friend/requests" as any)
                            }
                        >
                            <View className="w-10 h-10 rounded-full bg-[#0091FF] items-center justify-center">
                                <Users size={24} color={"white"} />
                            </View>
                            <Text className="text-base font-normal text-black ml-3">
                                Lời mời kết bạn
                            </Text>
                            <Text className="text-gray-400 ml-1 text-base">
                                (4)
                            </Text>
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
                                184
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-white border border-gray-300 px-4 py-1.5 rounded-full flex-row items-center">
                            <Text className="text-gray-600 font-medium text-[13px]">
                                Mới truy cập{" "}
                            </Text>
                            <Text className="text-gray-600 font-semibold text-[13px]">
                                2
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Danh sách người dùng */}
                    {contactsData.map((section, index) => (
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
                                {section.isStarred && (
                                    <TouchableOpacity>
                                        <Text className="text-[#0091FF] text-[13px] font-medium">
                                            + Thêm
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Section Items */}
                            {section.data.map((user) => (
                                <TouchableOpacity
                                    key={user.id}
                                    className="flex-row items-center px-4 py-2 bg-white"
                                    onPress={() =>
                                        router.push({
                                            pathname: "/message/chat/[id]",
                                            params: {
                                                id: user.id,
                                                name: user.name,
                                                avatar: user.avatar,
                                            },
                                        } as any)
                                    }
                                >
                                    <Image
                                        source={{ uri: user.avatar }}
                                        className="w-[46px] h-[46px] rounded-full"
                                    />
                                    <Text className="flex-1 text-[16px] font-normal text-black ml-3">
                                        {user.name}
                                    </Text>
                                    <View className="flex-row items-center space-x-4">
                                        <TouchableOpacity className="p-2">
                                            <Phone size={22} color="#666" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="p-2">
                                            <Video size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    {/* Padding ảo để không bị che bởi Bottom Tab */}
                    <View className="h-20" />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
