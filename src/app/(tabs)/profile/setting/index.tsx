import { authenticationApi } from "@/src/api/auth/authenticationApi";
import {
    clearAuthData,
    getAccessToken,
    getRefreshToken,
} from "@/src/api/auth/authStorage";
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
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

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

    // --- HÀM XỬ LÝ GỌI API ĐĂNG XUẤT ---
    const executeSignOut = async (type: "single" | "all") => {
        setIsSigningOut(true);
        try {
            const accessToken = await getAccessToken();
            const refreshToken = await getRefreshToken();

            if (accessToken && refreshToken) {
                if (type === "single") {
                    // Đăng xuất máy hiện tại (Truyền sessId rỗng nếu chưa lưu)
                    await authenticationApi.signout(
                        { refreshToken: String(refreshToken), sessId: "" },
                        String(accessToken),
                    );
                } else if (type === "all") {
                    // Đăng xuất TẤT CẢ thiết bị
                    await authenticationApi.signoutAll(
                        { refreshToken: String(refreshToken) },
                        String(accessToken),
                    );
                }
            }
        } catch (error) {
            console.log("Lỗi từ server khi đăng xuất:", error);
        } finally {
            // Luôn xóa data ở local và đá ra ngoài dù API có lỗi hay không
            await clearAuthData();
            setIsSigningOut(false);
            router.replace("/(auth)/login" as any);
        }
    };

    // --- HÀM HIỂN THỊ MENU CHỌN ĐĂNG XUẤT ---
    const handleSignOut = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn muốn đăng xuất khỏi thiết bị này hay tất cả thiết bị?",
            [
                {
                    text: "Hủy",
                    style: "cancel",
                },
                {
                    text: "Đăng xuất máy này",
                    style: "default",
                    onPress: () => executeSignOut("single"),
                },
                {
                    text: "Đăng xuất TẤT CẢ",
                    style: "destructive",
                    onPress: () => executeSignOut("all"),
                },
            ],
            { cancelable: true },
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-5 bg-blue-600">
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
                className="flex-1 bg-slate-50"
                showsVerticalScrollIndicator={false}
            >
                {/* Danh sách các cài đặt */}
                <View className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden">
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            className="flex-row items-center px-4 py-4 border-b border-gray-100"
                            activeOpacity={0.8}
                        >
                            <View className="w-9 items-start justify-center">
                                {item.icon}
                            </View>
                            <Text className="flex-1 text-[16px] font-normal text-black">
                                {item.title}
                            </Text>
                            {/* Nếu mục có rightIcon riêng thì hiển thị, không thì hiện mũi tên */}
                            {item.rightIcon ? (
                                item.rightIcon
                            ) : (
                                <ChevronRight size={24} color="#C4C4C4" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Khoảng trống xám */}
                <View className="h-3 bg-slate-50" />

                {/* Chuyển tài khoản */}
                <TouchableOpacity
                    className="flex-row items-center px-4 py-4 bg-white mx-3 rounded-2xl"
                    activeOpacity={0.8}
                >
                    <View className="w-9" />
                    <Text className="flex-1 text-[16px] font-normal text-black">
                        Chuyển tài khoản
                    </Text>
                    <ChevronRight size={24} color="#C4C4C4" />
                </TouchableOpacity>

                {/* Đăng xuất */}
                <View className="flex-1 pt-6 px-12 pb-10 min-h-[150px]">
                    <TouchableOpacity
                        className="bg-gray-200 py-[14px] rounded-full items-center"
                        onPress={handleSignOut}
                        disabled={isSigningOut}
                        activeOpacity={0.85}
                    >
                        <Text className="text-black font-semibold text-[15px]">
                            {isSigningOut ? "Đang xử lý..." : "Đăng xuất"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
