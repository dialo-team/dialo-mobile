import { Video as AVVideo, ResizeMode } from "expo-av"; // <-- THÊM THƯ VIỆN VIDEO CỦA EXPO
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    CornerUpLeft,
    Ellipsis,
    FolderDown, // <-- THÊM ICON LIKE
    Heart,
    Image, // <-- THÊM ICON LOVE
    Laugh, // <-- THÊM ICON EMOTION
    MoreHorizontal,
    MoveLeft,
    Phone,
    RotateCcw,
    Send,
    Smile, // Icon Video từ lucide
    ThumbsUp,
    Trash2,
    Video,
} from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Image as RNImage,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function paramStr(v: string | string[] | undefined): string | undefined {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v[0] != null) return v[0];
    return undefined;
}

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        from?: string | string[];
    }>();
    const id = paramStr(params.id);
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);
    const from = paramStr(params.from);
    const avatarUrl =
        typeof avatar === "string" &&
        (avatar.startsWith("http://") || avatar.startsWith("https://"))
            ? avatar
            : null;
    const [isFocused, setIsFocused] = useState(false);
    const [message, setMessage] = useState("");

    // State quản lý Emoji Menu
    const [showEmojiMenu, setShowEmojiMenu] = useState(false);

    // State quản lý tin nhắn đang được nhấn giữ để hiện Modal Action Menu
    const [selectedMessage, setSelectedMessage] = useState(null);

    // State quản lý tin nhắn hình ảnh/video đang được xem phóng to
    const [viewingMediaMessage, setViewingMediaMessage] = useState(null);

    const [showHeader, setShowHeader] = useState(true);
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

    // Hàm xử lý chọn emoji
    const handleEmojiSelect = (emojiText: string) => {
        setMessage((prev) => prev + emojiText);
        setShowEmojiMenu(false);
    };

    // Hàm xử lý chọn ảnh/video từ máy
    const handlePickMedia = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(
                "Cần cấp quyền",
                "Bạn cần cho phép ứng dụng truy cập thư viện ảnh để có thể gửi hình/video.",
                [{ text: "Đã hiểu" }],
            );
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const isVideo = asset.type === "video"; // Kiểm tra xem file là video hay ảnh

            const newMediaMessage = {
                id: Date.now(),
                text: "",
                imageUri: !isVideo ? asset.uri : null, // Lưu ảnh
                videoUri: isVideo ? asset.uri : null, // Lưu video
                type: "right",
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setMessages([...messages, newMediaMessage]);
        }
    };

    // Danh sách menu action
    const actionMenuItems = [
        { id: 1, icon: CornerUpLeft, label: "Trả lời", color: "#8b5cf6" },
        {
            id: 2,
            icon: FolderDown,
            label: "Lưu My\nDocuments",
            color: "#0ea5e9",
        },
        { id: 3, icon: RotateCcw, label: "Thu hồi", color: "#f97316" },
        { id: 4, icon: Trash2, label: "Xóa", color: "#ef4444" },
    ];

    const handleUnsendMessage = () => {
        if (selectedMessage) {
            const updatedMessages = messages.map((msg) =>
                msg.id === selectedMessage.id
                    ? {
                          ...msg,
                          text: "Tin nhắn đã được thu hồi",
                          imageUri: null,
                          videoUri: null, // Thu hồi thì xóa luôn data video
                          isUnsent: true,
                      }
                    : msg,
            );
            setMessages(updatedMessages);
            setSelectedMessage(null);
        }
    };

    const handleHeaderBack = () => {
        if (from === "contact") {
            router.replace("/(tabs)/contact" as any);
            return;
        }
        if (from === "friend" && id) {
            router.replace({
                pathname: "/(tabs)/contact/friend/[id]" as any,
                params: {
                    id,
                    ...(name != null ? { name } : {}),
                    ...(avatar != null ? { avatar } : {}),
                },
            });
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/(tabs)/message" as any);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
            >
                {/* HEADER */}
                <View className="bg-blue-600 flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={handleHeaderBack}>
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

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            if (msg.imageUri || msg.videoUri)
                                                setViewingMediaMessage(
                                                    msg as any,
                                                );
                                        }}
                                        onLongPress={() =>
                                            setSelectedMessage(msg as any)
                                        }
                                        className="bg-white px-4 py-2 rounded-2xl max-w-[70%]"
                                    >
                                        {/* HIỂN THỊ ẢNH HOẶC VIDEO */}
                                        {msg.videoUri ? (
                                            <View
                                                style={{
                                                    width: 150,
                                                    height: 150,
                                                    borderRadius: 10,
                                                    marginBottom: 4,
                                                    overflow: "hidden",
                                                    backgroundColor: "black",
                                                }}
                                            >
                                                <AVVideo
                                                    source={{
                                                        uri: msg.videoUri,
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                    }}
                                                    resizeMode={
                                                        ResizeMode.COVER
                                                    }
                                                    shouldPlay={false} // Không tự phát trong bong bóng chat
                                                />
                                                {/* Nút Play đè lên video */}
                                                <View
                                                    style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        justifyContent:
                                                            "center",
                                                        alignItems: "center",
                                                        backgroundColor:
                                                            "rgba(0,0,0,0.3)",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: "white",
                                                            fontSize: 30,
                                                        }}
                                                    >
                                                        ▶
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : msg.imageUri ? (
                                            <RNImage
                                                source={{ uri: msg.imageUri }}
                                                style={{
                                                    width: 150,
                                                    height: 150,
                                                    borderRadius: 10,
                                                    marginBottom: 4,
                                                }}
                                                resizeMode="cover"
                                            />
                                        ) : null}

                                        {msg.text !== "" && (
                                            <Text
                                                className={`text-[15px] ${msg.isUnsent ? "text-gray-400 italic" : "text-black"}`}
                                            >
                                                {msg.text}
                                            </Text>
                                        )}
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
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (msg.imageUri || msg.videoUri)
                                            setViewingMediaMessage(msg as any);
                                    }}
                                    onLongPress={() =>
                                        setSelectedMessage(msg as any)
                                    }
                                    className="bg-[#cde7f4] px-4 py-2 rounded-2xl max-w-[70%]"
                                >
                                    {/* HIỂN THỊ ẢNH HOẶC VIDEO */}
                                    {msg.videoUri ? (
                                        <View
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: 10,
                                                marginBottom: 4,
                                                overflow: "hidden",
                                                backgroundColor: "black",
                                            }}
                                        >
                                            <AVVideo
                                                source={{ uri: msg.videoUri }}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                                resizeMode={ResizeMode.COVER}
                                                shouldPlay={false} // Không tự phát trong bong bóng chat
                                            />
                                            {/* Nút Play đè lên video */}
                                            <View
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    backgroundColor:
                                                        "rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: "white",
                                                        fontSize: 30,
                                                    }}
                                                >
                                                    ▶
                                                </Text>
                                            </View>
                                        </View>
                                    ) : msg.imageUri ? (
                                        <RNImage
                                            source={{ uri: msg.imageUri }}
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: 10,
                                                marginBottom: 4,
                                            }}
                                            resizeMode="cover"
                                        />
                                    ) : null}

                                    {msg.text !== "" && (
                                        <Text
                                            className={`text-[15px] ${msg.isUnsent ? "text-gray-400 italic" : "text-black"}`}
                                        >
                                            {msg.text}
                                        </Text>
                                    )}
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
                    {/* BỌC NÚT SMILE TRONG VIEW RELATIVE ĐỂ HIỂN THỊ EMOJI MENU */}
                    <View className="relative z-50">
                        {showEmojiMenu && (
                            <View
                                className="absolute bottom-12 -left-2 bg-white rounded-full shadow-lg border border-gray-200 flex-row px-3 py-2 items-center"
                                style={{ elevation: 5 }}
                            >
                                <TouchableOpacity
                                    onPress={() => handleEmojiSelect("👍")}
                                    className="mx-2"
                                >
                                    <ThumbsUp size={24} color="#0084ff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleEmojiSelect("❤️")}
                                    className="mx-2"
                                >
                                    <Heart size={24} color="#ff2d55" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleEmojiSelect("😂")}
                                    className="mx-2"
                                >
                                    <Laugh size={24} color="#f5b027" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity
                            className="mr-2"
                            onPress={() => setShowEmojiMenu(!showEmojiMenu)}
                        >
                            <Smile size={26} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        placeholder="Tin nhắn"
                        value={message}
                        onChangeText={setMessage}
                        onFocus={() => {
                            setIsFocused(true);
                            setShowEmojiMenu(false); // Ẩn emoji menu khi bắt đầu gõ
                        }}
                        onBlur={() => setIsFocused(false)}
                        className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-[15px]"
                    />
                    {!isFocused && (
                        <>
                            <TouchableOpacity className="ml-2">
                                <Ellipsis size={26} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="ml-2"
                                onPress={handlePickMedia}
                            >
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

            {/* MODAL XEM ẢNH/VIDEO PHÓNG TO */}
            <Modal
                visible={!!viewingMediaMessage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewingMediaMessage(null)}
            >
                {viewingMediaMessage && (
                    <View className="flex-1 bg-black justify-center items-center">
                        {/* HEADER */}
                        {showHeader && (
                            <View className="absolute top-0 w-full bg-black/60 z-10 px-5 pt-14 pb-4">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-white text-[17px] font-semibold">
                                            {(viewingMediaMessage as any)
                                                .type === "right"
                                                ? "Bạn"
                                                : name}
                                        </Text>
                                        <Text className="text-white/70 text-[12px] mt-0.5">
                                            Đã gửi{" "}
                                            {(viewingMediaMessage as any).time}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        className="bg-white/10 p-2 rounded-full px-4"
                                        onPress={() =>
                                            setViewingMediaMessage(null)
                                        }
                                    >
                                        <Text className="text-white text-base font-semibold">
                                            Đóng
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* KIỂM TRA ĐỂ RENDER VIDEO HOẶC ẢNH */}
                        <TouchableWithoutFeedback
                            onPress={() => setShowHeader(!showHeader)}
                        >
                            <View className="w-full h-full">
                                {(viewingMediaMessage as any).videoUri ? (
                                    <AVVideo
                                        source={{
                                            uri: (viewingMediaMessage as any)
                                                .videoUri,
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        resizeMode={ResizeMode.CONTAIN}
                                        useNativeControls={true}
                                        shouldPlay={true}
                                    />
                                ) : (
                                    <RNImage
                                        source={{
                                            uri: (viewingMediaMessage as any)
                                                .imageUri,
                                        }}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}
