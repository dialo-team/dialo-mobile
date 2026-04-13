import { friendApi } from "@/src/api/friend/friendApi";
import { useFocusEffect, useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
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

type FriendRequest = {
    id: string; // ID của user để kết bạn
    name: string;
    avatar: string;
};

export default function FriendRequestsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"pending" | "confirmed">(
        "pending",
    );

    const [pending, setPending] = useState<FriendRequest[]>([]);
    const [confirmed, setConfirmed] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getInitials = (text: string) => {
        if (!text) return "U";
        const words = text.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const mapUserData = (items: any[]): FriendRequest[] => {
        if (!items || !Array.isArray(items)) return [];
        return items.map((item, index) => {
            // Lấy ID của người gửi (nếu có), hoặc fallback
            const targetId = item.senderId || item.id || `fallback-${index}`;

            return {
                id: targetId,
                name:
                    item.userName || item.name || "Người dùng (Chờ BE cấp Tên)",
                avatar: item.avatarUrl || item.avatar || "",
            };
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, []),
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [pendingRes, friendsRes] = await Promise.all([
                friendApi.getPendingRequests(),
                friendApi.getFriends(),
            ]);

            const pendingList = pendingRes.data || pendingRes;
            const friendsList = friendsRes.data || friendsRes;

            // Fetch thông tin chi tiết từng người gửi lời mời
            const pendingWithInfo = await Promise.all(
                (Array.isArray(pendingList) ? pendingList : []).map(
                    async (item: any) => {
                        try {
                            const userRes = await friendApi.getUserById(
                                item.senderId,
                            );
                            const user = userRes?.data || userRes;
                            return {
                                id: item.senderId,
                                name: user?.userName || "Người dùng",
                                avatar: user?.avatarUrl || user?.avatar || "",
                            };
                        } catch {
                            return {
                                id: item.senderId,
                                name: "Người dùng",
                                avatar: "",
                            };
                        }
                    },
                ),
            );

            setPending(pendingWithInfo);
            setConfirmed(
                mapUserData(Array.isArray(friendsList) ? friendsList : []),
            );
        } catch (error: any) {
            console.log(
                "Lỗi tải danh sách:",
                error.response?.data || error.message,
            );
        } finally {
            setIsLoading(false);
        }
    };

    const acceptFriend = async (id: string) => {
        try {
            await friendApi.acceptRequest(id);
            setPending((prev) => {
                const request = prev.find((item) => item.id === id);
                if (request) {
                    setConfirmed((prevConfirmed) => [
                        request,
                        ...prevConfirmed,
                    ]);
                }
                return prev.filter((item) => item.id !== id);
            });
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error.response?.data?.message ||
                    "Không thể đồng ý kết bạn lúc này.",
            );
        }
    };

    const declineFriend = async (id: string) => {
        try {
            await friendApi.rejectRequest(id);
            setPending((prev) => prev.filter((item) => item.id !== id));
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error.response?.data?.message ||
                    "Không thể từ chối kết bạn lúc này.",
            );
        }
    };

    const currentList = useMemo(() => {
        return activeTab === "pending" ? pending : confirmed;
    }, [activeTab, pending, confirmed]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold ml-4">
                    Quản lý bạn bè
                </Text>
            </View>

            <View className="flex-row border-b border-gray-200 bg-white">
                <TouchableOpacity
                    className={`flex-1 py-3 items-center border-b-2 ${
                        activeTab === "pending"
                            ? "border-blue-600"
                            : "border-transparent"
                    }`}
                    onPress={() => setActiveTab("pending")}
                >
                    <Text
                        className={`font-medium ${activeTab === "pending" ? "text-blue-600" : "text-gray-500"}`}
                    >
                        Chờ xác nhận ({pending.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`flex-1 py-3 items-center border-b-2 ${
                        activeTab === "confirmed"
                            ? "border-blue-600"
                            : "border-transparent"
                    }`}
                    onPress={() => setActiveTab("confirmed")}
                >
                    <Text
                        className={`font-medium ${activeTab === "confirmed" ? "text-blue-600" : "text-gray-500"}`}
                    >
                        Bạn bè ({confirmed.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0068FF" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 bg-gray-50"
                    showsVerticalScrollIndicator={false}
                >
                    {currentList.length === 0 && (
                        <View className="mt-10 items-center justify-center px-4">
                            <Text className="text-gray-500 text-center">
                                {activeTab === "pending"
                                    ? "Bạn chưa có lời mời kết bạn nào."
                                    : "Bạn chưa có bạn bè nào trong danh bạ."}
                            </Text>
                        </View>
                    )}

                    {/* ĐÃ THÊM INDEX VÀO MAP ĐỂ ĐẢM BẢO KEY LUÔN UNIQUE */}
                    {currentList.map((item, index) => (
                        <TouchableOpacity
                            key={item.id || `fallback-${index}`}
                            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
                            onPress={() =>
                                router.push({
                                    pathname: "/contact/friend/[id]",
                                    params: {
                                        id: item.id,
                                        name: item.name,
                                        avatar: item.avatar,
                                    },
                                } as any)
                            }
                        >
                            {item.avatar &&
                            item.avatar !== "undefined" &&
                            item.avatar.trim() !== "" ? (
                                <Image
                                    source={{ uri: item.avatar }}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                                    <Text className="text-white font-bold text-lg">
                                        {getInitials(item.name)}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-1 ml-3">
                                <Text
                                    className="text-base text-black font-medium"
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                                <Text className="text-sm text-gray-500 mt-0.5">
                                    {activeTab === "pending"
                                        ? "Đã gửi lời mời kết bạn"
                                        : "Bạn bè"}
                                </Text>
                            </View>

                            {activeTab === "pending" ? (
                                <View className="flex-row">
                                    <TouchableOpacity
                                        className="px-3 py-2 rounded-full bg-gray-100 mr-2"
                                        onPress={() => declineFriend(item.id)}
                                    >
                                        <Text className="text-gray-700 text-sm font-medium">
                                            Từ chối
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="px-3 py-2 rounded-full bg-blue-600"
                                        onPress={() => acceptFriend(item.id)}
                                    >
                                        <Text className="text-white text-sm font-medium">
                                            Đồng ý
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity className="px-3 py-2 rounded-full bg-gray-100">
                                    <Text className="text-blue-600 text-sm font-medium">
                                        Nhắn tin
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ))}
                    <View className="h-8" />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
