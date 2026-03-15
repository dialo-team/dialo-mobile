import { useRouter } from "expo-router";
import { ChevronLeft, CircleArrowRight, QrCode } from "lucide-react-native";
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

export default function AddFriendScreen() {
    const router = useRouter();

    const [phoneNumber, setPhoneNumber] = useState("");

    const handlePhoneInput = (text: string) => {
        const numbersOnly = text.replace(/[^0-9]/g, "");

        // Nếu bắt đầu từ 0: tối đa 10 ký tự
        if (numbersOnly.startsWith("0")) {
            setPhoneNumber(numbersOnly.slice(0, 10));
        }
        // Nếu bắt đầu từ số khác 0: tối đa 9 ký tự
        else if (numbersOnly.length > 0) {
            setPhoneNumber(numbersOnly.slice(0, 9));
        }
        // Nếu rỗng
        else {
            setPhoneNumber("");
        }
    };

    const isValidPhone =
        (phoneNumber.startsWith("0") && phoneNumber.length === 10) ||
        (!phoneNumber.startsWith("0") && phoneNumber.length === 9);
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
                {/* Vùng chứa Thẻ Mã QR */}
                <View className="items-center mt-6 mb-8">
                    {/* Thẻ QR nền xanh xám */}
                    <View className="bg-[#415C84] w-[260px] rounded-2xl p-5 items-center shadow-sm">
                        <Text className="text-white text-[16px] font-medium mb-4">
                            Phan Nhật Tiến
                        </Text>

                        {/* Khung trắng bọc mã QR */}
                        <View className="bg-white p-2 rounded-xl mb-4">
                            {/* Dùng ảnh placeholder cho mã QR */}
                            <Image
                                source={{
                                    uri: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
                                }}
                                className="w-[140px] h-[140px]"
                            />
                        </View>

                        <Text className="text-white/80 text-[12px]">
                            Quét mã để thêm bạn Dialo với tôi
                        </Text>
                    </View>
                </View>

                {/* Phần Nhập số điện thoại */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center border border-gray-300 rounded-lg bg-white h-[48px]">
                        {/* Chọn mã vùng */}
                        <TouchableOpacity className="flex-row items-center px-3 border-r border-gray-300 h-full">
                            <Text className="text-[16px] text-black mr-1">
                                +84
                            </Text>
                        </TouchableOpacity>

                        {/* Ô nhập số */}
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
                            className="px-2"
                            activeOpacity={0.8}
                            disabled={!isValidPhone}
                            onPress={() => {
                                // Xử lý gửi lời mời kết bạn
                                console.log("Gửi lời mời tới:", phoneNumber);
                                router.push("/contact/friend/new" as any);
                            }}
                        >
                            <View
                                className={`w-9 h-9 rounded-full items-center justify-center ${
                                    isValidPhone ? "bg-blue-600" : "bg-gray-200"
                                }`}
                            >
                                <CircleArrowRight
                                    size={24}
                                    color={isValidPhone ? "white" : "gray"}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Khoảng xám phân cách */}
                <View className="h-[1px] bg-gray-100" />

                {/* Các tùy chọn khác */}
                <View className="bg-white">
                    {/* Quét mã QR */}
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

                    {/* Footer Text */}
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
