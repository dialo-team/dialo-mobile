import { userApi } from "@/src/api/user/userApi"; // Thêm import API
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useFocusEffect, useRouter } from "expo-router";
import {
    ChevronRight,
    Cloudy,
    Folder,
    LockKeyhole,
    Search,
    Settings,
    Shield,
    Smartphone,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItem = {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    bgColor: string;
    showArrow?: boolean;
    route?: string;
};

export default function ProfileScreen() {
    const [searchText, setSearchText] = useState("");
    const router = useRouter();

    // State lưu thông tin user
    const [userName, setUserName] = useState("Đang tải...");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Dùng useFocusEffect để tự động reload data mỗi khi quay lại tab này
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const profile = await userApi.getProfile();

                    // IN LOG RA ĐỂ KIỂM TRA BE TRẢ VỀ TÊN BIẾN LÀ GÌ
                    console.log("Dữ liệu Profile từ BE:", profile);

                    if (profile) {
                        setUserName(
                            pickBestDisplayName(
                                [
                                    profile.userName,
                                    profile.username,
                                    profile.name,
                                    profile.displayName,
                                    profile.nickName,
                                    profile.nickname,
                                    profile.fullName,
                                ],
                                "Nguoi dung",
                            ),
                        );

                        // Phòng hờ BE trả về 'avatarUrl' hoặc 'avatar'
                        setAvatarUrl(
                            profile.avatarUrl ||
                                profile.avatar ||
                                profile.profilePictureUrl ||
                                profile.profilePicture ||
                                profile.photoUrl ||
                                profile.imageUrl ||
                                null,
                        );
                    }
                } catch (error) {
                    console.log("Lỗi lấy profile:", error);
                }
            };
            fetchProfile();
        }, []),
    );

    const menuItems: MenuItem[] = [
        {
            id: "1",
            icon: <Cloudy size={24} color="blue" />,
            title: "zCloud",
            subtitle: "Không gian lưu trữ dữ liệu trên đám mây",
            bgColor: "bg-white",
            showArrow: true,
        },
        {
            id: "2",
            icon: <Folder size={24} color="blue" />,
            title: "My Documents",
            subtitle: "Lưu trữ các tài liệu quan trọng",
            bgColor: "bg-white",
            showArrow: true,
        },
        {
            id: "3",
            icon: <Smartphone size={24} color="blue" />,
            title: "Ví QR",
            subtitle: "Lưu trữ và xuất trình các mã QR quan trọng",
            bgColor: "bg-white",
            showArrow: true,
        },
        {
            id: "4",
            icon: <Shield size={24} color="blue" />,
            title: "Tài khoản và bảo mật",
            subtitle: "",
            bgColor: "bg-white",
            showArrow: true,
            route: "/profile/account-security",
        },
        {
            id: "5",
            icon: <LockKeyhole size={24} color="blue" />,
            title: "Quyền riêng tư",
            subtitle: "",
            bgColor: "bg-white",
            showArrow: true,
            route: "/profile/privacy",
        },
    ];

    const chunkedMenuItems = [];
    for (let i = 0; i < menuItems.length; i += 2) {
        chunkedMenuItems.push(menuItems.slice(i, i + 2));
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="px-4 pt-4 pb-5 bg-blue-600">
                <View className="flex-row items-center bg-blue-500/40 rounded-xl px-3 h-11">
                    <Search size={26} color="white" />
                    <TextInput
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#93C5FD"
                        className="flex-1 text-white text-[16px] ml-3 opacity-90"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity
                        onPress={() => router.push("/profile/setting" as any)}
                        className="ml-3"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Settings size={26} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 bg-slate-50"
                showsVerticalScrollIndicator={false}
            >
                {/* User Profile Card */}
                <TouchableOpacity
                    onPress={() => router.push("/profile/edit-profile" as any)}
                    className="bg-white mx-4 mt-4 rounded-2xl p-4 flex-row items-center shadow-sm"
                    activeOpacity={0.8}
                >
                    {/* KHU VỰC HIỂN THỊ AVATAR HOẶC CHỮ CÁI ĐẦU */}
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            className="w-12 h-12 rounded-full"
                        />
                    ) : (
                        <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
                            <Text className="text-white font-bold text-lg">
                                {getInitials(userName)}
                            </Text>
                        </View>
                    )}

                    <View className="flex-1 ml-3">
                        <Text className="text-gray-900 font-semibold text-base">
                            {userName}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                            Xem trang cá nhân
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Menu Items */}
                <View className="mt-5">
                    {chunkedMenuItems.map((chunk, chunkIndex) => (
                        <View
                            key={chunkIndex}
                            className="mx-4 mb-[10px] bg-white rounded-2xl overflow-hidden"
                        >
                            {chunk.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                        if (item.route) {
                                            router.push(item.route as any);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    className={`p-4 flex-row items-center ${
                                        index === 0 && chunk.length > 1
                                            ? "border-b border-gray-100"
                                            : ""
                                    }`}
                                >
                                    {/* Icon */}
                                    <View className="w-10 h-10 rounded-lg items-center justify-center bg-blue-50">
                                        {item.icon}
                                    </View>

                                    {/* Content */}
                                    <View className="flex-1 ml-3">
                                        <Text className="text-gray-900 font-medium text-base">
                                            {item.title}
                                        </Text>
                                        {item.subtitle ? (
                                            <Text className="text-gray-500 text-xs mt-1">
                                                {item.subtitle}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Arrow */}
                                    {item.showArrow && (
                                        <ChevronRight
                                            size={22}
                                            color="#9CA3AF"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
