import { friendApi } from "@/src/api/friend/friendApi";
import { userApi } from "@/src/api/user/userApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewFriendScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string;
        qrToken?: string;
        name?: string;
        avatar?: string;
        cover?: string;
    }>();

    // State dữ liệu hiển thị người dùng (TK2)
    const [userData, setUserData] = useState({
        name: pickBestDisplayName([params.name], "Nguoi dung"),
        avatar: params.avatar,
        cover: params.cover,
    });

    // ID thật sự của người đang được xem
    const [actualUserId, setActualUserId] = useState<string | undefined>(
        params.id,
    );

    const [myId, setMyId] = useState<string | null>(null);

    const [isRequested, setIsRequested] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Lấy ID của chính mình để so sánh tránh trường hợp tự kết bạn sau khi Edit Profile
    useEffect(() => {
        const getMyProfile = async () => {
            try {
                const res = await userApi.getProfile();
                const data = res?.data || res;
                if (data?.id) setMyId(data.id);
            } catch (e) {
                console.log("Lỗi lấy profile cá nhân:", e);
            }
        };
        getMyProfile();
    }, []);

    // 2. Lấy thông tin chi tiết người được xem từ ID hoặc QR Token
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                let data;
                if (params.qrToken) {
                    //
                    const res = await friendApi.getUserByQrToken(
                        params.qrToken,
                    );
                    // Kiểm tra cấu trúc thực tế của response
                    data = res?.data || res;

                    console.log("=== THÔNG TIN USER TỪ QR ===");
                    console.log(JSON.stringify(data, null, 2));

                    // Cập nhật ID dựa trên log thực tế.
                    // Nếu log in ra { "userId": "..." } thì phải dùng data.userId
                    if (data?.id) {
                        setActualUserId(data.id);
                    } else if (data?.userId) {
                        setActualUserId(data.userId);
                    }
                } else if (params.id) {
                    //
                    const res = await friendApi.getUserById(params.id);
                    data = res?.data || res;
                    if (data?.id) setActualUserId(data.id);
                }

                if (data) {
                    setUserData({
                        name:
                            data.userName ||
                            data.username ||
                            data.name ||
                            data.displayName ||
                            data.nickName ||
                            data.nickname ||
                            data.fullName ||
                            "Người dùng",
                        avatar:
                            data.avatarUrl ||
                            data.avatar ||
                            data.profilePictureUrl ||
                            data.profilePicture ||
                            data.photoUrl ||
                            data.imageUrl ||
                            "",
                        cover:
                            data.backgroundUrl ||
                            data.background ||
                            data.coverUrl ||
                            data.cover ||
                            "",
                    });
                }
            } catch (error) {
                console.log("Lỗi lấy thông tin chi tiết:", error);
                Alert.alert(
                    "Lỗi",
                    "Không thể lấy thông tin chi tiết của người dùng này.",
                );
            }
        };
        fetchUserInfo();
    }, [params.id, params.qrToken]);

    // 3. Cập nhật trạng thái nút mỗi khi màn hình được Focus
    useFocusEffect(
        useCallback(() => {
            const checkFriendStatus = async () => {
                if (!actualUserId || !myId) return;

                // Nếu đang ở trang của chính mình, không cần check friend status
                if (actualUserId === myId) return;

                try {
                    const res = await friendApi.checkStatus(actualUserId);
                    const status = res?.status || res;

                    setIsRequested(
                        status === "PENDING" ||
                            status === "REQUESTED" ||
                            status === "WAITING",
                    );
                    setIsFriend(status === "FRIEND");
                } catch (error) {
                    console.log("Lỗi check status:", error);
                }
            };
            checkFriendStatus();
        }, [actualUserId, myId]),
    );

    // Trong NewFriendScreen.tsx
    // Trong NewFriendScreen.tsx
    const handleToggleRequest = async () => {
        if (!actualUserId) return;

        setIsLoading(true);
        try {
            if (isRequested) {
                await friendApi.cancelFriendRequest(actualUserId);
                setIsRequested(false);
            } else {
                // TRUYỀN THÊM LỜI NHẮN ĐỂ KHỚP SWAGGER
                await friendApi.sendFriendRequest(
                    actualUserId,
                    "Chào bạn, mình muốn kết bạn!",
                );
                setIsRequested(true);
            }
        } catch (error: any) {
            // Nếu lỗi 500, in toàn bộ error.response.data để xem Backend báo lỗi gì ở DB
            console.log("Lỗi Server:", error.response?.data);
            Alert.alert(
                "Lỗi",
                "Thao tác thất bại. Vui lòng kiểm tra lại ID người dùng.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const isValidImage = (url: string | undefined) =>
        url && url !== "undefined" && url.trim() !== "";

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="absolute top-12 left-4 z-10">
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="h-52 bg-gray-300">
                <Image
                    source={{
                        uri: isValidImage(userData.cover)
                            ? userData.cover
                            : "https://picsum.photos/600/400",
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
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
                    {actualUserId === myId
                        ? "Đây là trang cá nhân của bạn."
                        : isFriend
                          ? "Hai bạn đã là bạn bè."
                          : isRequested
                            ? "Đã gửi lời mời kết bạn. Đang chờ phản hồi..."
                            : `Bạn và ${userData.name || "người này"} chưa là bạn bè.`}
                </Text>

                <View className="flex-row mt-6 px-4 w-full">
                    <TouchableOpacity className="flex-1 bg-blue-100 py-3.5 rounded-full items-center mr-2">
                        <Text className="text-blue-600 font-semibold text-base">
                            Nhắn tin
                        </Text>
                    </TouchableOpacity>

                    {actualUserId === myId ? (
                        <TouchableOpacity
                            onPress={() =>
                                router.push("/me/edit-profile" as any)
                            }
                            className="flex-1 py-3.5 rounded-full items-center ml-2 bg-gray-200"
                        >
                            <Text className="font-semibold text-base text-gray-800">
                                Sửa Profile
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            disabled={isLoading || isFriend}
                            onPress={handleToggleRequest}
                            className={`flex-1 py-3.5 rounded-full items-center ml-2 ${isRequested ? "bg-gray-200" : isFriend ? "bg-green-100" : "bg-blue-600"}`}
                        >
                            <Text
                                className={`font-semibold text-base ${isRequested || isFriend ? "text-gray-800" : "text-white"}`}
                            >
                                {isLoading
                                    ? "..."
                                    : isFriend
                                      ? "Bạn bè"
                                      : isRequested
                                        ? "Huỷ lời mời"
                                        : "Thêm bạn"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
