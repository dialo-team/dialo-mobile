import { chatApi } from "@/src/api/chat/chatApi";
import { useRouter } from "expo-router";
import { ArrowLeft, MessageCirclePlus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHAT_BASE_URL = "http://14.225.254.174:8085";

const resolveAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return "";
    if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
    return `${CHAT_BASE_URL}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
};

export default function NewConversationScreen() {
    const router = useRouter();
    const [participantId, setParticipantId] = useState("");
    const [initialSystemMessage, setInitialSystemMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [counterpartProfile, setCounterpartProfile] = useState<any>(null);

    const trimmedParticipantId = useMemo(
        () => participantId.trim(),
        [participantId],
    );

    const lookupProfile = useCallback(async () => {
        if (!trimmedParticipantId) {
            setProfileError("Vui lòng nhập userId để tra cứu");
            setCounterpartProfile(null);
            return null;
        }

        setProfileLoading(true);
        setProfileError("");
        try {
            const profile = await chatApi.getUserProfile(trimmedParticipantId);
            setCounterpartProfile(profile || null);
            return profile || null;
        } catch (error: any) {
            setCounterpartProfile(null);
            setProfileError(
                error?.message || "Không tìm thấy thông tin người dùng",
            );
            return null;
        } finally {
            setProfileLoading(false);
        }
    }, [trimmedParticipantId]);

    const handleCreateOrOpenConversation = async () => {
        if (!trimmedParticipantId) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập userId đối phương");
            return;
        }

        setLoading(true);
        try {
            let profile = counterpartProfile;
            const profileId = profile?.id || profile?.userId;
            if (!profile || profileId !== trimmedParticipantId) {
                profile = await lookupProfile();
            }

            const result = await chatApi.createConversation({
                participantIds: [trimmedParticipantId],
                initialSystemMessage: initialSystemMessage.trim() || undefined,
            });

            const conversationId = result?.conversationId || result?.id || "";

            if (!conversationId) {
                throw new Error("Không lấy được conversationId từ phản hồi");
            }

            router.replace({
                pathname: "/message/chat/[id]",
                params: {
                    id: conversationId,
                    name:
                        profile?.displayName ||
                        profile?.name ||
                        profile?.userName ||
                        trimmedParticipantId,
                    avatar: resolveAvatarUrl(
                        profile?.avatarUrl || profile?.avatar,
                    ),
                    from: "message",
                },
            });
        } catch (error: any) {
            Alert.alert(
                "Không thể tạo/open conversation",
                error?.message || "Vui lòng thử lại",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-4 py-4 border-b border-gray-200 flex-row items-center bg-blue-600">
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={22} color="white" />
                </TouchableOpacity>
                <Text className="text-white font-semibold text-base ml-3">
                    Tạo/Open conversation
                </Text>
            </View>

            <View className="px-4 py-5">
                <Text className="text-sm text-gray-700 mb-2">
                    User ID đối phương
                </Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm"
                    placeholder="Nhập counterpart userId"
                    value={participantId}
                    onChangeText={(value) => {
                        setParticipantId(value);
                        setProfileError("");
                        setCounterpartProfile(null);
                    }}
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    onPress={lookupProfile}
                    disabled={profileLoading || !trimmedParticipantId}
                    className="mt-3 self-start bg-gray-100 rounded-xl px-4 py-2"
                >
                    <Text className="text-sm text-gray-700 font-medium">
                        {profileLoading ? "Đang tra cứu..." : "Lookup profile"}
                    </Text>
                </TouchableOpacity>

                {!!profileError && (
                    <Text className="mt-2 text-xs text-red-500">
                        {profileError}
                    </Text>
                )}

                {counterpartProfile && (
                    <View className="mt-3 p-3 border border-gray-200 rounded-xl flex-row items-center">
                        {resolveAvatarUrl(
                            counterpartProfile?.avatarUrl ||
                                counterpartProfile?.avatar,
                        ) ? (
                            <Image
                                source={{
                                    uri: resolveAvatarUrl(
                                        counterpartProfile?.avatarUrl ||
                                            counterpartProfile?.avatar,
                                    ),
                                }}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
                                <Text className="text-white font-semibold">
                                    {(
                                        counterpartProfile?.displayName ||
                                        counterpartProfile?.name ||
                                        counterpartProfile?.userName ||
                                        trimmedParticipantId ||
                                        "U"
                                    )
                                        .slice(0, 1)
                                        .toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View className="ml-3 flex-1">
                            <Text className="text-sm font-semibold text-gray-900">
                                {counterpartProfile?.displayName ||
                                    counterpartProfile?.name ||
                                    counterpartProfile?.userName ||
                                    "Người dùng"}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                ID:{" "}
                                {counterpartProfile?.id || trimmedParticipantId}
                            </Text>
                        </View>
                    </View>
                )}

                <Text className="text-sm text-gray-700 mb-2 mt-4">
                    Initial system message (tuỳ chọn)
                </Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm"
                    placeholder="Ví dụ: Xin chào"
                    value={initialSystemMessage}
                    onChangeText={setInitialSystemMessage}
                />

                <TouchableOpacity
                    onPress={handleCreateOrOpenConversation}
                    disabled={loading}
                    className="mt-6 bg-blue-600 rounded-xl py-3 px-4 flex-row items-center justify-center"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MessageCirclePlus size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">
                                Tạo/Open ngay
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
