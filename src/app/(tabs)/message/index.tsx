import { useRouter } from "expo-router";
import {
    Calendar,
    Folder,
    Plus,
    ScanQrCode,
    Search,
    UsersRound,
    Video,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Conversation = {
    id: string;
    name: string;
    avatar: string;
    avatarUrl?: string;
    lastMessage: string;
    time: string;
    unread?: boolean;
    isGroup?: boolean;
};

export default function MessagesScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [showMenu, setShowMenu] = useState(false);

    const conversations: Conversation[] = [
        {
            id: "1",
            name: "Media Box",
            avatar: "MB",
            lastMessage: "Báo Mới: [APP] Ổ tô mất lái tông...",
            time: "",
            unread: true,
            isGroup: true,
        },
        {
            id: "2",
            name: "Tim Việc",
            avatar: "TV",
            lastMessage: "Bạn có một tin nhắn mới...",
            time: "5 giờ",
            unread: true,
            isGroup: true,
        },
        {
            id: "3",
            name: "NOW_KLTN_HK2_20...",
            avatar: "N",
            lastMessage: "Bạn trở thành thành viên của nhóm",
            time: "6 giờ",
            isGroup: true,
        },
        {
            id: "4",
            name: "Từ Đại My...",
            avatar: "CA",
            lastMessage: "Minh Khôi: [Hình ảnh]",
            time: "9 giờ",
            isGroup: true,
        },
        {
            id: "5",
            name: "Angel Nguyễn",
            avatar: "AN",
            avatarUrl: "https://i.pravatar.cc/150?img=5",
            lastMessage: "Anh ơi ăn chưa?",
            time: "1 giờ",
            unread: true,
            isGroup: false,
        },
        {
            id: "6",
            name: "A. Tí",
            avatar: "AT",
            avatarUrl: "https://i.pravatar.cc/150?img=12",
            lastMessage: "Sáng mai mình gặp nhé",
            time: "2 giờ",
            isGroup: false,
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

    const plusMenu = [
        {
            id: "1",
            icon: <Plus size={20} color="gray" />,
            title: "Thêm bạn",
            route: "/contact/friend/add",
        },
        {
            id: "2",
            icon: <UsersRound size={20} color="gray" />,
            title: "Tạo nhóm",
        },
        {
            id: "3",
            icon: <Folder size={20} color="gray" />,
            title: "My Documents",
        },
        {
            id: "4",
            icon: <Calendar size={20} color="gray" />,
            title: "Lịch Zalo",
        },
        {
            id: "5",
            icon: <Video size={20} color="gray" />,
            title: "Tạo cuộc gọi nhóm",
        },
    ];

    const filteredConversations = conversations.filter((conversation) =>
        conversation.name
            .toLowerCase()
            .includes(searchText.toLowerCase().trim()),
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <Search size={26} color="white" />
                <TextInput
                    placeholder="Tìm kiếm"
                    placeholderTextColor="#93C5FD"
                    className="flex-1 text-white text-[16px] ml-3 opacity-80"
                    value={searchText}
                    onChangeText={setSearchText}
                />

                <TouchableOpacity
                    className="ml-3"
                    onPress={() => router.push("/message/qr-scanner" as any)}
                >
                    <ScanQrCode size={26} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="ml-3"
                    onPress={() => setShowMenu(!showMenu)}
                >
                    <Plus size={26} color="white" />
                </TouchableOpacity>
            </View>

            {/* Conversations List */}
            <ScrollView className="flex-1">
                {filteredConversations.map((conversation) => (
                    <TouchableOpacity
                        key={conversation.id}
                        onPress={() => {
                            const route = conversation.isGroup
                                ? "/message/group-chat/[id]"
                                : "/message/chat/[id]";
                            router.push({
                                pathname: route,
                                params: {
                                    id: conversation.id,
                                    name: conversation.name,
                                    avatar: conversation.avatarUrl
                                        ? conversation.avatarUrl
                                        : conversation.avatar,
                                },
                            });
                        }}
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    >
                        {/* Avatar */}
                        <View className="relative">
                            {conversation.avatarUrl ? (
                                <Image
                                    source={{ uri: conversation.avatarUrl }}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <View
                                    className={`w-12 h-12 rounded-full items-center justify-center ${getAvatarColor(
                                        conversation.avatar,
                                    )}`}
                                >
                                    <Text className="text-white font-semibold text-base">
                                        {conversation.avatar}
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

            <Modal visible={showMenu} transparent animationType="fade">
                <Pressable
                    className="flex-1 bg-black/20"
                    onPress={() => setShowMenu(false)}
                >
                    <View className="absolute top-16 right-3 bg-white rounded-xl w-56 shadow-lg">
                        {plusMenu.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                className={`px-4 py-3 flex-row items-center ${
                                    index !== 0
                                        ? "border-t border-gray-100"
                                        : ""
                                }`}
                                onPress={() => {
                                    if (item.route) {
                                        router.push(item.route as any);
                                    }
                                }}
                            >
                                {item.icon}
                                <Text className="text-base ml-1">
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
