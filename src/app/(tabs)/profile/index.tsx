import { useRouter } from "expo-router";
import {
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
            subtitle: "Lưu trữ các tài nhạn quan trọng",
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

    const filteredMenuItems = menuItems.filter((item) =>
        item.title.toLowerCase().includes(searchText.toLowerCase().trim()),
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <Search size={24} color="white" />
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
                    <Settings size={25} color="white" />
                </TouchableOpacity>
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
                <View className="mt-7">
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                                if (item.route) {
                                    router.push(item.route as any);
                                }
                            }}
                            className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
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
                                {item.subtitle && (
                                    <Text className="text-gray-500 text-xs mt-1">
                                        {item.subtitle}
                                    </Text>
                                )}
                            </View>

                            {/* Arrow */}
                            {item.showArrow && (
                                <Text className="text-gray-400 text-lg">›</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
