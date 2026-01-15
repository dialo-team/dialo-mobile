import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegisterPage() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [termsChecked, setTermsChecked] = useState(false);
    const [policyChecked, setPolicyChecked] = useState(false);

    const isValidPhone = phoneNumber.length >= 10 && phoneNumber.length <= 11;
    const isFormValid = isValidPhone && termsChecked && policyChecked;

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
            <View className="mt-4 items-center">
                <Text className="text-lg font-semibold">
                    Nhập số điện thoại
                </Text>
            </View>

            {/* Phone Input Box */}
            <View className="mt-8 border border-blue-500 rounded-xl flex-row items-center overflow-hidden">
                {/* Country code */}
                <TouchableOpacity className="flex-row items-center px-4 bg-blue-50">
                    <Text className="text-base">+84</Text>
                    <Text className="ml-1 text-gray-400">▼</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View className="w-px h-full bg-blue-200" />

                {/* Input */}
                <TextInput
                    placeholder="Số điện thoại"
                    keyboardType="phone-pad"
                    className="flex-1 px-4 py-4 text-base"
                    value={phoneNumber}
                    onChangeText={handlePhoneInput}
                    maxLength={11}
                />
            </View>

            {/* Terms */}
            <View className="mt-6 space-y-3">
                <TouchableOpacity
                    onPress={() => setTermsChecked(!termsChecked)}
                    className="flex-row items-start"
                >
                    <View
                        className={`w-5 h-5 border-2 rounded-full mr-3 items-center justify-center ${
                            termsChecked
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-300"
                        }`}
                    >
                        {termsChecked && (
                            <Text className="text-white text-xs font-bold">
                                ✓
                            </Text>
                        )}
                    </View>
                    <Text className="text-gray-600 flex-1">
                        Tôi đồng ý với các{" "}
                        <Text className="text-blue-600">
                            điều khoản sử dụng Zalo
                        </Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setPolicyChecked(!policyChecked)}
                    className="flex-row items-start"
                >
                    <View
                        className={`w-5 h-5 border-2 rounded-full mr-3 items-center justify-center ${
                            policyChecked
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-300"
                        }`}
                    >
                        {policyChecked && (
                            <Text className="text-white text-xs font-bold">
                                ✓
                            </Text>
                        )}
                    </View>
                    <Text className="text-gray-600 flex-1">
                        Tôi đồng ý với{" "}
                        <Text className="text-blue-600">
                            điều khoản Mạng xã hội của Zalo
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Continue button */}
            <TouchableOpacity
                disabled={!isFormValid}
                className={`mt-8 py-4 rounded-full ${
                    isFormValid ? "bg-blue-600" : "bg-gray-300"
                }`}
            >
                <Text
                    className={`text-center font-semibold ${
                        isFormValid ? "text-white" : "text-gray-500"
                    }`}
                >
                    Tiếp tục
                </Text>
            </TouchableOpacity>

            {/* Illustration */}
            <View className="flex-1 items-center justify-center">
                <View className="w-32 h-32 bg-blue-100 rounded-3xl items-center justify-center">
                    <Text className="text-4xl">💬</Text>
                </View>
            </View>

            {/* Login link */}
            <View className="items-center mb-6">
                <Text className="text-gray-500">
                    Bạn đã có tài khoản?{" "}
                    <Text
                        className="text-blue-600 font-semibold"
                        onPress={() => router.push("/(auth)/login")}
                    >
                        Đăng nhập ngay
                    </Text>
                </Text>
            </View>
        </View>
    );
}
