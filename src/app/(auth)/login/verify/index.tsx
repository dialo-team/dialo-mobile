import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { saveAuthData } from "@/src/api/auth/authStorage";
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

export default function LoginVerifyScreen() {
    const router = useRouter();
    const { phone, password } = useLocalSearchParams<{
        phone?: string;
        password?: string;
    }>();

    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(50);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputs = useRef<TextInput[]>([]);

    const isOtpValid = otp.every((digit) => digit !== "");

    const phoneStr = String(phone ?? "");
    const maskedPhone = maskPhone(phoneStr);

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

    const handleChange = (text: string, index: number) => {
        if (!/^\d?$/.test(text)) return;

        const nextOtp = [...otp];
        nextOtp[index] = text;
        setOtp(nextOtp);

        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleBackspace = (index: number) => {
        if (otp[index] === "" && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerifySignin = async () => {
        if (!phone) return;
        setIsSubmitting(true);

        try {
            const otpString = otp.join("");
            const response = await authenticationApi.signinVerify({
                phone: normalizePhoneTo84(phone),
                otp: otpString,
            });

            const responseRoot = response?.data ?? response;
            if (
                typeof responseRoot?.status === "number" &&
                responseRoot.status >= 400
            ) {
                throw new Error(
                    responseRoot?.message ||
                        "Xác thực đăng nhập thất bại do lỗi máy chủ.",
                );
            }

            const { accessToken, refreshToken } = extractTokens(response);

            if (accessToken && refreshToken) {
                await saveAuthData(accessToken, refreshToken);
                console.log("Đăng nhập verify thành công:", response);
                Alert.alert("Thành công", "Đăng nhập thành công!");
                router.replace("/(tabs)/message" as any);
                return;
            }

            Alert.alert("Lỗi", "Xác thực đăng nhập chưa nhận được token.");
        } catch (error: any) {
            console.error(
                "Lỗi signin verify:",
                error.response?.data || error.message,
            );
            Alert.alert(
                "Lỗi xác thực",
                error.response?.data?.message ||
                    "Mã OTP không hợp lệ hoặc đã hết hạn.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || !password) return;
        if (countdown > 0) return;

        try {
            await authenticationApi.signin({
                phone: normalizePhoneTo84(String(phone)),
                password: String(password),
            });
            setCountdown(50);
            Alert.alert("Thành công", "Đã gửi lại mã OTP đăng nhập.");
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể gửi lại mã OTP.",
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
                            Xác thực đăng nhập
                        </Text>
                        <Text className="text-gray-500 mt-2 text-center">
                            Nhập dãy 6 số đang được gửi đến số điện thoại
                        </Text>
                        <Text className="font-semibold mt-1">
                            {maskedPhone}
                        </Text>
                    </View>

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
                        onPress={handleVerifySignin}
                        className="mt-10"
                    />

                    <View className="mt-6 items-center">
                        <Text className="text-gray-500">
                            Bạn không nhận được mã?{" "}
                            <Text
                                className={`${countdown === 0 ? "text-blue-600" : "text-gray-400"}`}
                                onPress={handleResendOtp}
                            >
                                Gửi lại ({countdown}s)
                            </Text>
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
