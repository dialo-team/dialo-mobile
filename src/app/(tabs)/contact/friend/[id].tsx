import { useLocalSearchParams, useRouter } from "expo-router";
import {
    CircleX,
    MessageCircle,
    MoreHorizontal,
    MoveLeft,
    Pencil,
    Phone,
    UserCog,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FriendProfileScreen() {
    const router = useRouter();
    const { id, name, avatar } = useLocalSearchParams();
    const [openRename, setOpenRename] = useState(false);

    const safeName =
        typeof name === "string" ? name : Array.isArray(name) ? name[0] : "";

    const [displayName, setDisplayName] = useState(safeName);
    const [nickname, setNickname] = useState(safeName);

    useEffect(() => {
        setDisplayName(safeName);
        setNickname(safeName);
    }, [safeName]);
    const hasNameChanged =
        nickname.trim() !== safeName.trim() && nickname.trim().length > 0;

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* COVER IMAGE */}
            <View className="h-60 w-full">
                <Image
                    source={{
                        uri: avatar as string,
                    }}
                    className="w-full h-full"
                />

                {/* TOP ICONS */}
                <View className="absolute top-4 left-4">
                    <TouchableOpacity onPress={() => router.back()}>
                        <MoveLeft size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="absolute top-4 right-4 flex-row items-center space-x-4 ">
                    <TouchableOpacity>
                        <Phone size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <UserCog
                            size={24}
                            color="white"
                            style={{ marginLeft: 10 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <MoreHorizontal
                            size={24}
                            color="white"
                            style={{ marginLeft: 10 }}
                            onPress={() =>
                                router.push({
                                    pathname: "../friend/profile-option",
                                    params: { id, name },
                                })
                            }
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* AVATAR */}
            <View className="items-center -mt-16">
                <Image
                    source={{ uri: avatar as string }}
                    className="w-32 h-32 rounded-full border-4 border-white"
                />
            </View>

            {/* NAME */}
            <View className="items-center mt-3">
                <View className="flex-row items-center">
                    <Text className="text-2xl font-semibold">
                        {displayName}
                    </Text>

                    <TouchableOpacity
                        className="ml-2"
                        onPress={() => setOpenRename(true)}
                    >
                        <Pencil size={18} />
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-400 text-center mt-2 px-8">
                    Chưa có hoạt động nào. Hãy trò chuyện để hiểu nhau hơn!
                </Text>
            </View>

            {/* SPACE */}
            <View className="flex-1" />

            {/* MESSAGE BUTTON */}
            <View className="px-6 pb-6">
                <TouchableOpacity className="flex-row items-center justify-center bg-gray-100 py-3 rounded-full">
                    <MessageCircle size={20} color="#2563eb" />
                    <Text className="ml-2 text-blue-600 font-medium">
                        Nhắn tin
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal visible={openRename} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1 justify-end bg-black/30">
                        <View className="bg-white rounded-t-3xl p-4 min-h-[30%]">
                            {/* HEADER */}
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="w-6" />

                                <Text className="text-lg font-semibold">
                                    Đổi tên gợi nhớ
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setOpenRename(false)}
                                >
                                    <X size={22} />
                                </TouchableOpacity>
                            </View>

                            {/* INPUT */}
                            <View className="border-b border-gray-300 pb-2 flex-row items-center">
                                <TextInput
                                    value={nickname}
                                    onChangeText={(value) => {
                                        setNickname(value);
                                        setDisplayName(value);
                                    }}
                                    maxLength={40}
                                    className="flex-1 text-lg"
                                />

                                {nickname.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setNickname("")}
                                    >
                                        <CircleX size={18} color="gray" />
                                    </TouchableOpacity>
                                )}

                                <Text className="ml-2 text-gray-400">
                                    {nickname.length}/40
                                </Text>
                            </View>

                            {/* DESCRIPTION */}
                            <Text className="text-gray-400 mt-3">
                                Tên của người này trong danh bạ máy là{" "}
                                {nickname}
                            </Text>

                            {/* SAVE BUTTON */}

                            {hasNameChanged ? (
                                <TouchableOpacity
                                    className="mt-6 bg-blue-600 py-4 rounded-full items-center"
                                    onPress={() => {
                                        setDisplayName(nickname.trim());
                                        setOpenRename(false);
                                    }}
                                >
                                    <Text className="text-white text-lg font-medium">
                                        Lưu
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    className="mt-6 bg-gray-300 py-4 rounded-full items-center opacity-50"
                                    disabled
                                >
                                    <Text className="text-white text-lg font-medium">
                                        Lưu
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
