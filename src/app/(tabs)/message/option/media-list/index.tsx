import { mediaApi } from "@/src/api/chat/mediaApi";
import { chatAuthUtils } from "@/src/api/chat/chatApi";
import { ChatMediaItem } from "@/src/api/chat/types";
import { getFullUrl } from "@/src/utils/url";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Link2, MoveLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function paramStr(v: string | string[] | undefined): string {
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v[0] || "";
    return "";
}

type TabType = "MEDIA" | "FILE" | "LINK";

export default function ChatMediaScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        conversationId: string;
        userId: string;
        name: string;
    }>();
    const conversationId = paramStr(params.conversationId);
    const [userId, setUserId] = useState(paramStr(params.userId));

    const [activeTab, setActiveTab] = useState<TabType>("MEDIA");
    const [loading, setLoading] = useState(true);
    // State lưu danh sách dữ liệu thô nhận từ API
    const [rawMediaList, setRawMediaList] = useState<ChatMediaItem[]>([]);

    // Tự động lấy currentUserId từ session khi params không truyền sang
    useEffect(() => {
        if (!userId) {
            chatAuthUtils.getCurrentUserId().then((id) => {
                if (id) setUserId(id);
            });
        }
    }, [userId]);

    // Gọi API khi vào màn hình, đổi cuộc hội thoại, hoặc khi chuyển tab
    useEffect(() => {
        if (!conversationId || !userId) return;
        fetchMediaData();
    }, [conversationId, userId, activeTab]);

    const fetchMediaData = async () => {
        setLoading(true);
        try {
            let data: ChatMediaItem[] = [];
            if (activeTab === "MEDIA") {
                // Gọi song song cả IMAGE và VIDEO để gộp chung hiển thị
                const [images, videos] = await Promise.all([
                    mediaApi
                        .getMediaByConversation(conversationId, userId, "IMAGE")
                        .catch(() => []),
                    mediaApi
                        .getMediaByConversation(conversationId, userId, "VIDEO")
                        .catch(() => []),
                ]);
                data = [...images, ...videos];
            } else {
                data = await mediaApi.getMediaByConversation(
                    conversationId,
                    userId,
                    activeTab, // "FILE" hoặc "LINK"
                );
            }
            console.log(
                `[ChatMediaScreen] Fetch media thành công cho conversationId: ${conversationId}, tab: ${activeTab}`,
            );

            // Lọc chỉ lấy các mục thuộc đúng cuộc trò chuyện hiện tại để tránh rò rỉ ảnh nhóm sang chat đơn
            const filteredData = data.filter((item) => {
                return (
                    !item.conversationId ||
                    String(item.conversationId) === String(conversationId)
                );
            });

            // Loại bỏ hoàn toàn các phần tử trùng lặp ID để tránh lỗi non-unique keys trong React
            const seen = new Set<string>();
            const uniqueData = filteredData.filter((item) => {
                const id = String(item.id || "");
                if (!id) return true;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            setRawMediaList(uniqueData);
        } catch (error) {
            console.error(
                "[ChatMediaScreen] Lỗi lấy dữ liệu media từ server:",
                error,
            );
        } finally {
            setLoading(false);
        }
    };

    // 🔥 TỐI ƯU HÓA: Tự động filter và group theo Ngày ở Local bằng useMemo khi switch Tab
    const groupedData = useMemo(() => {
        // 1. Lọc và chuyển đổi dữ liệu thô từ API sang format UI
        const mapped = rawMediaList
            .filter((item) => {
                const currentType = String(item.type).toUpperCase();
                // Nếu Tab hiện tại là LINK, chỉ lấy tin nhắn loại LINK
                if (activeTab === "LINK") return currentType === "LINK";
                // Nếu Tab hiện tại là Ảnh hoặc File, bắt buộc phải có thông tin file đính kèm
                return item.attachment;
            })
            .map((item) => {
                const currentType = String(item.type).toUpperCase();
                return {
                    id: item.id,
                    type: currentType, // Ép chữ hoa chuẩn để so sánh Tab không bị lệch
                    // Gọi hàm getFullUrl đã fix tự chèn /uploads/ ở câu trước
                    url:
                        currentType === "LINK"
                            ? item.content || ""
                            : getFullUrl(item.attachment?.fileUrl || ""),
                    createdAt: item.createdAt,
                    name: item.attachment?.fileName || "File",
                };
            });

        // 2. Lọc chính xác theo Tab đang chọn (Ép kiểu as any để diệt hoàn toàn lỗi đỏ TypeScript ts(2367))
        const filtered = mapped.filter((item) => {
            if (activeTab === "MEDIA") {
                return item.type === "IMAGE" || item.type === "VIDEO";
            }
            return item.type === activeTab;
        });

        // 3. Gom nhóm dữ liệu đã lọc theo Ngày (vi-VN)
        return filtered.reduce((acc: { [key: string]: any[] }, curr: any) => {
            const date = new Date(curr.createdAt).toLocaleDateString("vi-VN");
            if (!acc[date]) acc[date] = [];
            acc[date].push(curr);
            return acc;
        }, {});
    }, [rawMediaList, activeTab]);

    const handleOpenFile = (url: string) => {
        if (url) {
            Linking.openURL(url).catch((err) =>
                console.error("Không thể mở liên kết này:", err),
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-blue-600 flex-row items-center px-4 py-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg ml-6 font-semibold">
                    Ảnh, file, link đã gửi
                </Text>
            </View>

            {/* Tabs */}
            <View className="flex-row bg-white border-b border-gray-200">
                <TabButton
                    title="Ảnh/Video"
                    isActive={activeTab === "MEDIA"}
                    onPress={() => setActiveTab("MEDIA")}
                />
                <TabButton
                    title="File"
                    isActive={activeTab === "FILE"}
                    onPress={() => setActiveTab("FILE")}
                />
                <TabButton
                    title="Link"
                    isActive={activeTab === "LINK"}
                    onPress={() => setActiveTab("LINK")}
                />
            </View>

            {/* List Content */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : Object.keys(groupedData).length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Chưa có dữ liệu nào</Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-4 pt-2"
                    showsVerticalScrollIndicator={false}
                >
                    {Object.keys(groupedData).map((date) => (
                        <View key={date} className="mb-6">
                            <Text className="text-sm font-semibold text-gray-600 mb-3">
                                {date}
                            </Text>

                            {/* Grid cho Ảnh/Video, List dọc cho File/Link */}
                            <View
                                className={
                                    activeTab === "MEDIA"
                                        ? "flex-row flex-wrap gap-2"
                                        : ""
                                }
                            >
                                {groupedData[date].map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => handleOpenFile(item.url)}
                                        className={
                                            activeTab === "MEDIA"
                                                ? ""
                                                : "bg-white p-3 rounded-xl mb-2 flex-row items-center shadow-sm"
                                        }
                                    >
                                        {activeTab === "MEDIA" && (
                                            <Image
                                                source={{ uri: item.url }}
                                                className="w-[110px] h-[110px] rounded-lg bg-gray-200"
                                            />
                                        )}
                                        {activeTab === "FILE" && (
                                            <>
                                                <View className="p-2 bg-blue-100 rounded-lg mr-3">
                                                    <FileText
                                                        size={24}
                                                        color="#2563eb"
                                                    />
                                                </View>
                                                <Text
                                                    className="flex-1 font-medium text-gray-800"
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>
                                            </>
                                        )}
                                        {activeTab === "LINK" && (
                                            <>
                                                <View className="p-2 bg-gray-100 rounded-lg mr-3">
                                                    <Link2
                                                        size={24}
                                                        color="#4b5563"
                                                    />
                                                </View>
                                                <Text
                                                    className="flex-1 text-blue-600 underline"
                                                    numberOfLines={1}
                                                >
                                                    {item.url}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                    <View className="h-10" />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// Component nút chuyển đổi Tab
function TabButton({
    title,
    isActive,
    onPress,
}: {
    title: string;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            className={`flex-1 py-3 items-center border-b-2 ${isActive ? "border-blue-600" : "border-transparent"}`}
            onPress={onPress}
        >
            <Text
                className={`font-semibold ${isActive ? "text-blue-600" : "text-gray-500"}`}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}
