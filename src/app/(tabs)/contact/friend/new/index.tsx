import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewFriendScreen() {
    const [isRequested, setIsRequested] = useState(false);
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-3 bg-white">
                <TouchableOpacity
                    onPress={() =>
                        router.push("/(tabs)/contact/friend/add" as any)
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ChevronLeft size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Cover */}
            <View className="h-52 bg-gray-200">
                <Image
                    source={{ uri: "https://picsum.photos/600/400" }}
                    className="w-full h-full"
                />
            </View>

            {/* Avatar */}
            <View className="items-center -mt-16">
                <View className="w-28 h-28 rounded-full bg-teal-400 border-4 border-white items-center justify-center">
                    <Text className="text-white text-2xl font-bold">TT</Text>
                </View>

                {/* Name */}
                <Text className="text-xl font-semibold mt-3">Thanh Trúc</Text>

                {/* Description */}
                <Text className="text-gray-500 text-center px-6 mt-2">
                    Lời mời kết bạn đã được gửi đi. Hãy để lại tin nhắn cho
                    Thanh Trúc trong lúc đợi chờ nhé!
                </Text>

                {/* Buttons */}
                <View className="flex-row mt-5 px-4">
                    {/* Message */}
                    <TouchableOpacity className="flex-1 bg-blue-100 py-3 rounded-full items-center mr-2">
                        <Text className="text-blue-600 font-medium">
                            Nhắn tin
                        </Text>
                    </TouchableOpacity>

                    {/* Add / Cancel */}
                    <TouchableOpacity
                        onPress={() => setIsRequested(!isRequested)}
                        className="flex-1 bg-gray-200 py-3 rounded-full items-center ml-2"
                    >
                        <Text className="text-gray-800 font-medium">
                            {isRequested ? "Huỷ kết bạn" : "Thêm bạn"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
