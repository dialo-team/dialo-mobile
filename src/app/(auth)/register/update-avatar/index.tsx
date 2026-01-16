import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function UpdateAvatarScreen() {
    const router = useRouter();
    const { name } = useLocalSearchParams<{ name?: string }>();

    // Lấy chữ cái đầu (VD: "Trâm Anh" → "TA")
    const getInitials = (fullName?: string) => {
        if (!fullName) return "U";

        const words = fullName.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();

        return (
            words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
        );
    };

    return (
        <View className="flex-1 bg-white px-6 pt-12">
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>

            {/* Title */}
            <View className="items-center mt-8">
                <Text className="text-xl font-semibold">
                    Cập nhật ảnh đại diện
                </Text>
                <Text className="text-gray-500 mt-2 text-center">
                    Đặt ảnh đại diện để mọi người dễ nhận ra bạn
                </Text>
            </View>

            {/* Avatar */}
            <View className="items-center mt-10">
                <View className="w-32 h-32 rounded-full bg-green-600 items-center justify-center">
                    <Text className="text-white text-3xl font-semibold">
                        {getInitials(name)}
                    </Text>
                </View>
            </View>

            {/* Illustration */}
            <View className="flex-1 items-center justify-center opacity-20">
                <View className="w-32 h-32 bg-blue-100 rounded-2xl" />
            </View>

            {/* Update button */}
            <TouchableOpacity
                onPress={() => console.log("Update avatar")}
                className="h-14 bg-blue-600 rounded-full items-center justify-center"
            >
                <Text className="text-white font-semibold text-base">
                    Cập nhật
                </Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity
                onPress={() => router.push("/(tabs)" as any)}
                className="h-14 bg-gray-100 rounded-full items-center justify-center mt-4 mb-6"
            >
                <Text className="font-semibold text-gray-700">Bỏ qua</Text>
            </TouchableOpacity>
        </View>
    );
}
