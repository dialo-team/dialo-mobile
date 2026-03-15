import { useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");

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

    const isValidPhone =
        (phoneNumber.startsWith("0") && phoneNumber.length === 10) ||
        (!phoneNumber.startsWith("0") && phoneNumber.length === 9);

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
            className="bg-white"
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
                    <Text className="text-lg font-semibold">
                        Nhập số điện thoại
                    </Text>
                </View>

                {/* Phone input */}
                <View className="mt-10 flex-row items-center border-b border-blue-500 pb-2">
                    <TouchableOpacity className="flex-row items-center pr-3">
                        <Text className="text-base">+84 |</Text>
                    </TouchableOpacity>

                    <TextInput
                        placeholder="Số điện thoại"
                        keyboardType="phone-pad"
                        className="flex-1 text-base px-2"
                        value={phoneNumber}
                        onChangeText={handlePhoneInput}
                        maxLength={10}
                    />
                </View>

                {/* Continue button */}
                <TouchableOpacity
                    disabled={!isValidPhone}
                    onPress={() =>
                        router.push({
                            pathname: "/login/login-password" as any,
                            params: { phone: phoneNumber },
                        })
                    }
                    className={`mt-8 py-4 rounded-full ${
                        isValidPhone ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                    <Text
                        className={`text-center font-semibold ${
                            isValidPhone ? "text-white" : "text-gray-500"
                        }`}
                    >
                        Tiếp tục
                    </Text>
                </TouchableOpacity>

                {/* Register link */}
                <View className=" flex-1 justify-end items-center pb-10">
                    <Text className="text-gray-500">
                        Bạn chưa có tài khoản?{" "}
                        <Text
                            className="text-blue-600 font-semibold"
                            onPress={() => router.push("/(auth)/register")}
                        >
                            Tạo tài khoản
                        </Text>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
