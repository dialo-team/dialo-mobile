import { friendApi } from "@/src/api/friend/friendApi"; // Thêm API
import { userApi } from "@/src/api/user/userApi";
import { useRouter } from "expo-router";
import { ChevronLeft, CircleArrowRight, QrCode } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEMO_FRIEND_QR_VALUE } from "../../../../../../constants/demoFriendQr";
export default function AddFriendScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

    // Fetch QR token khi màn hình mount
    // Fetch QR token khi màn hình mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Vẫn gọi song song để không làm chậm màn hình
                const [profileRes, qrRes] = await Promise.all([
                    userApi.getProfile(),
                    userApi.getMyQr(),
                ]);

                // 1. Lấy Tên (Name)
                const profileData = profileRes?.data || profileRes;
                if (profileData) {
                    setUserName(
                        profileData.userName ||
                            profileData.name ||
                            profileData.fullName,
                    );
                    console.log("Tên User lấy được:", profileData.userName); // Log kiểm tra
                }

                // 2. Lấy Token QR
                const qrData = qrRes?.data || qrRes;

                // Trường hợp 1: Dữ liệu giống y chang hình bạn gửi (qr nằm ngay trong object tổng)
                let token = qrData?.qr?.token;

                // Trường hợp 2: Dự phòng nếu BE trả về khác một chút
                if (!token && profileData?.qr?.token) {
                    token = profileData.qr.token;
                }

                if (token) {
                    setQrToken(token);
                    console.log("Token QR lấy được:", token); // Log kiểm tra
                } else {
                    console.log(
                        "Không tìm thấy thuộc tính token trong QR Response:",
                        qrData,
                    );
                }
            } catch (error) {
                console.log("Lỗi fetch data:", error);
            }
        };
        fetchData();
    }, []);

    const handlePhoneInput = (text: string) => {
        const numbersOnly = text.replace(/[^0-9]/g, "");
        if (numbersOnly.startsWith("0")) {
            setPhoneNumber(numbersOnly.slice(0, 10));
        } else if (numbersOnly.length > 0) {
            setPhoneNumber(numbersOnly.slice(0, 9));
        } else {
            setPhoneNumber("");
        }
    };

    const isValidPhone =
        (phoneNumber.startsWith("0") && phoneNumber.length === 10) ||
        (!phoneNumber.startsWith("0") && phoneNumber.length === 9);

    // --- HÀM TÌM KIẾM ---
    const handleSearch = async () => {
        Keyboard.dismiss();
        setIsLoading(true);

        try {
            const response = await friendApi.searchByPhone(phoneNumber);

            // Bóc tách data tùy theo cấu trúc BE trả về
            const userData = (response as any).data || response;

            // Chuyển hướng sang trang NewFriend kèm theo dữ liệu
            router.push({
                pathname: "/contact/friend/new" as any,
                params: {
                    id: userData.id,
                },
            });
        } catch (error: any) {
            console.log("Lỗi tìm kiếm:", error.response?.data || error.message);
            Alert.alert(
                "Không tìm thấy",
                "Số điện thoại này chưa đăng ký tài khoản hoặc không cho phép tìm kiếm.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white">
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)/contact")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ChevronLeft size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-[18px] font-medium ml-2 text-black">
                    Thêm bạn
                </Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Vùng chứa Thẻ Mã QR (Giữ nguyên của bạn) */}
                <View className="items-center mt-6 mb-8">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                            router.push(
                                "/(tabs)/contact/friend/add/my-qr" as any,
                            )
                        }
                    >
                        <View className="bg-[#415C84] w-[260px] rounded-2xl p-5 items-center shadow-sm">
                            <Text className="text-white text-[16px] font-medium mb-4">
                                {userName ?? "..."}
                            </Text>

                            <View className="bg-white p-2 rounded-xl mb-4">
                                <QRCode
                                    value={qrToken ?? DEMO_FRIEND_QR_VALUE}
                                    size={140}
                                    backgroundColor="#FFFFFF"
                                    color="#000000"
                                />
                            </View>

                            <Text className="text-white/80 text-[12px]">
                                Chạm để xem lớn · Quét mã để thêm bạn Dialo
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Phần Nhập số điện thoại */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center border border-gray-300 rounded-lg bg-white h-[48px]">
                        <TouchableOpacity className="flex-row items-center px-3 border-r border-gray-300 h-full">
                            <Text className="text-[16px] text-black mr-1">
                                +84
                            </Text>
                        </TouchableOpacity>

                        <TextInput
                            className="flex-1 px-3 text-[16px] text-black"
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={handlePhoneInput}
                        />

                        {/* Nút gửi */}
                        <TouchableOpacity
                            className="px-2 w-12 items-center justify-center"
                            activeOpacity={0.8}
                            disabled={!isValidPhone || isLoading}
                            onPress={handleSearch} // Gọi hàm API
                        >
                            {isLoading ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#0068FF"
                                />
                            ) : (
                                <View
                                    className={`w-9 h-9 rounded-full items-center justify-center ${
                                        isValidPhone
                                            ? "bg-blue-600"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    <CircleArrowRight
                                        size={24}
                                        color={isValidPhone ? "white" : "gray"}
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="h-[1px] bg-gray-100" />

                {/* Các tùy chọn khác (Giữ nguyên) */}
                <View className="bg-white">
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4 border-b border-gray-100"
                        onPress={() =>
                            router.push("/message/qr-scanner" as any)
                        }
                    >
                        <View className="w-10">
                            <QrCode size={24} color="blue" />
                        </View>
                        <Text className="text-[16px] font-normal text-black">
                            Quét mã QR
                        </Text>
                    </TouchableOpacity>

                    <View className="mt-8 px-8 items-center">
                        <Text className="text-[13px] text-gray-500 text-center">
                            Xem lời mời kết bạn đã gửi tại trang Danh bạ Dialo
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
