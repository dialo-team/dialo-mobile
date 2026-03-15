import { useRouter } from "expo-router";
import {
    Bell,
    BookUser,
    ChartPie,
    ChevronRight,
    CircleQuestionMark,
    Clock3,
    CloudBackup,
    Info,
    LockKeyhole,
    MessageCircleMore,
    MessageSquareMore,
    MoveLeft,
    Palette,
    Phone,
    Search,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
    const router = useRouter();
    const menuItems = [
        {
            id: 1,
            title: "Quyền riêng tư",
            icon: <LockKeyhole size={24} color="blue" />,
        },
        {
            id: 2,
            title: "Dữ liệu trên máy",
            icon: <ChartPie size={24} color="blue" />,
        },
        {
            id: 3,
            title: "Sao lưu và khôi phục",
            icon: <CloudBackup size={24} color="blue" />,
        },
        {
            id: 4,
            title: "Thông báo",
            icon: <Bell size={24} color="blue" />,
        },
        {
            id: 5,
            title: "Tin nhắn",
            icon: <MessageCircleMore size={24} color="blue" />,
        },
        {
            id: 6,
            title: "Cuộc gọi",
            icon: <Phone size={24} color="blue" />,
        },
        {
            id: 7,
            title: "Nhật ký",
            icon: <Clock3 size={24} color="blue" />,
        },
        {
            id: 8,
            title: "Danh bạ",
            icon: <BookUser size={24} color="blue" />,
        },
        {
            id: 9,
            title: "Giao diện và ngôn ngữ",
            icon: <Palette size={24} color="blue" />,
        },
        {
            id: 10,
            title: "Thông tin về Zalo",
            icon: <Info size={24} color="blue" />,
        },
        {
            id: 11,
            title: "Liên hệ hỗ trợ",
            icon: <CircleQuestionMark size={24} color="blue" />,
            rightIcon: <MessageSquareMore size={20} color="#666" />,
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-blue-600">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.push("/profile" as any)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MoveLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-[18px] font-medium ml-4">
                        Cài đặt
                    </Text>
                </View>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Search size={24} color="white" />
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
                                <ChevronRight size={24} color="#C4C4C4" />
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
                    <ChevronRight size={24} color="#C4C4C4" />
                </TouchableOpacity>

                <View className="flex-1 pt-6 px-12 pb-10 min-h-[150px]">
                    <TouchableOpacity
                        className="bg-gray-200 py-[14px] rounded-full items-center"
                        onPress={() => router.replace("/")}
                    >
                        <Text className="text-black font-semibold text-[15px]">
                            Đăng xuất
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
