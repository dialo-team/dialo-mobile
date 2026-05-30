import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanQrScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const scannedRef = useRef(false); // synchronous guard — no state race

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scannedRef.current) return;
        scannedRef.current = true;

        let challengeId = data.trim();

        // Extract id from URL params if present (e.g. https://app.com/qr?id=xxx)
        const idMatch = data.match(/[?&](?:id|challengeId)=([^&\s]+)/);
        if (idMatch) challengeId = idMatch[1];

        if (!challengeId) {
            scannedRef.current = false;
            return;
        }

        router.replace({
            pathname: "/(auth)/login/loginQr" as any,
            params: { challengeId },
        });
    };

    if (!permission) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <Text className="text-gray-400 text-sm">
                    Đang kiểm tra quyền camera...
                </Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="bg-blue-600 flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <MoveLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg ml-4 font-semibold">
                        Quét mã QR
                    </Text>
                </View>
                <View className="flex-1 items-center justify-center px-8">
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: "#eff6ff",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 20,
                        }}
                    >
                        <Text style={{ fontSize: 36 }}>📷</Text>
                    </View>
                    <Text className="text-gray-800 font-semibold text-lg text-center mb-2">
                        Cần quyền camera
                    </Text>
                    <Text className="text-gray-500 text-sm text-center mb-8">
                        Ứng dụng cần truy cập camera để quét mã QR đăng nhập từ
                        trình duyệt.
                    </Text>
                    <TouchableOpacity
                        className="bg-blue-600 px-8 py-4 rounded-2xl"
                        onPress={requestPermission}
                    >
                        <Text className="text-white font-semibold text-base">
                            Cấp quyền
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>
                <Text
                    style={{
                        color: "white",
                        fontSize: 17,
                        fontWeight: "600",
                        marginLeft: 16,
                    }}
                >
                    Đăng nhập bằng QR
                </Text>
            </View>

            <View style={{ flex: 1, position: "relative" }}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={handleBarCodeScanned}
                />

                {/* Dark overlay with cutout */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {/* Top dark band */}
                    <View
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
                    />

                    {/* Middle row: dark | clear frame | dark */}
                    <View style={{ flexDirection: "row" }}>
                        <View
                            style={{
                                flex: 1,
                                height: 240,
                                backgroundColor: "rgba(0,0,0,0.55)",
                            }}
                        />
                        {/* Scan frame */}
                        <View
                            style={{
                                width: 240,
                                height: 240,
                                position: "relative",
                            }}
                        >
                            {/* Corner brackets */}
                            {[
                                {
                                    top: 0,
                                    left: 0,
                                    borderTopWidth: 3,
                                    borderLeftWidth: 3,
                                },
                                {
                                    top: 0,
                                    right: 0,
                                    borderTopWidth: 3,
                                    borderRightWidth: 3,
                                },
                                {
                                    bottom: 0,
                                    left: 0,
                                    borderBottomWidth: 3,
                                    borderLeftWidth: 3,
                                },
                                {
                                    bottom: 0,
                                    right: 0,
                                    borderBottomWidth: 3,
                                    borderRightWidth: 3,
                                },
                            ].map((style, i) => (
                                <View
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        width: 30,
                                        height: 30,
                                        borderColor: "#3b82f6",
                                        ...style,
                                    }}
                                />
                            ))}
                        </View>
                        <View
                            style={{
                                flex: 1,
                                height: 240,
                                backgroundColor: "rgba(0,0,0,0.55)",
                            }}
                        />
                    </View>

                    {/* Bottom dark band */}
                    <View
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
                    />
                </View>

                {/* Instruction text */}
                <View
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingBottom: 48,
                        paddingHorizontal: 32,
                        alignItems: "center",
                    }}
                    pointerEvents="none"
                >
                    <Text
                        style={{
                            color: "white",
                            fontSize: 14,
                            textAlign: "center",
                            opacity: 0.9,
                        }}
                    >
                        Mở Dialo trên máy tính → Cài đặt → Đăng nhập QR
                    </Text>
                    <Text
                        style={{
                            color: "#93c5fd",
                            fontSize: 13,
                            textAlign: "center",
                            marginTop: 6,
                        }}
                    >
                        Đặt mã QR vào khung để đăng nhập
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
