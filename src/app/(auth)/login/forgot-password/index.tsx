import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, X } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();
    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-slate-50">
            <View className="px-4 py-2 mt-2">
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Text className="text-[24px] font-bold text-center text-gray-900 mt-6">
                Chọn phương thức xác thực
            </Text>
            <Text className="text-center text-gray-500 mt-2 mb-8 px-6">
                Chúng tôi sẽ giúp bạn lấy lại quyền truy cập tài khoản an toàn.
            </Text>

            <TouchableOpacity
                onPress={() =>
                    router.push({
                        pathname: "/login/forgot-password/otp-password" as any,
                        params: {
                            phone: String(phone ?? ""),
                        },
                    })
                }
                activeOpacity={0.7}
                className="flex-row items-center mx-4 px-4 py-4 border border-gray-100 rounded-2xl bg-white"
            >
                <View className="w-10">
                    <Feather name="phone-call" size={22} color="#0068FF" />
                </View>

                <View className="flex-1 pr-2">
                    <Text className="text-base font-normal text-gray-900 mb-1">
                        Nhận mã qua số điện thoại
                    </Text>
                    <Text className="text-[13px] text-gray-500 leading-5">
                        Chúng tôi gửi mã OTP để xác thực đổi mật khẩu
                    </Text>
                </View>

                <ChevronRight size={24} color="gray" />
            </TouchableOpacity>

            <TouchableOpacity
                disabled={true} // Vô hiệu hóa vì chưa liên kết
                className="flex-row items-center mx-4 mt-3 px-4 py-4 border border-gray-100 rounded-2xl bg-white opacity-45"
            >
                <View className="w-10">
                    <Feather name="mail" size={22} color="#555555" />
                </View>

                <View className="flex-1 pr-2">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-base font-normal text-gray-900 mr-2">
                            Sử dụng email liên kết
                        </Text>
                        {/* Badge "Khuyên dùng" */}
                        <View className="bg-[#0091FF] px-2 py-[2px] rounded-full">
                            <Text className="text-[10px] text-white font-medium">
                                Khuyên dùng
                            </Text>
                        </View>
                    </View>
                    <Text className="text-[13px] text-gray-500 leading-5">
                        Bạn cần thiết lập liên kết email trong mục Tài khoản và
                        bảo mật
                    </Text>
                </View>

                <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
