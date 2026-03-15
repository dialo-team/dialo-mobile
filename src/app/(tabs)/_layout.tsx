import { Tabs } from "expo-router";
import { BookSearch, MessageCircle, User, Users } from "lucide-react-native";
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
                name="message/index"
                options={{
                    tabBarLabel: "Tin nhắn",
                    tabBarIcon: ({ color }) => (
                        <MessageCircle size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="contact/index"
                options={{
                    tabBarLabel: "Danh bạ",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Users size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="discover/index"
                options={{
                    tabBarLabel: "Khám phá",
                    tabBarIcon: ({ color }) => (
                        <BookSearch size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    tabBarLabel: "Cá nhân",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <User size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/edit-profile/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile/account-security/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile/privacy/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile/setting/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="contact/friend/add/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="contact/friend/new/index"
                options={{
                    href: null,
                    tabBarStyle: { display: "none" },
                }}
            />
            <Tabs.Screen
                name="message/qr-scanner/index"
                options={{
                    href: null,
                    tabBarStyle: { display: "none" },
                }}
            />
        </Tabs>
    );
}
