import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useState } from "react";

type Conversation = {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread?: boolean;
    isGroup?: boolean;
};

export default function MessagesScreen() {
    const [searchText, setSearchText] = useState("");

    const conversations: Conversation[] = [
        {
            id: "1",
            name: "Media Box",
            avatar: "MB",
            lastMessage: "Báo Mới: [APP] Ổ tô mất lái tông...",
            time: "",
            unread: true,
        },
        {
            id: "2",
            name: "Tim Việc",
            avatar: "TV",
            lastMessage: "Bạn có một tin nhắn mới...",
            time: "5 giờ",
            unread: true,
        },
        {
            id: "3",
            name: "NOW_KLTN_HK2_20...",
            avatar: "N",
            lastMessage: "Bạn trở thành thành viên của nhóm",
            time: "6 giờ",
        },
        {
            id: "4",
            name: "Từ Đại My...",
            avatar: "CA",
            lastMessage: "Minh Khôi: [Hình ảnh]",
            time: "9 giờ",
        },
    ];

    const getAvatarColor = (avatar: string) => {
        const colors = {
            MB: "bg-blue-500",
            TV: "bg-blue-600",
            N: "bg-gray-400",
            CA: "bg-orange-500",
        };
        return colors[avatar as keyof typeof colors] || "bg-gray-500";
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-blue-600 px-4 pt-12 pb-4">
                {/* Search Bar */}
                <View className="flex-row items-center bg-blue-500 rounded-lg px-4 py-2">
                    <Text className="text-white text-lg mr-3">🔍</Text>
                    <TextInput
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#E3F2FD"
                        className="flex-1 text-white text-base"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity className="ml-3">
                        <Text className="text-white text-xl">⊞</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="ml-3">
                        <Text className="text-white text-xl">+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Conversations List */}
            <ScrollView className="flex-1">
                {conversations.map((conversation) => (
                    <TouchableOpacity
                        key={conversation.id}
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    >
                        {/* Avatar */}
                        <View className="relative">
                            <View
                                className={`w-12 h-12 rounded-full items-center justify-center ${getAvatarColor(
                                    conversation.avatar,
                                )}`}
                            >
                                <Text className="text-white font-semibold text-base">
                                    {conversation.avatar}
                                </Text>
                            </View>
                            {conversation.id === "2" && (
                                <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center border-2 border-white">
                                    <Text className="text-white text-xs">
                                        👤
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Content */}
                        <View className="flex-1 ml-3">
                            <View className="flex-row items-center justify-between">
                                <Text className="font-semibold text-gray-900 text-base">
                                    {conversation.name}
                                </Text>
                                <Text className="text-gray-500 text-xs">
                                    {conversation.time}
                                </Text>
                            </View>
                            <Text
                                className="text-gray-600 text-sm mt-1"
                                numberOfLines={1}
                            >
                                {conversation.lastMessage}
                            </Text>
                        </View>

                        {/* Unread indicator */}
                        {conversation.unread && (
                            <View className="w-2 h-2 bg-red-500 rounded-full ml-2" />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
