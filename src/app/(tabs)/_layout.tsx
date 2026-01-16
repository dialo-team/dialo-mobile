import { Tabs } from "expo-router";
import { Text, View } from "react-native";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "white",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                    height: 60,
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
                    tabBarLabel: "Tin nhắn",
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
                    tabBarLabel: "Danh bạ",
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
                name="timeline"
                options={{
                    tabBarLabel: "Nhật ký",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center">
                            <Text style={{ fontSize: 24, color }}>🕐</Text>
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
                            <Text style={{ fontSize: 24, color }}>👤</Text>
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
