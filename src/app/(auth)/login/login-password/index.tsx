import { useLocalSearchParams, useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
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

export default function LoginWithPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const isValid = password.length >= 6;

    const maskedPhone = phone
        ? String(phone).replace(/(\d{3})\d{3}(\d{3})/, "$1***$2")
        : "";

    const handleLogin = async () => {
        if (!phone) return;
        try {
            // Chuyển params phone sang string để xử lý
            const phoneStr = String(phone); // Format lại số điện thoại: Thêm +84 và bỏ số 0 ở đầu
            let formattedPhone = phoneStr;
            if (phoneStr.startsWith("0")) {
                formattedPhone = "+84" + phoneStr.slice(1);
            } else if (!phoneStr.startsWith("+")) {
                // Đề phòng trường hợp params truyền sang đã có sẵn +84 thì không nối thêm nữa
                formattedPhone = "+84" + phoneStr;
            }

            console.log("Số điện thoại gửi lên API Login:", formattedPhone);

            const response = await authenticationApi.signin({
                phone: formattedPhone, // Gửi số đã format có +84
                password: password,
            });

            console.log("Response từ server:", response);
            Alert.alert("Thành công", "Đăng nhập thành công!");
            router.replace("/(tabs)/message" as any);
        } catch (error: any) {
            console.error("Lỗi API:", error.response?.data || error.message);
            Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Sai mật khẩu hoặc lỗi server",
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
                    {/* Header */}
                    <View className="h-14 justify-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <MoveLeft size={24} color="gray" />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <View className="mt-6 items-center">
                        <Text className="text-lg font-semibold text-center">
                            Nhập mật khẩu của tài khoản gắn với số điện thoại
                        </Text>
                        <Text className="font-semibold mt-2">
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

                    {/* Continue */}
                    <TouchableOpacity
                        disabled={!isValid}
                        onPress={handleLogin}
                        className={`mt-8 py-4 rounded-full ${
                            isValid ? "bg-blue-600" : "bg-gray-300"
                        }`}
                    >
                        <Text
                            className={`text-center font-semibold ${
                                isValid ? "text-white" : "text-gray-500"
                            }`}
                        >
                            Tiếp tục
                        </Text>
                    </TouchableOpacity>

                    {/* Forgot password */}
                    <View className="flex-1 justify-end items-center pb-10">
                        <TouchableOpacity
                            onPress={() =>
                                router.push("/login/forgot-password" as any)
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
