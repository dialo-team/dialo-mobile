import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Image,
    MoreHorizontal,
    MoveLeft,
    Phone,
    Smile,
    Video,
} from "lucide-react-native";
import {
    Image as RNImage,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
    const router = useRouter();
    const { id, name, avatar } = useLocalSearchParams();

    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            {/* HEADER */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3 justify-between">
                {/* Left */}
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()}>
                        <MoveLeft size={26} color="white" />
                    </TouchableOpacity>

                    <View className="ml-3">
                        <Text className="text-white font-semibold text-[16px]">
                            {name}
                        </Text>
                        <Text className="text-white text-[12px] opacity-80">
                            Truy cập 4 giờ trước
                        </Text>
                    </View>
                </View>

                {/* Right */}
                <View className="flex-row items-center ml-9">
                    <TouchableOpacity>
                        <Phone size={22} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: 10 }}>
                        <Video size={26} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ marginLeft: 10 }}
                        onPress={() =>
                            router.push({
                                pathname:
                                    "/(tabs)/message/option/account-option",
                                params: {
                                    id,
                                    name,
                                    avatar,
                                },
                            })
                        }
                    >
                        <MoreHorizontal size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* CHAT BODY */}
            <ScrollView
                className="flex-1 px-3 pt-4"
                showsVerticalScrollIndicator={false}
            >
                {/* Message left */}
                <View className="flex-row mb-3">
                    <RNImage
                        source={{ uri: avatar as string }}
                        className="w-8 h-8 rounded-full mr-2"
                    />

                    <View className="bg-white px-4 py-2 rounded-2xl max-w-[70%]">
                        <Text className="text-[15px]">Hello bạn</Text>
                    </View>
                </View>

                {/* Message right */}
                <View className="flex-row justify-end mb-3">
                    <View className="bg-[#cde7f4] px-4 py-2 rounded-2xl max-w-[70%]">
                        <Text className="text-[15px]">Lâu rùi hỏng gặp</Text>
                        <Text className="text-gray-500 text-[11px] mt-1">
                            18:07
                        </Text>
                    </View>
                </View>

                {/* Message left */}
                <View className="flex-row mb-3">
                    <RNImage
                        source={{ uri: avatar as string }}
                        className="w-8 h-8 rounded-full mr-2"
                    />

                    <View className="bg-white px-4 py-2 rounded-2xl max-w-[70%]">
                        <Text className="text-[15px]">dạo này khoẻ hong</Text>
                        <Text className="text-gray-500 text-[11px] mt-1">
                            18:07
                        </Text>
                    </View>
                </View>

                <View className="h-6" />
            </ScrollView>

            {/* INPUT BAR */}
            <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-center">
                <TouchableOpacity className="mr-2">
                    <Smile size={26} color="#666" />
                </TouchableOpacity>

                <TextInput
                    placeholder="Tin nhắn"
                    className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-[15px]"
                />

                <TouchableOpacity className="ml-2">
                    <Image size={26} color="#666" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
