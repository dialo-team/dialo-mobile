import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function EnterNamePage() {
    const router = useRouter();
    const [name, setName] = useState("");

    // Validate:
    // - 2 → 40 ký tự
    // - không chứa số
    const isValidLength = name.length >= 2 && name.length <= 40;
    const hasNumber = /\d/.test(name);
    const isValidName = isValidLength && !hasNumber;

    const handleChangeName = (text: string) => {
        setName(text.trimStart());
    };

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
                <View className="mt-10 items-center">
                    <Text className="text-lg font-semibold">Nhập tên Zalo</Text>
                    <Text className="text-gray-500 mt-2 text-center">
                        Hãy dùng tên thật để mọi người nhận ra bạn
                    </Text>
                </View>

                {/* Input */}
                <View className="mt-10">
                    <View className="border-2 border-blue-500 rounded-xl">
                        <TextInput
                            placeholder="Nhập tên của bạn"
                            className="px-4 py-4 text-base"
                            value={name}
                            onChangeText={handleChangeName}
                            maxLength={40}
                        />
                    </View>

                    {/* Rules */}
                    <View className="mt-4 space-y-1">
                        <Text
                            className={`text-sm ${
                                name.length === 0 || isValidLength
                                    ? "text-gray-500"
                                    : "text-red-500"
                            }`}
                        >
                            • Dài từ 2 đến 40 ký tự
                        </Text>

                        <Text
                            className={`text-sm ${
                                !hasNumber ? "text-gray-500" : "text-red-500"
                            }`}
                        >
                            • Không chứa số
                        </Text>

                        <Text className="text-sm text-gray-500">
                            • Cần tuân thủ{" "}
                            <Text className="text-blue-600 font-semibold">
                                quy định đặt tên Zalo
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* Continue button */}
                <TouchableOpacity
                    disabled={!isValidName}
                    onPress={() => {
                        router.push({
                            pathname: "/register/add-infor",
                            params: { name },
                        } as any);
                    }}
                    className={`mt-8 py-4 rounded-full ${
                        isValidName ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                    <Text
                        className={`text-center font-semibold ${
                            isValidName ? "text-white" : "text-gray-500"
                        }`}
                    >
                        Tiếp tục
                    </Text>
                </TouchableOpacity>

                {/* Illustration */}
                <View className="flex-1 items-center justify-center">
                    <View className="w-32 h-32 bg-blue-100 rounded-3xl items-center justify-center">
                        <Text className="text-4xl">✨</Text>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
