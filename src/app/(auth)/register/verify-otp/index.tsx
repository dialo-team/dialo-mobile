import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
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
    const maskedPhone = phone
        ? String(phone).replace(/(\d{3})\d{4,5}(\d{3})/, "$1***$2")
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
                <View className="mt-4 items-center">
                    <Text className="text-lg font-semibold">
                        Nhập mã xác thực
                    </Text>
                    <Text className="text-gray-500 mt-2 text-center">
                        Nhập dãy 6 số đang được gửi đến số điện thoại
                    </Text>
                    <Text className="font-semibold mt-1">{maskedPhone}</Text>
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
                            onChangeText={(text) => handleChange(text, index)}
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

                {/* Continue Button */}
                <TouchableOpacity
                    disabled={!isOtpValid}
                    onPress={() => {
                        // Giả sử OTP đúng
                        router.push("/register/enter-name" as any);
                    }}
                    className={`mt-10 py-4 rounded-full ${
                        isOtpValid ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                    <Text
                        className={`text-center font-semibold ${
                            isOtpValid ? "text-white" : "text-gray-500"
                        }`}
                    >
                        Tiếp tục
                    </Text>
                </TouchableOpacity>

                {/* Resend OTP */}
                <View className="mt-6 items-center">
                    <Text className="text-gray-500">
                        Bạn không nhận được mã?{" "}
                        <Text className="text-blue-600">Gửi lại (50s)</Text>
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
    );
}
