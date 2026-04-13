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
import { saveAuthData } from "@/src/api/auth/authStorage"; // Bổ sung hàm lưu Token
import { maskPhone } from "@/src/utils/phone";

export default function LoginWithPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- LOGIC RÀNG BUỘC MẬT KHẨU MỚI ---
    const isValidLength = password.length >= 6 && password.length <= 32;
    const hasLetterAndNumberOrSpecial = /(?=.*[a-zA-Z])(?=.*[\d\W_])/.test(
        password,
    );
    const isValid = isValidLength && hasLetterAndNumberOrSpecial;

    const maskedPhone = phone ? maskPhone(String(phone)) : "";

    const handleLogin = async () => {
        if (!phone) return;
        setIsSubmitting(true);
        try {
            console.log("Số điện thoại gửi lên API Login:", String(phone));

            // SỬA LẠI Ở ĐÂY: Gọi signinVerify (để trỏ đúng vào /auth/signin)
            // Ép kiểu 'any' phòng trường hợp file types.ts của bạn đang quy định nhầm param otp
            const response = await authenticationApi.signinVerify({
                phone: String(phone),
                password: password,
            } as any);

            console.log("Response từ server:", response);

            // KIỂM TRA VÀ LƯU TOKEN
            if (response.data && response.data.accessToken) {
                const { accessToken, refreshToken } = response.data;

                // Lưu token vào máy
                await saveAuthData(accessToken, refreshToken);

                Alert.alert("Thành công", "Đăng nhập thành công!");

                // VÀO THẲNG APP, BỎ QUA TRANG OTP
                router.replace("/(tabs)/message" as any);
            } else {
                Alert.alert(
                    "Lỗi",
                    "Đăng nhập thành công nhưng không nhận được Token.",
                );
            }
        } catch (error: any) {
            console.error(
                "Chi tiết lỗi API:",
                error.response?.data || error.message,
            );

            let errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Lỗi kết nối";

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

                    {/* --- GIAO DIỆN GỢI Ý ĐIỀU KIỆN MẬT KHẨU --- */}
                    <View className="mt-3 px-2 space-y-1">
                        <Text
                            className={`text-[13px] ${isValidLength ? "text-blue-600" : "text-gray-500"}`}
                        >
                            • Từ 6 đến 32 ký tự
                        </Text>
                        <Text
                            className={`text-[13px] ${hasLetterAndNumberOrSpecial ? "text-blue-600" : "text-gray-500"}`}
                        >
                            • Gồm chữ và ít nhất 1 số hoặc 1 ký tự đặc biệt
                        </Text>
                    </View>

                    <PrimaryButton
                        label="Tiếp tục"
                        loadingLabel="Đang đăng nhập..."
                        isLoading={isSubmitting}
                        disabled={!isValid}
                        onPress={handleLogin}
                        className="mt-6"
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
