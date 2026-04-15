import { Tabs } from "expo-router";
import { MessageCircle, UserRound, Users } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "white",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                    height: 60 + insets.bottom, // Áp dụng dữ liệu đó vào đây
                    paddingBottom: 8 + insets.bottom,
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
