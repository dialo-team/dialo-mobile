import { friendApi } from "@/src/api/friend/friendApi";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewFriendScreen() {
    const router = useRouter();
    // Cập nhật params để nhận thêm qrToken
    const params = useLocalSearchParams<{
        id?: string;
        qrToken?: string;
        name?: string;
        avatar?: string;
        cover?: string;
    }>();

    // State lưu giữ liệu hiển thị
    const [userData, setUserData] = useState({
        name: params.name,
        avatar: params.avatar,
        cover: params.cover,
    });

    // State quan trọng: Lưu lại userId thật sự (vì ban đầu nếu quét QR, ta chỉ có qrToken)
    const [actualUserId, setActualUserId] = useState<string | undefined>(
        params.id,
    );

    const [isRequested, setIsRequested] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- LẤY THÔNG TIN CHI TIẾT TỪ ID HOẶC QR TOKEN ---
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                let res;
                let data;

                if (params.qrToken) {
                    // Nếu có qrToken (từ quét QR), dùng API dành riêng cho QR
                    res = await friendApi.getUserByQrToken(params.qrToken);
                    data = res?.data || res;

                    // RẤT QUAN TRỌNG: Lưu lại ID thật sự của User để dùng cho việc kết bạn/check status
                    if (data?.id) setActualUserId(data.id);
                } else if (
                    params.id &&
                    (!userData.name || userData.name === "undefined")
                ) {
                    // Nếu chỉ có id mà chưa có name, gọi API lấy info (dự phòng)
                    res = await friendApi.getUserById(params.id);
                    data = res?.data || res;
                }

                if (data) {
                    setUserData({
                        name: data.userName || data.name || data.fullName,
                        avatar: data.avatarUrl || data.avatar,
                        cover:
                            data.backgroundUrl || data.background || data.cover,
                    });
                }
            } catch (error) {
                console.log("Lỗi lấy thông tin user:", error);
                Alert.alert("Lỗi", "Không thể lấy thông tin người dùng.");
            }
        };

        fetchUserInfo();
    }, [params.id, params.qrToken]);

    // --- KIỂM TRA TRẠNG THÁI KẾT BẠN DỰA TRÊN ACTUAL_USER_ID ---
    useFocusEffect(
        useCallback(() => {
            const checkFriendStatus = async () => {
                // Chờ cho đến khi lấy được actualUserId thì mới check
                if (!actualUserId) return;
                try {
                    const res = await friendApi.checkStatus(actualUserId);
                    const status = res?.status || res;
                    if (
                        status === "PENDING" ||
                        status === "REQUESTED" ||
                        status === "WAITING"
                    ) {
                        setIsRequested(true);
                    } else {
                        setIsRequested(false);
                    }
                } catch (error) {
                    console.log("Lỗi check status:", error);
                }
            };
            checkFriendStatus();
        }, [actualUserId]),
    );

    const handleToggleRequest = async () => {
        if (!actualUserId) return;
        setIsLoading(true);

        try {
            if (isRequested) {
                await friendApi.cancelFriendRequest(actualUserId);
                setIsRequested(false);
            } else {
                await friendApi.sendFriendRequest(actualUserId);
                setIsRequested(true);
            }
        } catch (error: any) {
            if (
                error.response?.status === 500 ||
                error.response?.status === 400
            ) {
                setIsRequested(true);
            } else {
                Alert.alert("Lỗi", "Không thể thực hiện thao tác lúc này.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (text: string) => {
        if (!text || text === "undefined") return "U";
        const words = text.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const isValidImage = (url: string | undefined) => {
        return url && url !== "undefined" && url.trim() !== "";
    };

    // ======================================================
    // UI GIỮ NGUYÊN 100%
    // ======================================================
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="absolute top-12 left-4 z-10">
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="h-52 bg-gray-300">
                {isValidImage(userData.cover) ? (
                    <Image
                        source={{ uri: userData.cover }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <Image
                        source={{ uri: "https://picsum.photos/600/400" }}
                        className="w-full h-full"
                    />
                )}
            </View>

            <View className="items-center -mt-16">
                {isValidImage(userData.avatar) ? (
                    <Image
                        source={{ uri: userData.avatar }}
                        className="w-28 h-28 rounded-full border-4 border-white"
                    />
                ) : (
                    <View className="w-28 h-28 rounded-full bg-teal-400 border-4 border-white items-center justify-center">
                        <Text className="text-white text-3xl font-bold">
                            {getInitials(userData.name || "")}
                        </Text>
                    </View>
                )}

                <Text className="text-2xl font-bold mt-3 text-gray-900">
                    {userData.name && userData.name !== "undefined"
                        ? userData.name
                        : "Người dùng"}
                </Text>

                <Text className="text-gray-500 text-center px-6 mt-2">
                    {isRequested
                        ? `Lời mời kết bạn đã được gửi đi. Hãy để lại tin nhắn cho ${userData.name && userData.name !== "undefined" ? userData.name : "người này"} trong lúc đợi chờ nhé!`
                        : `Bạn và ${userData.name && userData.name !== "undefined" ? userData.name : "người này"} chưa là bạn bè.`}
                </Text>

                <View className="flex-row mt-6 px-4 w-full">
                    <TouchableOpacity className="flex-1 bg-blue-100 py-3.5 rounded-full items-center mr-2">
                        <Text className="text-blue-600 font-semibold text-base">
                            Nhắn tin
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        disabled={isLoading}
                        onPress={handleToggleRequest}
                        className={`flex-1 py-3.5 rounded-full items-center ml-2 ${isRequested ? "bg-gray-200" : "bg-blue-600"}`}
                    >
                        <Text
                            className={`font-semibold text-base ${isRequested ? "text-gray-800" : "text-white"}`}
                        >
                            {isLoading
                                ? "Đang tải..."
                                : isRequested
                                  ? "Huỷ lời mời"
                                  : "Thêm bạn"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
