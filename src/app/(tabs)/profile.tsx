import { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItem = {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    bgColor: string;
    showArrow?: boolean;
};

export default function ProfileScreen() {
    const [searchText, setSearchText] = useState("");

    const menuItems: MenuItem[] = [
        {
            id: "1",
            icon: "☁️",
            title: "zCloud",
            subtitle: "Không gian lưu trữ dữ liệu trên đám mây",
            bgColor: "bg-blue-500",
            showArrow: true,
        },
        {
            id: "2",
            icon: "🎨",
            title: "zStyle - Nơi bắt trên Zalo",
            subtitle: "Hình nền và nhạc cho cuộc gọi Zalo",
            bgColor: "bg-blue-600",
            showArrow: true,
        },
        {
            id: "3",
            icon: "📁",
            title: "My Documents",
            subtitle: "Lưu trữ các tài nhạn quan trọng",
            bgColor: "bg-blue-500",
            showArrow: true,
        },
        {
            id: "4",
            icon: "☁️",
            title: "Dữ liệu trên mây",
            subtitle: "Quản lý dữ liệu Zalo của bạn",
            bgColor: "bg-blue-400",
        },
        {
            id: "5",
            icon: "📱",
            title: "Ví QR",
            subtitle: "Lưu trữ và xuất trình các mã QR quan trọng",
            bgColor: "bg-blue-500",
            showArrow: true,
        },
        {
            id: "6",
            icon: "🛡️",
            title: "Tài khoản và bảo mật",
            subtitle: "",
            bgColor: "bg-blue-600",
            showArrow: true,
        },
        {
            id: "7",
            icon: "🔒",
            title: "Quyền riêng tư",
            subtitle: "",
            bgColor: "bg-blue-500",
            showArrow: true,
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-gray-800 px-4 pt-3 pb-3">
                    <Text className="text-white text-sm mb-3">UserMenu</Text>

                    {/* Search Bar */}
                    <View className="flex-row items-center bg-blue-600 rounded-lg px-4 py-3">
                        <Text className="text-white text-lg mr-3">🔍</Text>
                        <TextInput
                            placeholder="Tìm kiếm"
                            placeholderTextColor="#93C5FD"
                            className="flex-1 text-white text-base"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <TouchableOpacity className="ml-3">
                            <Text className="text-white text-xl">⚙️</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1">
                    {/* User Profile Card */}
                    <View className="bg-white mx-4 mt-4 rounded-lg p-4 flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
                            <Text className="text-white font-bold text-lg">
                                TI
                            </Text>
                        </View>
                        <View className="flex-1 ml-3">
                            <Text className="text-gray-900 font-semibold text-base">
                                Phan Nhất Tiến
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                Xem trang cá nhân
                            </Text>
                        </View>
                        <TouchableOpacity>
                            <Text className="text-gray-400 text-xl">👥</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <View className="mt-4">
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
                            >
                                {/* Icon */}
                                <View
                                    className={`w-10 h-10 rounded-lg items-center justify-center ${item.bgColor}`}
                                >
                                    <Text className="text-white text-xl">
                                        {item.icon}
                                    </Text>
                                </View>

                                {/* Content */}
                                <View className="flex-1 ml-3">
                                    <Text className="text-gray-900 font-medium text-base">
                                        {item.title}
                                    </Text>
                                    {item.subtitle && (
                                        <Text className="text-gray-500 text-xs mt-1">
                                            {item.subtitle}
                                        </Text>
                                    )}
                                </View>

                                {/* Arrow */}
                                {item.showArrow && (
                                    <Text className="text-gray-400 text-lg">
                                        ›
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
