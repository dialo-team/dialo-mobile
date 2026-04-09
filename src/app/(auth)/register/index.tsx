import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { useRouter } from "expo-router";
import { Check, MoveLeft } from "lucide-react-native";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [termsChecked, setTermsChecked] = useState(false);
    const [policyChecked, setPolicyChecked] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const isValidPhone =
        (phoneNumber.startsWith("0") && phoneNumber.length === 10) ||
        (!phoneNumber.startsWith("0") && phoneNumber.length === 9);

    const handlePhoneInput = (text: string) => {
        const numbersOnly = text.replace(/[^0-9]/g, "");

        // Nếu bắt đầu từ 0: tối đa 10 ký tự
        if (numbersOnly.startsWith("0")) {
            setPhoneNumber(numbersOnly.slice(0, 10));
        }
        // Nếu bắt đầu từ số khác 0: tối đa 9 ký tự
        else if (numbersOnly.length > 0) {
            setPhoneNumber(numbersOnly.slice(0, 9));
        }
        // Nếu rỗng
        else {
            setPhoneNumber("");
        }
    };

    const isValidPassword = password.length >= 6;

    const isFormValid =
        isValidPhone && isValidPassword && termsChecked && policyChecked;

    const handleSignup = async () => {
        try {
            let formattedPhone = phoneNumber;
            if (phoneNumber.startsWith("0")) {
                formattedPhone = "+84" + phoneNumber.slice(1);
            } else {
                formattedPhone = "+84" + phoneNumber;
            }

            console.log("Số điện thoại gửi lên API:", formattedPhone);

            const response = await authenticationApi.signup({
                phone: formattedPhone,
                password,
            });

            console.log("Đăng kí thành công");
            console.log(JSON.stringify(response, null, 2));

            router.push({
                pathname: "/register/verify-otp" as any,
                params: { phone: phoneNumber },
            });
        } catch (error) {
            console.log("Lỗi đăng kí", error);
            Alert.alert("Lỗi", "Không thể gửi mã OTP");
        }
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
            className="bg-white"
        >
            <View className="flex-1 bg-white px-6">
                {/* Header */}
                <View className="h-14 justify-center">
                    <TouchableOpacity onPress={() => router.back()}>
                        <MoveLeft size={24} color="gray" />
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <View className="mt-4 items-center">
                    <Text className="text-lg font-semibold">
                        Nhập số điện thoại
                    </Text>
                </View>

                {/* Phone Input Box */}
                <View className="mt-8 border border-blue-500 rounded-xl flex-row items-center overflow-hidden">
                    {/* Country code */}
                    <TouchableOpacity className="flex-row items-center px-4 bg-blue-50">
                        <Text className="text-base">+84</Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="w-px h-full bg-blue-200" />

                    {/* Input */}
                    <TextInput
                        placeholder="Số điện thoại"
                        keyboardType="phone-pad"
                        className="flex-1 px-4 py-4 text-base"
                        value={phoneNumber}
                        onChangeText={handlePhoneInput}
                        maxLength={10}
                    />
                </View>

                <View className="mt-4 border border-blue-500 rounded-xl px-4">
                    <TextInput
                        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                        secureTextEntry={!showPassword}
                        className="py-4 text-base"
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    className="mt-2"
                >
                    <Text className="text-blue-600 text-sm">
                        {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    </Text>
                </TouchableOpacity>

                {/* Terms */}
                <View className="mt-6 space-y-3">
                    <TouchableOpacity
                        onPress={() => setTermsChecked(!termsChecked)}
                        className="flex-row items-start pb-4"
                    >
                        <View
                            className={`w-7 h-7 border-2 rounded-full mr-3 items-center justify-center mt-3 ${
                                termsChecked
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-gray-300"
                            }`}
                        >
                            {termsChecked && <Check size={16} color="white" />}
                        </View>
                        <Text className="text-gray-600 flex-1">
                            Tôi đồng ý với các{" "}
                            <Text className="text-blue-600">
                                điều khoản sử dụng Dialo
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setPolicyChecked(!policyChecked)}
                        className="flex-row items-start"
                    >
                        <View
                            className={`w-7 h-7 border-2 rounded-full mr-3 items-center justify-center mt-3 ${
                                policyChecked
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-gray-300"
                            }`}
                        >
                            {policyChecked && <Check size={16} color="white" />}
                        </View>
                        <Text className="text-gray-600 flex-1">
                            Tôi đồng ý với{" "}
                            <Text className="text-blue-600">
                                điều khoản Mạng xã hội của Dialo
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Continue button */}
                <TouchableOpacity
                    disabled={!isFormValid}
                    onPress={handleSignup}
                    className={`mt-8 py-4 rounded-full ${
                        isFormValid ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                    <Text
                        className={`text-center font-semibold ${
                            isFormValid ? "text-white" : "text-gray-500"
                        }`}
                    >
                        Tiếp tục
                    </Text>
                </TouchableOpacity>

                {/* Login link */}
                <View className="flex-1 justify-end items-center pb-10">
                    <Text className="text-gray-500">
                        Bạn đã có tài khoản?{" "}
                        <Text
                            className="text-blue-600 font-semibold"
                            onPress={() => router.push("/(auth)/login")}
                        >
                            Đăng nhập ngay
                        </Text>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
