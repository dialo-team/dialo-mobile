import { extractBlockedUserId, friendApi } from "@/src/api/friend/friendApi";
import { useFocusEffect, useRouter } from "expo-router";
import { MoveLeft, UserX } from "lucide-react-native";
import React, { useCallback, useState } from "react";
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

type BlockedItem = {
    id: string;
    name: string;
    avatar?: string;
};

const getInitial = (value: string) => value.slice(0, 1).toUpperCase();

export default function BlockedUsersScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState("");
    const [blockedUsers, setBlockedUsers] = useState<BlockedItem[]>([]);

    const loadBlockedUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await friendApi.getBlockedUsers();

            console.log(
                "[DEBUG] Raw Blocked Data:",
                JSON.stringify(data[0], null, 2),
            );

            const mapped = data.map((item: any) => {
                // Lấy ID dùng hàm helper đã có
                const id = extractBlockedUserId(item);
                return {
                    id: id,
                    name:
                        item.blockedUserName ||
                        item.name ||
                        item.userName ||
                        "Người dùng",
                    avatar:
                        item.blockedAvatar ||
                        item.avatarUrl ||
                        item.avatar ||
                        "",
                };
            });

            const finalData = mapped.filter((item) => item.id !== "");
            console.log("[DEBUG] Final Mapped Data for UI:", finalData);

            setBlockedUsers(finalData);
        } catch (error) {
            console.error("Load blocked list error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadBlockedUsers();
        }, [loadBlockedUsers]),
    );

    const handleUnblock = async (item: BlockedItem) => {
        setSubmittingId(item.id);
        try {
            await friendApi.unblockUser(item.id);
            setBlockedUsers((prev) =>
                prev.filter((user) => user.id !== item.id),
            );
            Alert.alert("Thành công", `Đã bỏ chặn ${item.name}.`);
        } catch {
            Alert.alert("Lỗi", "Không thể bỏ chặn. Vui lòng thử lại.");
        } finally {
            setSubmittingId("");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-4 bg-blue-600">
                <TouchableOpacity onPress={() => router.back()}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-[18px] font-medium ml-4">
                    Danh sách đã chặn
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0068FF" />
                </View>
            ) : blockedUsers.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-gray-500 text-center">
                        Bạn chưa chặn người dùng nào.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingVertical: 8 }}
                >
                    {blockedUsers.map((item) => (
                        <View
                            key={item.id}
                            className="mx-4 my-1 bg-white border border-gray-100 rounded-xl px-3 py-3 flex-row items-center"
                        >
                            {item.avatar ? (
                                <Image
                                    source={{ uri: item.avatar }}
                                    className="w-11 h-11 rounded-full"
                                />
                            ) : (
                                <View className="w-11 h-11 rounded-full bg-gray-300 items-center justify-center">
                                    <Text className="text-white font-semibold text-base">
                                        {getInitial(item.name)}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-1 ml-3">
                                <Text className="text-base font-medium text-black">
                                    {item.name}
                                </Text>
                            </View>

                            <TouchableOpacity
                                className="flex-row items-center px-3 py-2 bg-red-50 rounded-lg"
                                disabled={submittingId === item.id}
                                onPress={() => handleUnblock(item)}
                            >
                                <UserX size={16} color="#DC2626" />
                                <Text className="text-red-600 text-sm font-medium ml-1">
                                    {submittingId === item.id
                                        ? "Đang xử lý"
                                        : "Bỏ chặn"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
