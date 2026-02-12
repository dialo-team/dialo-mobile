import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpdateAvatarScreen() {
    const router = useRouter();
    const { name } = useLocalSearchParams<{ name?: string }>();

    const [image, setImage] = useState<string | null>(null);

    // Lấy chữ cái đầu (VD: "Trâm Anh" → "TA")
    const getInitials = (fullName?: string) => {
        if (!fullName) return "NT";

        const words = fullName.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();

        return (
            words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
        );
    };

    // Hàm xin quyền + mở thư viện
    const pickImage = async () => {
        try {
            // Xin quyền truy cập thư viện
            const permissionResult =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    "Quyền truy cập bị từ chối",
                    "Bạn cần cấp quyền truy cập thư viện để chọn ảnh.",
                );
                return;
            }

            // Mở thư viện
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // avatar vuông
                quality: 1,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log("Image picker error:", error);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6">
                {/* Back */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-2"
                >
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
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            className="w-40 h-40 rounded-full"
                        />
                    ) : (
                        <View className="w-32 h-32 rounded-full bg-green-600 items-center justify-center">
                            <Text className="text-white text-3xl font-semibold">
                                {getInitials(name)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Illustration */}
                <View className="flex-1 items-center justify-center opacity-20">
                    <View className="w-32 h-32 bg-blue-100 rounded-2xl" />
                </View>

                {/* Update button */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="h-14 bg-blue-600 rounded-full items-center justify-center"
                >
                    <Text className="text-white font-semibold text-base">
                        Cập nhật
                    </Text>
                </TouchableOpacity>

                {/* Skip */}
                <TouchableOpacity
                    onPress={() => router.replace("/(tabs)" as any)}
                    className="h-14 bg-gray-100 rounded-full items-center justify-center mt-4 mb-6"
                >
                    <Text className="font-semibold text-gray-700">Bỏ qua</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
