import { chatApi } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Pin, PinOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface PinnedMessage {
    messageId: string;
    content: string;
    senderId?: string;
    senderName?: string;
    senderAvatarUrl?: string | null;
}
const CHAT_BASE_URL = "http://14.225.192.37:8085";
const resolveFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${CHAT_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};
const getCleanPinnedContent = (content: string) => {
    if (!content) return "Nội dung đính kèm";
    const lower = content.toLowerCase();

    // Check if it is an image path or extension
    const isImage =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp") ||
        lower.includes("image") ||
        lower.includes("/uploads/upload-") ||
        (lower.includes("/uploads/") &&
            (lower.includes(".jpg") ||
                lower.includes(".png") ||
                lower.includes(".jpeg") ||
                lower.includes(".gif")));

    if (isImage) {
        return "[Hình ảnh]";
    }

    const isVideo =
        lower.endsWith(".mp4") ||
        lower.endsWith(".mov") ||
        lower.endsWith(".avi") ||
        lower.endsWith(".mkv") ||
        lower.includes("video") ||
        (lower.includes("/uploads/") && lower.includes(".mp4"));

    if (isVideo) {
        return "[Video]";
    }

    const isVoice =
        lower.endsWith(".mp3") ||
        lower.endsWith(".m4a") ||
        lower.endsWith(".wav") ||
        lower.endsWith(".aac") ||
        lower.includes("voice") ||
        (lower.includes("/uploads/") &&
            (lower.includes(".m4a") || lower.includes(".mp3")));

    if (isVoice) {
        return "[Tin nhắn thoại]";
    }

    return content;
};
const extractValidId = (item: any) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    return String(
        item?.userId ||
            item?.id ||
            item?.targetId ||
            item?.senderId ||
            item?.user?.id ||
            "",
    ).trim();
};
const normalizeMembers = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.members)) return data.members;
    if (Array.isArray(data.participants)) return data.participants;
    return [];
};
export default function PinMessageScreen() {
    const router = useRouter();
    const { conversationId } = useLocalSearchParams<{
        conversationId: string;
    }>();
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
    const [groupName, setGroupName] = useState("");
    const [loading, setLoading] = useState(true);
    const loadPinnedMessages = async () => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const detail = await chatApi.getConversationDetail(conversationId);
            const data = (detail?.data || detail) as any;

            const rawPins = data?.pinnedMessages || [];
            const chatMessages = data?.messages || [];

            // Trích xuất thành viên nhóm từ participants/members
            const participants = [
                ...normalizeMembers(data?.participants),
                ...normalizeMembers(data?.members),
            ];

            // Map tra cứu thông tin thành viên nhanh
            const memberMap = new Map<string, any>();
            participants.forEach((m) => {
                const id = extractValidId(m);
                if (id) {
                    memberMap.set(id, m);
                }
            });
            // Map tra cứu tin nhắn trong lịch sử chat nhanh
            const messageMap = new Map<string, any>();
            chatMessages.forEach((msg: any) => {
                const id = msg.id || msg.messageId;
                if (id) {
                    messageMap.set(String(id), msg);
                }
            });
            const enrichedPins = await Promise.all(
                rawPins.map(async (pin: any) => {
                    const pinMsgId = String(pin.messageId);

                    // Tìm tin nhắn tương ứng trong lịch sử chat
                    const chatMsg = messageMap.get(pinMsgId);

                    // Xác định senderId
                    let senderId = pin.senderId || chatMsg?.senderId || "";
                    if (!senderId && pin.sender) {
                        senderId = pin.sender.id || pin.sender.userId || "";
                    }

                    let senderName =
                        pin.senderName || chatMsg?.senderName || "";
                    let senderAvatarUrl =
                        pin.senderAvatarUrl || chatMsg?.senderAvatarUrl || "";

                    // Lấy tên/avatar từ danh sách thành viên nhóm trước
                    if (senderId) {
                        const memberProfile = memberMap.get(senderId);
                        if (memberProfile) {
                            senderName =
                                memberProfile.displayName ||
                                memberProfile.userName ||
                                memberProfile.fullName ||
                                senderName;
                            senderAvatarUrl =
                                memberProfile.avatarUrl ||
                                memberProfile.avatar ||
                                senderAvatarUrl;
                        }

                        // Nếu vẫn thiếu tên/avatar, fetch qua API bạn bè
                        if (!senderName || !senderAvatarUrl) {
                            try {
                                const userRes =
                                    await friendApi.getUserById(senderId);
                                const userData = userRes?.data || userRes;
                                if (userData) {
                                    senderName =
                                        userData.displayName ||
                                        userData.fullName ||
                                        userData.userName ||
                                        senderName;
                                    senderAvatarUrl =
                                        userData.avatar ||
                                        userData.avatarUrl ||
                                        userData.profilePictureUrl ||
                                        senderAvatarUrl;
                                }
                            } catch (e) {
                                console.log(
                                    "Lỗi fetch thông tin người gửi tin nhắn ghim:",
                                    e,
                                );
                            }
                        }
                    }

                    return {
                        ...pin,
                        senderId,
                        senderName: senderName || "Thành viên",
                        senderAvatarUrl:
                            resolveFileUrl(senderAvatarUrl) || null,
                    };
                }),
            );

            // Loại bỏ hoàn toàn các tin nhắn ghim trùng lặp ID để tránh lỗi non-unique keys trong React
            const seen = new Set<string>();
            const uniquePins = enrichedPins.filter((pin) => {
                const id = String(pin.messageId || "");
                if (!id) return true;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            setPinnedMessages(uniquePins);
            setGroupName(data?.groupName || "Nhóm");
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn ghim:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách tin nhắn ghim.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadPinnedMessages();
    }, [conversationId]);
    const handleUnpin = async (messageId: string) => {
        if (!conversationId) return;
        Alert.alert(
            "Xác nhận bỏ ghim",
            "Bạn có chắc chắn muốn bỏ ghim tin nhắn này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Bỏ ghim",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await chatApi.unpinMessage(
                                conversationId,
                                messageId,
                            );
                            setPinnedMessages((prev) =>
                                prev.filter(
                                    (item) => item.messageId !== messageId,
                                ),
                            );
                            Alert.alert("Thành công", "Đã bỏ ghim tin nhắn.");
                        } catch (error) {
                            console.error("Lỗi bỏ ghim:", error);
                            Alert.alert("Lỗi", "Không thể bỏ ghim tin nhắn.");
                        }
                    },
                },
            ],
        );
    };
    const handleGoToMessage = (messageId: string) => {
        if (!conversationId) return;
        router.push({
            pathname: `/(tabs)/message/group-chat/[id]`,
            params: {
                id: conversationId,
                name: groupName,
                scrollToMessageId: messageId,
            },
        });
    };
    return (
        <SafeAreaView className="flex-1 bg-[#f3f4f6]">
            {/* Header */}
            <View className="bg-blue-600 flex-row items-center px-4 py-4 shadow-md">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ChevronLeft size={26} color="white" />
                </TouchableOpacity>
                <View className="ml-3 flex-1">
                    <Text className="text-white text-[18px] font-bold">
                        Tin nhắn đã ghim
                    </Text>
                    <Text className="text-blue-100 text-[12px]">
                        {groupName} ({pinnedMessages.length})
                    </Text>
                </View>
            </View>
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="text-gray-500 mt-2">
                        Đang tải tin nhắn ghim...
                    </Text>
                </View>
            ) : pinnedMessages.length === 0 ? (
                <View className="flex-1 justify-center items-center px-8">
                    <View className="w-20 h-20 bg-gray-200 rounded-full justify-center items-center mb-4">
                        <Pin size={36} color="#9ca3af" />
                    </View>
                    <Text className="text-gray-600 text-lg font-bold mb-1">
                        Chưa có tin nhắn được ghim
                    </Text>
                    <Text className="text-gray-400 text-sm text-center">
                        Những tin nhắn quan trọng được ghim sẽ xuất hiện tại đây
                        để mọi người dễ dàng theo dõi.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-4 py-3"
                    showsVerticalScrollIndicator={false}
                >
                    {pinnedMessages.map((item) => (
                        <View
                            key={item.messageId}
                            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
                        >
                            {/* Thông tin người gửi (Avatar & Tên hiển thị) */}
                            <View className="flex-row items-center mb-3">
                                {item.senderAvatarUrl ? (
                                    <Image
                                        source={{ uri: item.senderAvatarUrl }}
                                        className="w-8 h-8 rounded-full bg-gray-200"
                                    />
                                ) : (
                                    <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
                                        <Text className="text-white text-[11px] font-bold">
                                            {(item.senderName || "U")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <View className="ml-2 flex-1">
                                    <Text className="text-[13px] font-bold text-gray-800">
                                        {item.senderName}
                                    </Text>
                                    <Text className="text-[10px] text-gray-400">
                                        Đã ghim tin nhắn
                                    </Text>
                                </View>
                                <Pin size={14} color="#2563eb" />
                            </View>
                            {/* Nội dung và Nút Bỏ ghim */}
                            <View className="flex-row items-center">
                                <TouchableOpacity
                                    className="flex-row items-center flex-1 mr-2"
                                    onPress={() =>
                                        handleGoToMessage(item.messageId)
                                    }
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <Text
                                            numberOfLines={3}
                                            className="text-gray-700 text-[13px] leading-5"
                                        >
                                            {getCleanPinnedContent(
                                                item.content,
                                            )}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <View className="w-[1px] h-8 bg-gray-100 mx-2" />
                                <TouchableOpacity
                                    onPress={() => handleUnpin(item.messageId)}
                                    className="p-2 bg-red-50 rounded-full"
                                    activeOpacity={0.7}
                                >
                                    <PinOff size={18} color="#dc2626" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <View className="h-6" />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
