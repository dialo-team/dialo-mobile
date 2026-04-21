import { Tabs, usePathname } from "expo-router"; // 1. Import thêm usePathname
import { MessageCircle, UserRound, Users } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const pathname = usePathname(); // 2. Lấy đường dẫn hiện tại của app

    // Kiểm tra xem đường dẫn có chứa chữ "/chat" không (đường dẫn vào ChatScreen của bạn)
    const isChatScreen = pathname.includes("/chat");
    const isGroupChatScreen = pathname.includes("/group-chat");
    const isQRScreen = pathname.includes("/qr");

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    display:
                        isChatScreen || isGroupChatScreen || isQRScreen
                            ? "none"
                            : "flex",
                    backgroundColor: "white",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                    height: 60 + insets.bottom,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: "#2563EB",
                tabBarInactiveTintColor: "#9CA3AF",
            }}
        >
            <Tabs.Screen
                name="message"
                options={{
                    tabBarLabel: "Tin nhắn",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <MessageCircle size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="contact"
                options={{
                    tabBarLabel: "Danh bạ",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Users size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarLabel: "Cá nhân",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <UserRound size={22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
