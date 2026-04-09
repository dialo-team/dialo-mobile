import { useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FriendRequest = {
    id: string;
    name: string;
    avatar: string;
};

const pendingRequests: FriendRequest[] = [
    {
        id: "101",
        name: "Thanh Trúc",
        avatar: "https://i.pravatar.cc/150?img=47",
    },
    {
        id: "102",
        name: "Hà My",
        avatar: "https://i.pravatar.cc/150?img=35",
    },
    {
        id: "103",
        name: "Minh Thu",
        avatar: "https://i.pravatar.cc/150?img=49",
    },
];

const confirmedFriends: FriendRequest[] = [
    {
        id: "1",
        name: "Angel Nguyễn",
        avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
        id: "6",
        name: "Bảo đại ca",
        avatar: "https://i.pravatar.cc/150?img=21",
    },
    {
        id: "11",
        name: "Đạt da đen",
        avatar: "https://i.pravatar.cc/150?img=26",
    },
];

export default function FriendRequestsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"pending" | "confirmed">(
        "pending",
    );
    const [pending, setPending] = useState<FriendRequest[]>(pendingRequests);
    const [confirmed, setConfirmed] =
        useState<FriendRequest[]>(confirmedFriends);

    const acceptFriend = (id: string) => {
        setPending((prev) => {
            const request = prev.find((item) => item.id === id);
            if (!request) return prev;

            setConfirmed((prevConfirmed) => [request, ...prevConfirmed]);
            return prev.filter((item) => item.id !== id);
        });
    };

    const declineFriend = (id: string) => {
        setPending((prev) => prev.filter((item) => item.id !== id));
    };

    const currentList = useMemo(() => {
        return activeTab === "pending" ? pending : confirmed;
    }, [activeTab, pending, confirmed]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={() => router.back()}>
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
                        className={`font-medium ${
                            activeTab === "pending"
                                ? "text-blue-600"
                                : "text-gray-500"
                        }`}
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
                        className={`font-medium ${
                            activeTab === "confirmed"
                                ? "text-blue-600"
                                : "text-gray-500"
                        }`}
                    >
                        Bạn đã xác nhận ({confirmed.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {currentList.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
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
                        <Image
                            source={{ uri: item.avatar }}
                            className="w-12 h-12 rounded-full"
                        />
                        <View className="flex-1 ml-3">
                            <Text className="text-base text-black font-medium">
                                {item.name}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-1">
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
                                    <Text className="text-gray-700 text-sm">
                                        Từ chối
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="px-3 py-2 rounded-full bg-blue-600"
                                    onPress={() => acceptFriend(item.id)}
                                >
                                    <Text className="text-white text-sm">
                                        Đồng ý
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity className="px-3 py-2 rounded-full bg-gray-100">
                                <Text className="text-gray-700 text-sm">
                                    Nhắn tin
                                </Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
