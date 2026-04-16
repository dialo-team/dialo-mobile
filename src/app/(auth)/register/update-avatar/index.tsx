import { userApi } from "@/src/api/user/userApi";
import { getInitials } from "@/src/utils/displayUser";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpdateAvatarScreen() {
    const router = useRouter();
    const { name } = useLocalSearchParams<{ name?: string }>();

    const [image, setImage] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

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
                mediaTypes: ["images"], // Mới: Truyền vào mảng chuỗi 'images'
                quality: 1,
                allowsEditing: true,
                aspect: [1, 1],
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log("Image picker error:", error);
        }
    };

    const handleComplete = async () => {
        if (!image) {
            router.replace("/(tabs)/message"); // Bỏ qua nếu không chọn ảnh
            return;
        }

        setIsSubmitting(true);
        try {
            await userApi.updateAvatar(image);
            router.replace("/(tabs)/message");
        } catch (error) {
            Alert.alert("Lỗi", "Không thể upload ảnh");
        } finally {
            setIsSubmitting(false);
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
                    <MoveLeft size={24} color="gray" />
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
                                {getInitials(name, "U")}
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
                    disabled={isSubmitting} // Khóa nút khi đang upload
                    onPress={image ? handleComplete : pickImage}
                    className="h-14 bg-blue-600 rounded-full items-center justify-center"
                >
                    <Text className="text-white font-semibold text-base">
                        {isSubmitting
                            ? "Đang xử lý..."
                            : image
                              ? "Tiếp tục"
                              : "Cập nhật"}
                    </Text>
                </TouchableOpacity>

                {/* Skip */}
                <TouchableOpacity
                    onPress={() => router.replace("/(tabs)/message" as any)}
                    className="h-14 bg-gray-100 rounded-full items-center justify-center mt-4 mb-6"
                >
                    <Text className="font-semibold text-gray-700">Bỏ qua</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
