import { friendApi } from "@/src/api/friend/friendApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
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
    // Đổi tab confirmed thành sent
    const [activeTab, setActiveTab] = useState<"pending" | "sent">("pending");

    const [pending, setPending] = useState<FriendRequest[]>([]);
    const [sentList, setSentList] = useState<FriendRequest[]>([]); // Đổi state lưu danh sách đã gửi
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, []),
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Thay vì getFriends, gọi API getSentRequests
            const [pendingRes, sentRes] = await Promise.all([
                friendApi.getPendingRequests(),
                friendApi.getSentRequests(),
            ]);

            const pendingData = pendingRes?.data || pendingRes || [];
            const sentData = sentRes?.data || sentRes || [];

            // 1. Map thông tin người gửi lời mời cho mình (Pending)
            const pendingWithInfo = await Promise.all(
                (Array.isArray(pendingData) ? pendingData : []).map(
                    async (item: any) => {
                        try {
                            const userRes = await friendApi.getUserById(
                                item.senderId,
                            );
                            const user = userRes?.data || userRes;
                            return {
                                id: item.senderId,
                                name: pickBestDisplayName(
                                    [
                                        user?.userName,
                                        user?.name,
                                        user?.displayName,
                                        user?.fullName,
                                    ],
                                    "Nguoi dung",
                                ),
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

            // 2. Map thông tin người MÌNH gửi lời mời (Sent)
            const sentWithInfo = await Promise.all(
                (Array.isArray(sentData) ? sentData : []).map(
                    async (item: any) => {
                        try {
                            // Người mình gửi lời mời sẽ nằm ở trường receiverId (hoặc targetId tuỳ BE)
                            const targetId =
                                item.receiverId || item.targetId || item.id;
                            const userRes =
                                await friendApi.getUserById(targetId);
                            const user = userRes?.data || userRes;
                            return {
                                id: targetId,
                                name: pickBestDisplayName(
                                    [
                                        user?.userName,
                                        user?.name,
                                        user?.displayName,
                                        user?.fullName,
                                    ],
                                    "Nguoi dung",
                                ),
                                avatar: user?.avatarUrl || user?.avatar || "",
                            };
                        } catch {
                            return {
                                id: item.receiverId || item.id,
                                name: "Người dùng",
                                avatar: "",
                            };
                        }
                    },
                ),
            );

            setPending(pendingWithInfo);
            setSentList(sentWithInfo);
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
            // Cập nhật lại UI sau khi đồng ý
            setPending((prev) => prev.filter((item) => item.id !== id));
            Alert.alert("Thành công", "Đã chấp nhận lời mời kết bạn.");
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

    // THÊM MỚI: Hàm thu hồi lời mời kết bạn đã gửi
    const cancelSentRequest = async (id: string) => {
        try {
            await friendApi.cancelFriendRequest(id);
            // Xoá khỏi danh sách "Đã gửi" trên UI
            setSentList((prev) => prev.filter((item) => item.id !== id));
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error.response?.data?.message ||
                    "Không thể thu hồi lời mời lúc này.",
            );
        }
    };

    const currentList = useMemo(() => {
        return activeTab === "pending" ? pending : sentList;
    }, [activeTab, pending, sentList]);

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
                    Quản lý lời mời
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
                        activeTab === "sent"
                            ? "border-blue-600"
                            : "border-transparent"
                    }`}
                    onPress={() => setActiveTab("sent")}
                >
                    <Text
                        className={`font-medium ${activeTab === "sent" ? "text-blue-600" : "text-gray-500"}`}
                    >
                        Đã gửi ({sentList.length})
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
                                    : "Bạn chưa gửi lời mời kết bạn nào."}
                            </Text>
                        </View>
                    )}

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
                                        ? "Gửi lời mời cho bạn"
                                        : "Chờ xác nhận..."}
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
                                <TouchableOpacity
                                    className="px-3 py-2 rounded-full bg-red-100"
                                    onPress={() => cancelSentRequest(item.id)}
                                >
                                    <Text className="text-red-600 text-sm font-medium">
                                        Thu hồi
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
