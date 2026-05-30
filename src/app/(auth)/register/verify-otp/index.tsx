import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { saveAuthData, savePhone } from "@/src/api/auth/authStorage";
import BackHeader from "@/src/components/ui/BackHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { maskPhone } from "@/src/utils/phone";
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

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { phone, password } = useLocalSearchParams<{
        phone?: string;
        password?: string;
    }>();

    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputs = useRef<TextInput[]>([]);

    // Check OTP valid
    const isOtpValid = otp.every((digit) => digit !== "");
    const [countdown, setCountdown] = useState(50);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const extractTokens = (response: any) => {
        const root = response?.data ?? response;
        const payload = root?.data ?? root?.result ?? root;
        const accessToken = payload?.accessToken ?? payload?.access_token;
        const refreshToken = payload?.refreshToken ?? payload?.refresh_token;

        return {
            accessToken: typeof accessToken === "string" ? accessToken : "",
            refreshToken: typeof refreshToken === "string" ? refreshToken : "",
        };
    };

    useEffect(() => {
        if (countdown === 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

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
    const maskedPhone = phone ? maskPhone(String(phone)) : "";

    const handleVerify = async () => {
        setIsSubmitting(true);
        try {
            const otpString = otp.join("");

            // Log để kiểm tra dữ liệu trước khi bay lên server
            console.log("Dữ liệu gửi lên Verify:", {
                phone: String(phone),
                otp: otpString,
            });

            const response = await authenticationApi.signupVerify({
                phone: String(phone),
                password: String(password ?? ""),
                otp: otpString,
            });

            console.log("Phản hồi Verify OTP:", response);

            // BE của bạn trả về 201 cho thành công, check cả 200 cho chắc
            if (response.status === 201 || response.status === 200) {
                // --- BƯỚC ĐĂNG NHẬP NGẦM ---
                try {
                    const loginResponse = await authenticationApi.signinVerify({
                        phone: String(phone),
                        password: String(password),
                    });

                    const { accessToken, refreshToken } =
                        extractTokens(loginResponse);

                    if (accessToken && refreshToken) {
                        await saveAuthData(accessToken, refreshToken);
                        await savePhone(String(phone));
                        console.log("Đăng nhập ngầm OK!");

                        Alert.alert(
                            "Thành công",
                            "Xác thực tài khoản thành công",
                            [
                                {
                                    text: "Tiếp tục",
                                    onPress: () =>
                                        router.push(
                                            "/register/enter-name" as any,
                                        ),
                                },
                            ],
                        );
                        return;
                    }

                    Alert.alert("Lỗi", "Đăng nhập ngầm chưa nhận được token.");
                } catch (loginError: any) {
                    console.log(
                        "Lỗi đăng nhập ngầm:",
                        loginError.response?.data || loginError.message,
                    );
                    // Nếu verify xong mà login ngầm lỗi, đẩy sang màn Login chính
                    router.replace("/(auth)/login" as any);
                }
            } else {
                Alert.alert(
                    "Thông báo",
                    response.message || "Mã OTP không hợp lệ.",
                );
            }
        } catch (error: any) {
            // Đây là nơi bắt lỗi 401 từ Interceptor trả về
            console.log("Chi tiết lỗi API Verify:", error.response?.data);

            const serverMessage = error.response?.data?.message;
            const errorMessage =
                serverMessage || "Mã OTP không chính xác hoặc đã hết hạn.";

            Alert.alert("Lỗi xác thực", errorMessage);
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

                    {/* Title */}
                    <View className="mt-4 items-center">
                        <Text className="text-lg font-semibold">
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
                        onPress={handleVerify}
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
                                onPress={async () => {
                                    if (countdown === 0) {
                                        try {
                                            await authenticationApi.signup({
                                                phone: String(phone ?? ""), // Sửa lại thành số gốc
                                                password: String(
                                                    password ?? "",
                                                ),
                                            });
                                            setCountdown(50);
                                        } catch (error) {
                                            Alert.alert(
                                                "Lỗi",
                                                "Không thể gửi lại mã OTP",
                                            );
                                        }
                                    }
                                }}
                            >
                                Gửi lại ({countdown}s)
                            </Text>
                        </Text>
                    </View>

                    {/* Support */}
                    <View className=" flex-1 justify-end items-center pb-10 ">
                        <Text className="text-blue-600">
                            Tôi cần hỗ trợ thêm về mã xác thực
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
