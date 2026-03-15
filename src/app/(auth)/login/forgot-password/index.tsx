import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ChevronRight, X } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordPage() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-white">
            {/* Nút Close (X) */}
            <View className="px-4 py-2 mt-2">
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Text className="text-[22px] font-semibold text-center text-gray-900 mt-6 mb-8">
                Chọn phương thức xác thực
            </Text>

            {/* Option 1: Nhận mã qua tổng đài */}
            <TouchableOpacity
                onPress={() =>
                    router.push("/login/forgot-password/otp-password" as any)
                }
                activeOpacity={0.7}
                className="flex-row items-center px-4 py-4 border-b border-gray-100"
            >
                {/* Icon bên trái */}
                <View className="w-10">
                    <Feather name="phone-call" size={22} color="#0068FF" />
                </View>

                {/* Nội dung giữa */}
                <View className="flex-1 pr-2">
                    <Text className="text-base font-normal text-gray-900 mb-1">
                        Nhận mã qua liên hệ đến tổng đài Zalo
                    </Text>
                    <Text className="text-[13px] text-gray-500 leading-5">
                        Liên hệ tổng đài tự động để nhận mã xác thực
                    </Text>
                </View>

                <ChevronRight size={24} color="gray" />
            </TouchableOpacity>

            {/* Option 2: Sử dụng email liên kết (Trạng thái mờ/Disabled) */}
            <TouchableOpacity
                disabled={true} // Vô hiệu hóa vì chưa liên kết
                className="flex-row items-center px-4 py-4 border-b border-gray-100 opacity-40"
            >
                {/* Icon bên trái */}
                <View className="w-10">
                    <Feather name="mail" size={22} color="#555555" />
                </View>

                {/* Nội dung giữa */}
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

                {/* Icon mũi tên bên phải */}
                <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
