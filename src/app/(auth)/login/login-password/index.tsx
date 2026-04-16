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
import { saveAuthData } from "@/src/api/auth/authStorage";
import { keepPhoneDigitsOnly, maskPhone } from "@/src/utils/phone";

export default function LoginWithPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- LOGIC RÀNG BUỘC MẬT KHẨU ---
    const isValidLength = password.length >= 6 && password.length <= 32;
    const hasLetterAndNumberOrSpecial = /(?=.*[a-zA-Z])(?=.*[\d\W_])/.test(
        password,
    );
    const isValid = isValidLength && hasLetterAndNumberOrSpecial;

    const maskedPhone = phone ? maskPhone(String(phone)) : "";

    /**
     * ✅ Chuẩn hoá phone giống Signup
     * - +84xxxxxxxx  -> 0xxxxxxxx
     * - 84xxxxxxxx   -> 0xxxxxxxx
     * - xxxxxxxxx    -> 0xxxxxxxx
     */
    const normalizePhoneLikeSignup = (input: string) => {
        const digits = keepPhoneDigitsOnly(input);

        if (digits.startsWith("84")) {
            return "0" + digits.slice(2);
        }

        if (!digits.startsWith("0")) {
            return "0" + digits;
        }

        return digits;
    };

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

    const handleLogin = async () => {
        if (!phone) return;
        setIsSubmitting(true);

        try {
            const rawPhone = String(phone);
            const normalizedPhone = normalizePhoneLikeSignup(rawPhone);

            console.log("Phone gửi lên API Login:", normalizedPhone);
            console.log("Password gửi lên API Login:", password);

            const response = await authenticationApi.signinVerify({
                phone: normalizedPhone,
                password: password,
            });

            console.log("✅ Response server:", response);

            const responseRoot = response?.data ?? response;
            if (
                typeof responseRoot?.status === "number" &&
                responseRoot.status >= 400
            ) {
                throw new Error(
                    responseRoot?.message ||
                        "Đăng nhập thất bại do lỗi máy chủ.",
                );
            }

            const { accessToken, refreshToken } = extractTokens(response);

            // ✅ Backend trả token trực tiếp
            if (accessToken && refreshToken) {
                await saveAuthData(accessToken, refreshToken);
                Alert.alert("Thành công", "Đăng nhập thành công!");
                router.replace("/(tabs)/message" as any);
                return;
            }

            // ✅ Backend yêu cầu OTP
            router.push({
                pathname: "/login/verify" as any,
                params: {
                    phone: normalizedPhone,
                    password,
                },
            });
        } catch (error: any) {
            console.error(
                "❌ Lỗi login:",
                error.response?.data || error.message,
            );

            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Lỗi kết nối";

            Alert.alert(
                "Lỗi đăng nhập",
                `${errorMessage}\n\n(Status: ${
                    error.response?.status ?? "unknown"
                })`,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
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

                    {/* Password hints */}
                    <View className="mt-3 px-2 space-y-1">
                        <Text
                            className={`text-[13px] ${
                                isValidLength
                                    ? "text-blue-600"
                                    : "text-gray-500"
                            }`}
                        >
                            • Từ 6 đến 32 ký tự
                        </Text>
                        <Text
                            className={`text-[13px] ${
                                hasLetterAndNumberOrSpecial
                                    ? "text-blue-600"
                                    : "text-gray-500"
                            }`}
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
                            onPress={() =>
                                router.push({
                                    pathname: "/login/forgot-password" as any,
                                    params: {
                                        phone: String(phone ?? ""),
                                    },
                                })
                            }
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
