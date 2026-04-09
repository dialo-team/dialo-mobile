import { useRouter } from "expo-router";
import {
    ChevronRight,
    KeyRound,
    Lock,
    MoveLeft,
    ScanQrCode,
    ShieldHalf,
    TriangleAlert,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSecurityScreen() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <TouchableOpacity
                    onPress={() => router.push("/profile" as any)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-[18px] font-medium ml-4">
                    Tài khoản và bảo mật
                </Text>
            </View>

            {/* Body */}
            <ScrollView
                className="flex-1 bg-slate-50"
                showsVerticalScrollIndicator={false}
            >
                {/* Section 1: Thông tin cá nhân */}
                <View className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden">
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: "https://i.pravatar.cc/150?img=11" }} // Link ảnh minh họa
                            className="w-[46px] h-[46px] rounded-full mr-3"
                        />
                        <View className="flex-1">
                            <Text className="text-[13px] text-gray-500 mb-[2px]">
                                Thông tin cá nhân
                            </Text>
                            <Text className="text-base font-normal text-black">
                                Phan Nhật Tiến
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Số điện thoại */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="flex-1">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Số điện thoại
                            </Text>
                            <Text className="text-[14px] text-gray-500">
                                (+84) 906 766 050
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Email */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="flex-1">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Email
                            </Text>
                            <Text className="text-[14px] text-gray-500">
                                Chưa liên kết
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Mã QR */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4"
                        activeOpacity={0.8}
                    >
                        <Text className="flex-1 text-base font-normal text-black">
                            Mã QR của tôi
                        </Text>
                        <ScanQrCode size={24} color="#888" />
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>

                {/* Tiêu đề mục: Bảo mật */}
                <View className="px-4 py-2 mt-1 bg-slate-50">
                    <Text className="text-[13px] font-medium text-[#0091FF]">
                        Bảo mật
                    </Text>
                </View>

                {/* Section 2: Bảo mật */}
                <View className="bg-white mx-3 rounded-2xl overflow-hidden">
                    {/* Kiểm tra bảo mật */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <ShieldHalf size={24} color="#666" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Kiểm tra bảo mật
                            </Text>
                            <Text className="text-[13px] text-[#E58A00]">
                                3 vấn đề bảo mật cần xử lý
                            </Text>
                        </View>
                        <TriangleAlert size={24} color="#E58A00" />
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Khóa Zalo */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4"
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <Lock size={24} color="#666" />
                        </View>
                        <Text className="flex-1 text-base font-normal text-black">
                            Khóa Zalo
                        </Text>
                        <Text className="text-[14px] text-gray-500 mr-1">
                            Đang tắt
                        </Text>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>

                {/* Tiêu đề mục: Đăng nhập */}
                <View className="px-4 py-2 mt-1 bg-slate-50">
                    <Text className="text-[13px] font-medium text-[#0091FF]">
                        Đăng nhập
                    </Text>
                </View>

                {/* Section 3: Đăng nhập */}
                <View className="bg-white mx-3 rounded-2xl overflow-hidden mb-6">
                    {/* Bảo mật 2 lớp */}
                    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Bảo mật 2 lớp
                            </Text>
                            <Text className="text-[13px] text-gray-500">
                                Thêm hình thức xác nhận để bảo vệ...
                            </Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#D1D5DB", true: "#0091FF" }}
                            thumbColor={"#FFFFFF"}
                            ios_backgroundColor="#D1D5DB"
                            onValueChange={() => setIs2FAEnabled(!is2FAEnabled)}
                            value={is2FAEnabled}
                        />
                    </View>

                    {/* Thiết bị đăng nhập */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Thiết bị đăng nhập
                            </Text>
                            <Text className="text-[13px] text-gray-500">
                                Quản lý các thiết bị bạn sử dụng...
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Mật khẩu */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4"
                        onPress={() =>
                            router.push(
                                "/profile/account-security/change-password" as any,
                            )
                        }
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <KeyRound size={24} color="#666" />
                        </View>
                        <Text className="flex-1 text-base font-normal text-black">
                            Mật khẩu
                        </Text>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
