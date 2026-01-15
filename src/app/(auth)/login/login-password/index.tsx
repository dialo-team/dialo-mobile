import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginWithPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const isValid = password.length >= 6;

    const maskedPhone = phone
        ? String(phone).replace(/(\d{3})\d{3}(\d{3})/, "$1***$2")
        : "";

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 bg-white"
        >
            <View className="flex-1 px-6">
                {/* Header */}
                <View className="h-14 justify-center">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <View className="mt-6 items-center">
                    <Text className="text-lg font-semibold text-center">
                        Nhập mật khẩu của tài khoản gắn với số điện thoại
                    </Text>
                    <Text className="font-semibold mt-2">{maskedPhone}</Text>
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
                    onPress={() => {
                        // Giả sử mật khẩu đúng
                        router.replace("/(user)/home" as any);
                    }}
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

                {/* Illustration */}
                <View className="flex-1 items-center justify-center">
                    <View className="w-32 h-32 bg-blue-100 rounded-3xl items-center justify-center">
                        <Text className="text-4xl">💬</Text>
                    </View>
                </View>

                {/* Forgot password */}
                <View className="items-center mb-6">
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
    );
}
