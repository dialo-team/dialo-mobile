import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function StartPage() {
    const router = useRouter();
    return (
        <View className="flex-1 bg-white px-6">
            {/* Logo */}
            <View className="flex-1 items-center justify-center">
                <Text className="text-6xl font-bold text-blue-600">Dialo</Text>
            </View>

            {/* Buttons */}
            <View className="flex-1 items-center justify-start">
                <TouchableOpacity
                    className="w-[80%] bg-blue-600 py-4 rounded-full mb-4"
                    onPress={() => router.push("/login")}
                >
                    <Text className="text-white text-center text-base font-semibold">
                        Đăng nhập
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-[80%] bg-gray-200 py-4 rounded-full"
                    onPress={() => router.push("/register")}
                >
                    <Text className="text-center text-base font-semibold">
                        Tạo tài khoản mới
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
