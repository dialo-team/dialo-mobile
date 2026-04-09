import BackHeader from "@/src/components/ui/BackHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { maskPhone, normalizePhoneTo84 } from "@/src/utils/phone";

export default function LoginWithPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = password.length >= 6;

    const maskedPhone = phone ? maskPhone(String(phone)) : "";

    const handleLogin = async () => {
        if (!phone) return;
        setIsSubmitting(true);
        try {
            const formattedPhone = normalizePhoneTo84(String(phone));

            console.log("Số điện thoại gửi lên API Login:", formattedPhone);

            const response = await authenticationApi.signin({
                phone: formattedPhone, // Gửi số đã format có +84
                password: password,
            });

            console.log("Response từ server:", response);
            Alert.alert(
                "Xác thực",
                "Đã gửi mã OTP đăng nhập, vui lòng kiểm tra tin nhắn.",
            );
            router.push({
                pathname: "/login/verify" as any,
                params: {
                    phone: String(phone),
                    password,
                },
            });
        } catch (error: any) {
            console.error("Chi tiết lỗi API:", {
                message: error.message,
                status: error.response?.status,
                statusCode: error.code,
                data: error.response?.data,
                errorLog: error,
            });

            let errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Lỗi kết nối";

            // Xử lý 500 error - có thể account chưa verify OTP
            if (error.response?.status === 500) {
                errorMessage =
                    "Tài khoản chưa được xác thực.\nVui lòng hoàn thành đăng ký trước khi đăng nhập.";
            }

            Alert.alert(
                "Lỗi đăng nhập",
                `${errorMessage}\n\n(Status: ${error.response?.status || "unknown"})`,
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
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1 bg-white"
            >
                <View className="flex-1 px-6">
                    <BackHeader onBack={() => router.back()} />

                    <View className="mt-6 items-center gap-2">
                        <Text className="text-[22px] font-bold text-center text-gray-900">
                            Nhập mật khẩu của tài khoản gắn với số điện thoại
                        </Text>
                        <Text className="font-semibold text-blue-700">
                            {maskedPhone}
                        </Text>
                    </View>

                    {/* Password input */}
                    <View className="mt-10 border-2 border-blue-500 rounded-xl flex-row items-center px-4">
                        <TextInput
                            placeholder="Nhập mật khẩu"
                            secureTextEntry={!showPassword}
                            className="flex-1 py-4 text-base"
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text className="text-blue-600 font-semibold">
                                {showPassword ? "ẨN" : "HIỆN"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <PrimaryButton
                        label="Tiếp tục"
                        loadingLabel="Đang gửi OTP..."
                        isLoading={isSubmitting}
                        disabled={!isValid}
                        onPress={handleLogin}
                        className="mt-8"
                    />

                    {/* Forgot password */}
                    <View className="flex-1 justify-end items-center pb-10">
                        <TouchableOpacity
                            onPress={() => {
                                router.push({
                                    pathname: "/login/forgot-password" as any,
                                    params: {
                                        phone: String(phone ?? ""),
                                    },
                                });
                            }}
                        >
                            <Text className="text-blue-600 font-semibold">
                                Quên mật khẩu?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
