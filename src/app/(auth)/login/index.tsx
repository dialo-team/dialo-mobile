import BackHeader from "@/src/components/ui/BackHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { isValidVietnamPhone, keepPhoneDigitsOnly } from "@/src/utils/phone";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QrCode } from "lucide-react-native";

export default function LoginScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");

    const handlePhoneInput = (text: string) => {
        setPhoneNumber(keepPhoneDigitsOnly(text));
    };

    const isValidPhone = isValidVietnamPhone(phoneNumber);

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
            className="bg-white"
        >
            <View className="flex-1 px-6">
                <BackHeader onBack={() => router.back()} />

                <View className="mt-6 items-center gap-2">
                    <Text className="text-[22px] font-bold text-gray-900">
                        Đăng nhập bằng số điện thoại
                    </Text>
                    <Text className="text-sm text-gray-500 text-center">
                        Chúng tôi sẽ gửi mã OTP để xác thực đăng nhập.
                    </Text>
                </View>

                <View className="mt-10 border border-blue-500 rounded-xl flex-row items-center overflow-hidden">
                    <TouchableOpacity className="flex-row items-center px-4 bg-blue-50 h-14">
                        <Text className="text-base text-blue-900">+84</Text>
                    </TouchableOpacity>

                    <View className="w-px h-full bg-blue-200" />

                    <TextInput
                        placeholder="Số điện thoại"
                        keyboardType="phone-pad"
                        className="flex-1 px-4 h-14 text-base"
                        value={phoneNumber}
                        onChangeText={handlePhoneInput}
                        maxLength={10}
                    />
                </View>

                <PrimaryButton
                    label="Tiếp tục"
                    disabled={!isValidPhone}
                    onPress={() =>
                        router.push({
                            pathname: "/login/login-password" as any,
                            params: { phone: phoneNumber },
                        })
                    }
                    className="mt-8"
                />

                <View className="flex-row items-center mt-6 mb-4">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="text-gray-400 text-xs mx-3">hoặc</Text>
                    <View className="flex-1 h-px bg-gray-200" />
                </View>

                <TouchableOpacity
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 14,
                        paddingVertical: 14,
                        columnGap: 8,
                        backgroundColor: "#f9fafb",
                    }}
                    onPress={() => router.push("/(auth)/login/scan-qr" as any)}
                    activeOpacity={0.7}
                >
                    <QrCode size={20} color="#2563eb" />
                    <Text
                        style={{
                            color: "#2563eb",
                            fontWeight: "600",
                            fontSize: 15,
                        }}
                    >
                        Đăng nhập bằng mã QR
                    </Text>
                </TouchableOpacity>

                {/* Register link */}
                <View className="flex-1 justify-end items-center pb-10">
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
