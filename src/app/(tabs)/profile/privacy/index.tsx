import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
    const router = useRouter();
    // Khai báo cấu trúc dữ liệu cho các phần để code gọn gàng, dễ bảo trì
    const sections = [
        {
            title: "Cá nhân",
            items: [
                {
                    id: "1",
                    title: "Sinh nhật",
                    icon: <Feather name="calendar" size={20} color="#555" />,
                    hasChevron: true,
                },
                {
                    id: "2",
                    title: "Hiện trạng thái truy cập",
                    icon: (
                        <MaterialCommunityIcons
                            name="account-outline"
                            size={22}
                            color="#555"
                        />
                    ),
                    rightText: "Đang bật",
                },
            ],
        },
        {
            title: "Tin nhắn và cuộc gọi",
            items: [
                {
                    id: "3",
                    title: "Hiện trạng thái “Đã xem”",
                    icon: (
                        <MaterialCommunityIcons
                            name="chat-check-outline"
                            size={20}
                            color="#555"
                        />
                    ),
                    rightText: "Đang bật",
                },
                {
                    id: "4",
                    title: "Cho phép nhắn tin",
                    icon: (
                        <MaterialCommunityIcons
                            name="message-text-outline"
                            size={20}
                            color="#555"
                        />
                    ),
                    rightText: "Mọi người",
                },
                {
                    id: "5",
                    title: "Cho phép gọi điện",
                    icon: <Feather name="phone" size={20} color="#555" />,
                    rightText: "Bạn bè và người lạ\ntừng liên hệ",
                },
            ],
        },
        {
            title: "Nhật ký",
            items: [
                {
                    id: "6",
                    title: "Cho phép xem và bình luận",
                    icon: <Feather name="edit" size={20} color="#555" />,
                    hasChevron: true,
                },
                {
                    id: "7",
                    title: "Chặn và ẩn",
                    icon: <Feather name="slash" size={20} color="#555" />,
                    hasChevron: true,
                },
            ],
        },
        {
            title: "Nguồn tìm kiếm và kết bạn",
            items: [
                {
                    id: "8",
                    title: "Quản lý nguồn tìm kiếm và kết bạn",
                    icon: <Feather name="user-plus" size={20} color="#555" />,
                    hasChevron: true,
                },
            ],
        },
        {
            title: "Quyền của tiện ích",
            items: [
                {
                    id: "9",
                    title: "Tiện ích",
                    icon: <Feather name="layout" size={20} color="#555" />,
                    hasChevron: true,
                },
            ],
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-blue-600">
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => router.push("/(tabs)/profile" as any)}
                >
                    <Ionicons name="chevron-back" size={20} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-[18px] font-medium ml-2">
                    Quyền riêng tư
                </Text>
            </View>

            {/* Body */}
            <ScrollView
                className="flex-1 bg-white"
                showsVerticalScrollIndicator={false}
            >
                {sections.map((section, index) => (
                    <View key={index} className="mb-2">
                        {/* Tiêu đề của từng khu vực */}
                        <View className="px-4 pt-5 pb-2">
                            <Text className="text-[#0068FF] text-[14px] font-semibold">
                                {section.title}
                            </Text>
                        </View>

                        {/* Danh sách các mục trong khu vực */}
                        <View className="bg-white">
                            {section.items.map((item, itemIndex) => {
                                // Xác định xem có phải item cuối cùng không để bỏ đường gạch dưới
                                const isLastItem =
                                    itemIndex === section.items.length - 1;

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        className="flex-row items-center px-4 py-[14px]"
                                    >
                                        {/* Icon bên trái */}
                                        <View className="w-8 justify-center">
                                            {item.icon}
                                        </View>

                                        {/* Nội dung bên phải (bao gồm border-b để gạch dưới phần chữ, không gạch dưới phần icon) */}
                                        <View
                                            className={`flex-1 flex-row items-center justify-between pb-3 pt-1 ${!isLastItem ? "border-b border-gray-100" : ""}`}
                                        >
                                            <Text className="text-[16px] font-normal text-black flex-1 pr-2">
                                                {item.title}
                                            </Text>

                                            {/* Hiển thị Text hoặc Mũi tên bên phải */}
                                            {item.rightText ? (
                                                <Text className="text-[14px] text-gray-500 text-right leading-5">
                                                    {item.rightText}
                                                </Text>
                                            ) : null}

                                            {item.hasChevron ? (
                                                <MaterialIcons
                                                    name="chevron-right"
                                                    size={24}
                                                    color="#C4C4C4"
                                                />
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
