import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Cake, Phone, Search, Users, Video } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactsScreen() {
    const router = useRouter();
    // Dữ liệu mẫu cho danh bạ
    const contactsData = [
        {
            section: "Bạn thân",
            isStarred: true,
            data: [
                {
                    id: "1",
                    name: "Angel Nguyễn",
                    avatar: "https://i.pravatar.cc/150?img=5",
                },
            ],
        },
        {
            section: "A",
            data: [
                {
                    id: "2",
                    name: "a zai guột thừa",
                    avatar: "https://i.pravatar.cc/150?img=11",
                },
                {
                    id: "3",
                    name: "A. Tí",
                    avatar: "https://i.pravatar.cc/150?img=12",
                },
                {
                    id: "4",
                    name: "An",
                    avatar: "https://i.pravatar.cc/150?img=13",
                },
                {
                    id: "5",
                    name: "Angel Nguyễn",
                    avatar: "https://i.pravatar.cc/150?img=5",
                },
            ],
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header: Thanh tìm kiếm */}
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <Search size={24} color="white" />
                <Text className="flex-1 text-white text-[16px] ml-3 opacity-80">
                    Tìm kiếm
                </Text>
                <TouchableOpacity
                    onPress={() => router.push("/contact/add-friend" as any)}
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
                        <TouchableOpacity className="flex-row items-center px-4 py-3">
                            <View className="w-10 h-10 rounded-full bg-[#0091FF] items-center justify-center">
                                <Users size={24} color={"white"} />
                            </View>
                            <Text className="text-base font-normal text-black ml-3">
                                Lời mời kết bạn
                            </Text>
                            <Text className="text-gray-400 ml-1 text-base">
                                (5)
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
