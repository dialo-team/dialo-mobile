import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
    const router = useRouter();
    // Tạo mảng dữ liệu cho các menu item để code không bị lặp lại quá dài
    const menuItems = [
        {
            id: 1,
            title: "Quyền riêng tư",
            icon: <FontAwesome5 name="lock" size={18} color="#0091FF" />,
        },
        {
            id: 2,
            title: "Dữ liệu trên máy",
            icon: <FontAwesome5 name="chart-pie" size={18} color="#0091FF" />,
        },
        {
            id: 3,
            title: "Sao lưu và khôi phục",
            icon: (
                <MaterialCommunityIcons
                    name="cloud-refresh"
                    size={22}
                    color="#0091FF"
                />
            ),
        },
        {
            id: 4,
            title: "Thông báo",
            icon: (
                <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#0091FF"
                />
            ),
        },
        {
            id: 5,
            title: "Tin nhắn",
            icon: (
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#0091FF"
                />
            ),
        },
        {
            id: 6,
            title: "Cuộc gọi",
            icon: <Ionicons name="call" size={20} color="#0091FF" />,
        },
        {
            id: 7,
            title: "Nhật ký",
            icon: <Ionicons name="time-outline" size={22} color="#0091FF" />,
        },
        {
            id: 8,
            title: "Danh bạ",
            icon: (
                <FontAwesome5 name="address-book" size={18} color="#0091FF" />
            ),
        },
        {
            id: 9,
            title: "Giao diện và ngôn ngữ",
            icon: (
                <Ionicons
                    name="color-palette-outline"
                    size={22}
                    color="#0091FF"
                />
            ),
        },
        {
            id: 10,
            title: "Thông tin về Zalo",
            icon: (
                <Ionicons name="information-circle" size={22} color="#0091FF" />
            ),
        },
        {
            id: 11,
            title: "Liên hệ hỗ trợ",
            icon: (
                <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#0091FF"
                />
            ),
            rightIcon: (
                <MaterialCommunityIcons
                    name="message-processing-outline"
                    size={20}
                    color="#666"
                />
            ),
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-[#0091FF]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-[#0091FF]">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.push("/profile" as any)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-[18px] font-medium ml-4">
                        Cài đặt
                    </Text>
                </View>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
                className="flex-1 bg-white"
                showsVerticalScrollIndicator={false}
            >
                {/* Danh sách các cài đặt */}
                <View className="bg-white">
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            className="flex-row items-center px-4 py-4 border-b border-gray-100"
                        >
                            <View className="w-9 items-start justify-center">
                                {item.icon}
                            </View>
                            <Text className="flex-1 text-[16px] font-normal text-black">
                                {item.title}
                            </Text>
                            {/* Nếu mục có rightIcon riêng (như Liên hệ hỗ trợ) thì hiển thị, không thì hiện mũi tên */}
                            {item.rightIcon ? (
                                item.rightIcon
                            ) : (
                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#C4C4C4"
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Khoảng trống xám */}
                <View className="h-2 bg-gray-100" />

                {/* Chuyển tài khoản */}
                <TouchableOpacity className="flex-row items-center px-4 py-4 bg-white">
                    {/* View trống để căn lề text bằng với các mục bên trên */}
                    <View className="w-9" />
                    <Text className="flex-1 text-[16px] font-normal text-black">
                        Chuyển tài khoản
                    </Text>
                    <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#C4C4C4"
                    />
                </TouchableOpacity>

                {/* Khu vực Đăng xuất có background xám */}
                <View className="flex-1 bg-gray-100 pt-6 px-12 pb-10 min-h-[150px]">
                    <TouchableOpacity className="bg-gray-200 py-[14px] rounded-full items-center">
                        <Text className="text-black font-semibold text-[15px]">
                            Đăng xuất
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
