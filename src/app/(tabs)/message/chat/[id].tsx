import { useLocalSearchParams, useRouter } from "expo-router";
import {
    CheckCircle,
    Clock,
    Copy,
    // Import thêm các icon cho menu thao tác
    CornerUpLeft,
    CornerUpRight,
    Ellipsis,
    FolderDown,
    Image,
    MessageSquarePlus,
    MoreHorizontal,
    MoveLeft,
    Phone,
    Pin,
    RotateCcw,
    Send,
    Smile,
    Trash2,
    Video,
} from "lucide-react-native";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Image as RNImage,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity, // <-- Thêm import Modal
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
    const router = useRouter();
    const { id, name, avatar } = useLocalSearchParams();
    const avatarUrl =
        typeof avatar === "string" &&
        (avatar.startsWith("http://") || avatar.startsWith("https://"))
            ? avatar
            : null;
    const [isFocused, setIsFocused] = useState(false);
    const [message, setMessage] = useState("");

    // State quản lý tin nhắn đang được nhấn giữ để hiện Modal
    const [selectedMessage, setSelectedMessage] = useState(null);

    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello bạn",
            type: "left",
            time: "11:30",
            isUnsent: false,
        },
        {
            id: 2,
            text: "Lâu rùi hỏng gặp",
            type: "right",
            time: "11:32",
            isUnsent: false,
        },
        {
            id: 3,
            text: "dạo này khoẻ hong",
            type: "left",
            time: "11:33",
            isUnsent: false,
        },
    ]);

    const handleSend = () => {
        if (message.trim() === "") return;

        const newMessage = {
            id: Date.now(),
            text: message,
            type: "right",
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setMessages([...messages, newMessage]);
        setMessage("");
    };

    // Danh sách menu action
    const actionMenuItems = [
        { id: 1, icon: CornerUpLeft, label: "Trả lời", color: "#8b5cf6" },
        { id: 2, icon: CornerUpRight, label: "Chuyển tiếp", color: "#3b82f6" },
        {
            id: 3,
            icon: FolderDown,
            label: "Lưu My\nDocuments",
            color: "#0ea5e9",
        },
        { id: 4, icon: RotateCcw, label: "Thu hồi", color: "#f97316" },
        { id: 5, icon: Copy, label: "Sao chép", color: "#3b82f6" },
        { id: 6, icon: Pin, label: "Ghim", color: "#f97316" },
        { id: 7, icon: Clock, label: "Nhắc hẹn", color: "#ef4444" },
        { id: 8, icon: CheckCircle, label: "Chọn nhiều", color: "#3b82f6" },
        {
            id: 9,
            icon: MessageSquarePlus,
            label: "Tạo tin\nnhắn nhanh",
            color: "#0ea5e9",
        },
        { id: 10, icon: Trash2, label: "Xóa", color: "#ef4444" },
    ];

    const [unsendMessageState, setUnsendMessageState] = useState(null);
    const handleUnsendMessage = () => {
        if (selectedMessage) {
            // Cập nhật lại mảng messages, đổi text của tin nhắn đang chọn
            const updatedMessages = messages.map((msg) =>
                msg.id === selectedMessage.id
                    ? {
                          ...msg,
                          text: "Tin nhắn đã được thu hồi",
                          isUnsent: true,
                      }
                    : msg,
            );

            setMessages(updatedMessages);
            setUnsendMessageState(selectedMessage); // Lưu lại log nếu cần theo state bạn yêu cầu
            setSelectedMessage(null); // Đóng Modal
        }
    };
    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* HEADER */}
                <View className="bg-blue-600 flex-row items-center px-4 py-3 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <MoveLeft size={26} color="white" />
                        </TouchableOpacity>

                        <View className="ml-3">
                            <Text className="text-white font-semibold text-[16px]">
                                {name}
                            </Text>
                            <Text className="text-white text-[12px] opacity-80">
                                Truy cập 4 giờ trước
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center ml-9">
                        <TouchableOpacity>
                            <Phone size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 10 }}>
                            <Video size={26} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() =>
                                router.push({
                                    pathname:
                                        "/(tabs)/message/option/account-option",
                                    params: { id, name, avatar },
                                })
                            }
                        >
                            <MoreHorizontal size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CHAT BODY */}
                <ScrollView
                    className="flex-1 px-3 pt-4"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => {
                        if (msg.type === "left") {
                            return (
                                <View key={msg.id} className="flex-row mb-3">
                                    {avatarUrl ? (
                                        <RNImage
                                            source={{ uri: avatarUrl }}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                    ) : (
                                        <View className="w-8 h-8 rounded-full bg-blue-500 mr-2 items-center justify-center">
                                            <Text className="text-white text-xs font-semibold">
                                                {typeof avatar === "string"
                                                    ? avatar
                                                          .slice(0, 2)
                                                          .toUpperCase()
                                                    : "?"}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Đổi thành TouchableOpacity để bắt sự kiện onLongPress */}
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onLongPress={() =>
                                            setSelectedMessage(msg)
                                        }
                                        className="bg-white px-4 py-2 rounded-2xl max-w-[70%]"
                                    >
                                        <Text
                                            className={`text-[15px] ${msg.isUnsent ? "text-gray-400 italic" : "text-black"}`}
                                        >
                                            {msg.text}
                                        </Text>
                                        {!msg.isUnsent && (
                                            <Text className="text-gray-500 text-[11px] mt-1">
                                                {msg.time}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        return (
                            <View
                                key={msg.id}
                                className="flex-row justify-end mb-3"
                            >
                                {/* Đổi thành TouchableOpacity để bắt sự kiện onLongPress */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onLongPress={() => setSelectedMessage(msg)}
                                    className="bg-[#cde7f4] px-4 py-2 rounded-2xl max-w-[70%]"
                                >
                                    <Text
                                        className={`text-[15px] ${msg.isUnsent ? "text-gray-400 italic" : "text-black"}`}
                                    >
                                        {msg.text}
                                    </Text>
                                    {!msg.isUnsent && (
                                        <Text className="text-gray-500 text-[11px] mt-1 text-right">
                                            {msg.time}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    <View className="h-6" />
                </ScrollView>

                {/* INPUT BAR */}
                <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-center">
                    <TouchableOpacity className="mr-2">
                        <Smile size={26} color="#666" />
                    </TouchableOpacity>

                    <TextInput
                        placeholder="Tin nhắn"
                        value={message}
                        onChangeText={setMessage}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-[15px]"
                    />
                    {!isFocused && (
                        <>
                            <TouchableOpacity className="ml-2">
                                <Ellipsis size={26} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity className="ml-2">
                                <Image size={26} color="#666" />
                            </TouchableOpacity>
                        </>
                    )}

                    {isFocused && (
                        <TouchableOpacity className="ml-2" onPress={handleSend}>
                            <Send size={26} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* MODAL MENU KHI NHẤN GIỮ TIN NHẮN */}
            <Modal
                visible={!!selectedMessage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setSelectedMessage(null)}
                >
                    <View className="flex-1 bg-black/40 justify-center items-center px-4">
                        <TouchableWithoutFeedback>
                            <View className="w-full max-w-[360px]">
                                {/* Dãy Reaction Cảm xúc */}
                                <View className="bg-white rounded-full flex-row px-4 py-3 mb-3 justify-between shadow-sm">
                                    {["❤️", "👍", "😆", "😮", "😢", "😡"].map(
                                        (emoji) => (
                                            <TouchableOpacity
                                                key={emoji}
                                                onPress={() =>
                                                    setSelectedMessage(null)
                                                }
                                            >
                                                <Text className="text-3xl">
                                                    {emoji}
                                                </Text>
                                            </TouchableOpacity>
                                        ),
                                    )}
                                </View>

                                {/* Bảng Action Menu */}
                                <View className="bg-white rounded-3xl p-4 shadow-sm flex-row flex-wrap">
                                    {actionMenuItems.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            className="w-[25%] items-center mb-5"
                                            onPress={() => {
                                                // Nếu nhấn Thu hồi thì gọi hàm, ngược lại thì đóng menu
                                                if (item.label === "Thu hồi") {
                                                    handleUnsendMessage();
                                                } else {
                                                    setSelectedMessage(null);
                                                }
                                            }}
                                        >
                                            <View className="relative mb-2">
                                                <item.icon
                                                    size={28}
                                                    color={item.color}
                                                    strokeWidth={1.5}
                                                />
                                                {item.badge && (
                                                    <View className="absolute -top-3 -right-6 bg-green-600 px-[4px] py-[2px] rounded-sm">
                                                        <Text className="text-white text-[8px] font-bold">
                                                            {item.badge}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text className="text-xs text-center text-gray-700">
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}
