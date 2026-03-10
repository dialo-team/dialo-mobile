import { Tabs } from "expo-router";
import { Text, View } from "react-native";
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
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>💬</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="contact/index"
                options={{
                    tabBarLabel: "Danh bạ",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>📱</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="discover/index"
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
                name="profile/index"
                options={{
                    tabBarLabel: "Cá nhân",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>👤</Text>
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
                name="contact/add-friend/index"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
