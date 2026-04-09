import { authenticationApi } from "@/src/api/auth/authenticationApi";
import BackHeader from "@/src/components/ui/BackHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { maskPhone, normalizePhoneTo84 } from "@/src/utils/phone";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OTPPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(50);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputs = useRef<TextInput[]>([]);

    // Check OTP valid
    const isOtpValid = otp.every((digit) => digit !== "");

    // Handle OTP input
    const handleChange = (text: string, index: number) => {
        if (!/^\d?$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Focus next input
        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    // Handle backspace
    const handleBackspace = (index: number) => {
        if (otp[index] === "" && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    // Mask phone number
    const phoneStr = String(phone ?? "");
    const maskedPhone = maskPhone(phoneStr, /(\d{3})\d{4,5}(\d{3})/);
    const formattedPhone = normalizePhoneTo84(phoneStr);

    useEffect(() => {
        if (!phone) return;

        const sendOtp = async () => {
            try {
                await authenticationApi.passwordResetRequest({
                    source: String(phone),
                    type: "SMS",
                });
            } catch (error: any) {
                Alert.alert(
                    "Lỗi",
                    error.response?.data?.message ||
                        "Không thể gửi mã OTP quên mật khẩu.",
                );
            }
        };

        sendOtp();
    }, [phone, formattedPhone]);

    useEffect(() => {
        if (countdown === 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const handleVerifyOtp = async () => {
        if (!phone) return;
        setIsSubmitting(true);

        try {
            const otpString = otp.join("");
            const response = await authenticationApi.passwordResetConfirm({
                source: String(phone),
                type: "SMS",
                otp: otpString,
            });

            const forgotRefreshToken =
                response?.data?.refreshToken ||
                response?.data?.token ||
                response?.data?.resetToken ||
                "";

            router.push({
                pathname: "/login/forgot-password/new-password" as any,
                params: {
                    phone: String(phone ?? ""),
                    refreshToken: forgotRefreshToken,
                },
            });
        } catch (error: any) {
            Alert.alert(
                "Lỗi xác thực",
                error.response?.data?.message ||
                    "Xác thực OTP thất bại. Vui lòng thử lại.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || countdown > 0) return;

        try {
            await authenticationApi.passwordResetRequest({
                source: String(phone),
                type: "SMS",
            });
            setCountdown(50);
            Alert.alert("Thành công", "Đã gửi lại mã OTP.");
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể gửi lại OTP.",
            );
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

                    <View className="mt-4 items-center gap-2">
                        <Text className="text-[22px] font-bold text-gray-900">
                            Nhập mã xác thực
                        </Text>
                        <Text className="text-gray-500 mt-2 text-center">
                            Nhập dãy 6 số đang được gửi đến số điện thoại
                        </Text>
                        <Text className="font-semibold mt-1">
                            {maskedPhone}
                        </Text>
                    </View>

                    {/* OTP Input */}
                    <View className="flex-row justify-between mt-10">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    if (ref) inputs.current[index] = ref;
                                }}
                                value={digit}
                                onChangeText={(text) =>
                                    handleChange(text, index)
                                }
                                onKeyPress={({ nativeEvent }) => {
                                    if (nativeEvent.key === "Backspace") {
                                        handleBackspace(index);
                                    }
                                }}
                                keyboardType="number-pad"
                                maxLength={1}
                                className="w-12 h-14 border-2 border-blue-500 rounded-xl text-center text-lg font-semibold"
                            />
                        ))}
                    </View>

                    <PrimaryButton
                        label="Tiếp tục"
                        loadingLabel="Đang xác thực..."
                        isLoading={isSubmitting}
                        disabled={!isOtpValid}
                        onPress={handleVerifyOtp}
                        className="mt-10"
                    />

                    {/* Resend OTP */}
                    <View className="mt-6 items-center">
                        <Text className="text-gray-500">
                            Bạn không nhận được mã?{" "}
                            <Text
                                className={`${
                                    countdown === 0
                                        ? "text-blue-600"
                                        : "text-gray-400"
                                }`}
                                onPress={handleResendOtp}
                            >
                                Gửi lại ({countdown}s)
                            </Text>
                        </Text>
                    </View>

                    {/* Illustration */}
                    <View className="flex-1 items-center justify-center">
                        <View className="w-32 h-32 bg-blue-100 rounded-3xl items-center justify-center">
                            <Text className="text-4xl">💬</Text>
                        </View>
                    </View>

                    {/* Support */}
                    <View className="items-center mb-6">
                        <Text className="text-blue-600">
                            Tôi cần hỗ trợ thêm về mã xác thực
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
