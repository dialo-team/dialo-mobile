import "@/global.css";
import { clearAuthData } from "@/src/api/auth/authStorage";
import storage from "@/src/api/auth/storage";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerGlobals } from "@livekit/react-native";

registerGlobals();

if (typeof global.Event === "undefined") {
    global.Event = class Event {} as any;
}

export default function RootLayout() {
    const router = useRouter();

    // ⚠️ TEMP: xoá token/phiên cũ đang lưu (localStorage trên web, SecureStore trên phone)
    // rồi đưa về màn hình đầu (login/register). Chạy 1 lần xong GỠ block này ra.
    useEffect(() => {
        (async () => {
            await clearAuthData();
            await storage.clear();
            console.log("[TEMP] Đã xoá dữ liệu đăng nhập cũ");
            router.replace("/");
        })();
    }, []);

    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </SafeAreaProvider>
    );
}
