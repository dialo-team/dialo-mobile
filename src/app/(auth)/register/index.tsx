import { authenticationApi } from "@/src/api/auth/authenticationApi";
import BackHeader from "@/src/components/ui/BackHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import {
    isValidVietnamPhone,
    keepPhoneDigitsOnly,
    normalizePhoneTo84,
} from "@/src/utils/phone";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [termsChecked, setTermsChecked] = useState(false);
    const [policyChecked, setPolicyChecked] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isValidPhone = isValidVietnamPhone(phoneNumber);

    const handlePhoneInput = (text: string) => {
        setPhoneNumber(keepPhoneDigitsOnly(text));
    };

    const isValidPassword = password.length >= 6;

    const isFormValid =
        isValidPhone && isValidPassword && termsChecked && policyChecked;

    const handleSignup = async () => {
        setIsSubmitting(true);
        try {
            const formattedPhone = normalizePhoneTo84(phoneNumber);

            console.log("Số điện thoại gửi lên API:", String(phoneNumber));

            const response = await authenticationApi.signup({
                phone: String(phoneNumber),
                password: password,
            });

            console.log("Đăng kí thành công");
            console.log(JSON.stringify(response, null, 2));

            router.push({
                pathname: "/register/verify-otp" as any,
                params: { phone: phoneNumber, password },
            });
        } catch (error: any) {
            console.log("Lỗi đăng kí", error);
            Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể gửi mã OTP",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
            className="bg-white"
        >
            <View className="flex-1 bg-white px-6">
                <BackHeader onBack={() => router.back()} />

                <View className="mt-4 items-center gap-2">
                    <Text className="text-[22px] font-bold text-gray-900">
                        Nhập số điện thoại
                    </Text>
                    <Text className="text-sm text-gray-500 text-center">
                        Tạo tài khoản mới và xác thực bằng OTP.
                    </Text>
                </View>

                {/* Phone Input Box */}
                <View className="mt-8 border border-blue-500 rounded-xl flex-row items-center overflow-hidden">
                    {/* Country code */}
                    <TouchableOpacity className="flex-row items-center px-4 bg-blue-50">
                        <Text className="text-base">+84</Text>
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
                        maxLength={10}
                    />
                </View>

                <View className="mt-4 border border-blue-500 rounded-xl px-4">
                    <TextInput
                        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                        secureTextEntry={!showPassword}
                        className="py-4 text-base"
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    className="mt-2"
                >
                    <Text className="text-blue-600 text-sm">
                        {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    </Text>
                </TouchableOpacity>

                {/* Terms */}
                <View className="mt-6 space-y-3">
                    <TouchableOpacity
                        onPress={() => setTermsChecked(!termsChecked)}
                        className="flex-row items-start pb-4"
                    >
                        <View
                            className={`w-7 h-7 border-2 rounded-full mr-3 items-center justify-center mt-3 ${
                                termsChecked
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-gray-300"
                            }`}
                        >
                            {termsChecked && <Check size={16} color="white" />}
                        </View>
                        <Text className="text-gray-600 flex-1">
                            Tôi đồng ý với các{" "}
                            <Text className="text-blue-600">
                                điều khoản sử dụng Dialo
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setPolicyChecked(!policyChecked)}
                        className="flex-row items-start"
                    >
                        <View
                            className={`w-7 h-7 border-2 rounded-full mr-3 items-center justify-center mt-3 ${
                                policyChecked
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-gray-300"
                            }`}
                        >
                            {policyChecked && <Check size={16} color="white" />}
                        </View>
                        <Text className="text-gray-600 flex-1">
                            Tôi đồng ý với{" "}
                            <Text className="text-blue-600">
                                điều khoản Mạng xã hội của Dialo
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <PrimaryButton
                    label="Tiếp tục"
                    loadingLabel="Đang gửi OTP..."
                    isLoading={isSubmitting}
                    disabled={!isFormValid}
                    onPress={handleSignup}
                    className="mt-8"
                />

                {/* Login link */}
                <View className="flex-1 justify-end items-center pb-10">
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
        </SafeAreaView>
    );
}
