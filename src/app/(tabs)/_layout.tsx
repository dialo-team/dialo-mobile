import { Tabs, usePathname } from "expo-router";
import { MessageCircle, UserRound, Users } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();

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
                    href: "/message",
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
                    href: "/contact",
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
                    href: "/profile",
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
