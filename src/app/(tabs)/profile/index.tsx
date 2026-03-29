import { useRouter } from "expo-router";
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
import { useState } from "react";
import {
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

    // Nhóm các item thành các mảng con, mỗi mảng chứa tối đa 2 phần tử
    const chunkedMenuItems = [];
    for (let i = 0; i < menuItems.length; i += 2) {
        chunkedMenuItems.push(menuItems.slice(i, i + 2));
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-5 bg-blue-600">
                <View className="flex-row items-center">
                    <Search size={26} color="white" />
                    <TextInput
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#93C5FD"
                        className="flex-1 text-white text-[16px] ml-3 opacity-80 text-base"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity
                        onPress={() => router.push("/profile/setting" as any)}
                        className="ml-3"
                    >
                        <Settings size={26} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 bg-gray-100">
                {/* User Profile Card */}
                <TouchableOpacity
                    onPress={() => router.push("/profile/edit-profile" as any)}
                    className="bg-white mx-4 mt-4 rounded-lg p-4 flex-row items-center"
                >
                    <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
                        <Text className="text-white font-bold text-lg">TI</Text>
                    </View>
                    <View className="flex-1 ml-3">
                        <Text className="text-gray-900 font-semibold text-base">
                            Phan Nhất Tiến
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
                            className="mx-4 mb-[8px] bg-white rounded-lg overflow-hidden"
                        >
                            {chunk.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                        if (item.route) {
                                            router.push(item.route as any);
                                        }
                                    }}
                                    // p-4 để kích thước vùng touch bằng với Profile Card
                                    className={`p-4 flex-row items-center ${
                                        index === 0 && chunk.length > 1
                                            ? "border-b border-gray-100"
                                            : ""
                                    }`}
                                >
                                    {/* Icon */}
                                    <View
                                        className={`w-10 h-10 rounded-lg items-center justify-center ${item.bgColor}`}
                                    >
                                        <Text className="text-white text-xl">
                                            {item.icon}
                                        </Text>
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
                                        <Text className="text-gray-400 text-lg">
                                            <ChevronRight size={22} />
                                        </Text>
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
