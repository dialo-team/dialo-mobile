import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Link2, MoveLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
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

type TabType = "MEDIA" | "FILE" | "LINK";

export default function ChatMediaScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        conversationId: string;
        name: string;
    }>();
    const [activeTab, setActiveTab] = useState<TabType>("MEDIA");
    const [loading, setLoading] = useState(true);
    const [groupedData, setGroupedData] = useState<{ [key: string]: any[] }>(
        {},
    );

    useEffect(() => {
        fetchMediaData();
    }, [activeTab]);

    const fetchMediaData = async () => {
        setLoading(true);
        try {
            // TODO: GỌI API LẤY DỮ LIỆU CỦA BẠN TẠI ĐÂY
            // Ví dụ: const res = await chatApi.getConversationAttachments(params.conversationId, activeTab);
            // const rawData = res.data;

            // --- MOCK DATA ĐỂ BẠN TEST GIAO DIỆN TRƯỚC ---
            const mockData = [
                {
                    id: "1",
                    type: "IMAGE",
                    url: "https://picsum.photos/200",
                    createdAt: "2026-04-16T10:00:00Z",
                    name: "image1.jpg",
                },
                {
                    id: "2",
                    type: "FILE",
                    url: "https://example.com/doc.pdf",
                    createdAt: "2026-04-16T11:00:00Z",
                    name: "Tài liệu học tập.pdf",
                },
                {
                    id: "3",
                    type: "LINK",
                    url: "https://google.com",
                    createdAt: "2026-04-15T09:00:00Z",
                    name: "https://google.com",
                },
                {
                    id: "4",
                    type: "IMAGE",
                    url: "https://picsum.photos/201",
                    createdAt: "2026-04-15T15:00:00Z",
                    name: "image2.jpg",
                },
            ].filter((item) =>
                activeTab === "MEDIA"
                    ? item.type === "IMAGE" || item.type === "VIDEO"
                    : item.type === activeTab,
            );

            // Thuật toán nhóm dữ liệu theo ngày tháng năm (DD/MM/YYYY)
            const grouped = mockData.reduce((acc: any, curr: any) => {
                const date = new Date(curr.createdAt).toLocaleDateString(
                    "vi-VN",
                ); // Format: DD/MM/YYYY
                if (!acc[date]) acc[date] = [];
                acc[date].push(curr);
                return acc;
            }, {});

            setGroupedData(grouped);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu media:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFile = (url: string) => {
        if (url) Linking.openURL(url);
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

                            {/* Grid cho Ảnh/Video, List cho File/Link */}
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

// Component phụ cho Tab
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
