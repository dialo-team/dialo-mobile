import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginPage() {
    const [phoneNumber, setPhoneNumber] = useState("");

    const isValidPhone = phoneNumber.length >= 10 && phoneNumber.length <= 11;

    const handlePhoneInput = (text: string) => {
        const numbersOnly = text.replace(/[^0-9]/g, "");
        setPhoneNumber(numbersOnly);
    };

    return (
        <View className="flex-1 bg-white px-6">
            {/* Header */}
            <View className="h-14 justify-center">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mt-6 items-center">
                <Text className="text-lg font-semibold">
                    Nhập số điện thoại
                </Text>
            </View>

            {/* Phone input */}
            <View className="mt-10 flex-row items-center border-b border-blue-500 pb-2">
                <TouchableOpacity className="flex-row items-center pr-3">
                    <Text className="text-base">+84</Text>
                    <Text className="ml-1 text-gray-400">▼</Text>
                </TouchableOpacity>

                <TextInput
                    placeholder="Số điện thoại"
                    keyboardType="phone-pad"
                    className="flex-1 text-base px-2"
                    value={phoneNumber}
                    onChangeText={handlePhoneInput}
                    maxLength={11}
                />
            </View>

            {/* Continue button */}
            <TouchableOpacity
                disabled={!isValidPhone}
                className={`mt-8 py-4 rounded-full ${
                    isValidPhone ? "bg-blue-600" : "bg-gray-300"
                }`}
            >
                <Text
                    className={`text-center font-semibold ${
                        isValidPhone ? "text-white" : "text-gray-500"
                    }`}
                >
                    Tiếp tục
                </Text>
            </TouchableOpacity>

            {/* Illustration */}
            <View className="flex-1 items-center justify-center">
                <View className="w-28 h-28 bg-blue-100 rounded-3xl items-center justify-center">
                    <Text className="text-3xl">💬</Text>
                </View>
            </View>

            {/* Register link */}
            <View className="items-center mb-6">
                <Text className="text-gray-500">
                    Bạn chưa có tài khoản?{" "}
                    <Text
                        className="text-blue-600 font-semibold"
                        onPress={() => router.push("/(auth)/register")}
                    >
                        Tạo tài khoản
                    </Text>
                </Text>
            </View>
        </View>
    );
}
