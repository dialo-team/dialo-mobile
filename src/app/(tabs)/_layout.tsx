import { Tabs, usePathname } from "expo-router";
import { Text, View } from "react-native";
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
                name="index"
                options={{
                    href: "/message",
                    tabBarLabel: "Tin nhan",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>💬</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="contacts"
                options={{
                    href: "/contact",
                    tabBarLabel: "Danh ba",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>📱</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    tabBarLabel: "Khám phá",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>⊞</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: "/profile",
                    tabBarLabel: "Ca nhan",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>👤</Text>
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
