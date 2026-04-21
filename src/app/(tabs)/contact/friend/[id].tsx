import { chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi"; // Đảm bảo đúng đường dẫn
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
    Alert,
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
    const {
        id,
        name,
        avatar,
        openRename: openRenameParam,
    } = useLocalSearchParams();

    // --- STATES ---
    const [openRename, setOpenRename] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    const safeId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
    const safeName =
        typeof name === "string" ? name : Array.isArray(name) ? name[0] : "";
    const safeAvatar =
        typeof avatar === "string"
            ? avatar
            : Array.isArray(avatar)
              ? avatar[0]
              : "";

    const [displayName, setDisplayName] = useState(safeName);
    const [nickname, setNickname] = useState(safeName);

    // --- FETCH FULL PROFILE ---
    useEffect(() => {
        const fetchFullProfile = async () => {
            if (!safeId) return;
            try {
                setIsLoading(true);
                const res = await friendApi.getUserById(safeId);
                const data = res?.data || res;
                setUserData(data);

                const finalName =
                    data?.displayName ||
                    data?.fullName ||
                    data?.userName ||
                    safeName;
                setDisplayName(finalName);
                setNickname(finalName);
            } catch (error) {
                console.error("[FriendProfile] Fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFullProfile();
    }, [safeId, safeName]);

    // --- LOGIC RENAME ---
    useEffect(() => {
        if (openRenameParam === "1") {
            setOpenRename(true);
        }
    }, [openRenameParam]);

    const hasNameChanged =
        nickname.trim() !== displayName.trim() && nickname.trim().length > 0;

    // --- MAPPING DATA (Ưu tiên API -> Fallback Params) ---
    const currentAvatar = userData?.avatar || userData?.avatarUrl || safeAvatar;
    const currentCover =
        userData?.coverImage || userData?.background || currentAvatar;
    const currentBio =
        userData?.bio ||
        "Chưa có hoạt động nào. Hãy trò chuyện để hiểu nhau hơn!";

    const handleHeaderBack = () => {
        if (safeId) {
            router.replace({
                pathname: "/(tabs)/message/option/account-option" as any,
                params: {
                    id: safeId,
                    name: displayName,
                    avatar: currentAvatar,
                },
            });
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/(tabs)/message" as any);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* COVER IMAGE */}
            <View className="h-60 w-full bg-gray-200">
                <Image
                    source={{ uri: currentCover }}
                    className="w-full h-full"
                    resizeMode="cover"
                />

                {/* TOP ICONS */}
                <View className="absolute top-4 left-4">
                    <TouchableOpacity onPress={handleHeaderBack}>
                        <MoveLeft size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="absolute top-4 right-4 flex-row items-center space-x-4">
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

                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: "../friend/profile-option",
                                params: {
                                    id: safeId,
                                    name: displayName,
                                    avatar: currentAvatar,
                                },
                            })
                        }
                    >
                        <MoreHorizontal
                            size={24}
                            color="white"
                            style={{ marginLeft: 10 }}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* AVATAR */}
            <View className="items-center -mt-16">
                <Image
                    source={{ uri: currentAvatar }}
                    className="w-32 h-32 rounded-full border-4 border-white bg-white"
                />
            </View>

            {/* NAME & BIO */}
            <View className="items-center mt-3 px-6">
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

                <Text className="text-gray-400 text-center mt-2 px-4">
                    {currentBio}
                </Text>
            </View>

            {/* SPACE */}
            <View className="flex-1" />

            {/* MESSAGE BUTTON */}
            <View className="px-6 pb-6">
                <TouchableOpacity
                    className="flex-row items-center justify-center bg-gray-100 py-3 rounded-full"
                    onPress={() => {
                        router.push({
                            pathname: "/message/chat/[id]",
                            params: {
                                id: safeId,
                                name: displayName,
                                avatar: currentAvatar,
                                from: "friend",
                            },
                        });
                    }}
                >
                    <MessageCircle size={20} color="#2563eb" />
                    <Text className="ml-2 text-blue-600 font-medium">
                        Nhắn tin
                    </Text>
                </TouchableOpacity>
            </View>

            {/* RENAME MODAL */}
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
                                    onChangeText={(value) => setNickname(value)}
                                    maxLength={40}
                                    className="flex-1 text-lg"
                                    autoFocus
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
                                Tên của người này sẽ hiển thị là:{" "}
                                {nickname || "Chưa nhập"}
                            </Text>

                            {/* SAVE BUTTON */}
                            <TouchableOpacity
                                className={`mt-6 py-4 rounded-full items-center ${
                                    hasNameChanged
                                        ? "bg-blue-600"
                                        : "bg-gray-300 opacity-50"
                                }`}
                                disabled={!hasNameChanged}
                                onPress={async () => {
                                    try {
                                        const currentUserId =
                                            await chatAuthUtils.getCurrentUserId();
                                        await friendApi.updateConversationRemark(
                                            conversationId, // Hãy đảm bảo bạn lấy được conversationId từ params
                                            nickname.trim(),
                                            currentUserId,
                                        );
                                        setDisplayName(nickname.trim());
                                        setOpenRename(false);
                                    } catch (error) {
                                        Alert.alert(
                                            "Lỗi",
                                            "Không thể lưu tên gợi nhớ",
                                        );
                                    }
                                }}
                            >
                                <Text className="text-white text-lg font-medium">
                                    Lưu
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
