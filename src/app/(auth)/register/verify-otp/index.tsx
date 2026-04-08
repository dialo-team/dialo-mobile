import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();

    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputs = useRef<TextInput[]>([]);

    // Check OTP valid
    const isOtpValid = otp.every((digit) => digit !== "");
    const [countdown, setCountdown] = useState(50);

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
    const maskedPhone = phone
        ? String(phone).replace(/(\d{3})\d{4,5}(\d{3})/, "$1***$2")
        : "";

    const handleVerify = async () => {
        try {
            const otpString = otp.join("");
            const response = await authenticationApi.signupVerify({
                phone: String(phone),
                otp: otpString,
            });

            console.log("Phản hồi từ BE:", response);

            // Kiểm tra logic thực tế từ nội dung Backend trả về
            if (response.data?.result === true) {
                console.log("Xác thực thực sự thành công!");
                router.push("/register/enter-name" as any);
            } else {
                // Trường hợp result: false (như bạn vừa gặp)
                Alert.alert(
                    "Thông báo",
                    response.message || "Mã OTP không chính xác",
                );
            }
        } catch (error) {
            // Chỉ nhảy vào đây nếu lỗi mạng hoặc server sập (500, 404...)
            Alert.alert("Lỗi", "Không thể kết nối đến máy chủ");
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

                    {/* Continue Button */}
                    <TouchableOpacity
                        disabled={!isOtpValid}
                        onPress={handleVerify}
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
                                                phone: String(phone),
                                                password: "your_password",
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
