import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DIM = "rgba(0,0,0,0.55)";
const CORNER_LEN = 28;
const CORNER_THICK = 4;

function QRFrameOverlay() {
    const { width: W, height: H } = useWindowDimensions();
    const frameSize = Math.min(W, H) * 0.68;
    const insetX = (W - frameSize) / 2;
    const insetY = (H - frameSize) / 2 - 28;
    const bottomBarH = Math.max(0, H - insetY - frameSize);

    return (
        <View
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            pointerEvents="none"
        >
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: insetY,
                    backgroundColor: DIM,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: bottomBarH,
                    backgroundColor: DIM,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: 0,
                    width: insetX,
                    height: frameSize,
                    backgroundColor: DIM,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: insetX + frameSize,
                    right: 0,
                    height: frameSize,
                    backgroundColor: DIM,
                }}
            />

            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: insetX,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderTopWidth: CORNER_THICK,
                    borderLeftWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: insetX + frameSize - CORNER_LEN,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderTopWidth: CORNER_THICK,
                    borderRightWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY + frameSize - CORNER_LEN,
                    left: insetX,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderBottomWidth: CORNER_THICK,
                    borderLeftWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY + frameSize - CORNER_LEN,
                    left: insetX + frameSize - CORNER_LEN,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderBottomWidth: CORNER_THICK,
                    borderRightWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />

            <Text
                style={{
                    position: "absolute",
                    top: insetY + frameSize + 18,
                    left: 24,
                    right: 24,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 15,
                }}
            >
                Đưa mã QR vào khung để quét
            </Text>
        </View>
    );
}

export default function QRScanner() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    if (!permission) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Đang tải...</Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <Text className="text-white mb-4">Cần cấp quyền camera</Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-blue-600 px-6 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Cấp quyền</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1">
                <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={
                        scanned
                            ? undefined
                            : ({ data }: { data: string }) => {
                                  setScanned(true);
                                  console.log("QR Data:", data);
                                  // --- ĐÃ SỬA: Truyền id thay vì qr, giống hệt bên AddFriendScreen ---
                                  router.push({
                                      pathname: "/contact/friend/new" as any,
                                      params: { qrToken: data },
                                  });
                              }
                    }
                />

                <QRFrameOverlay />

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg z-10"
                >
                    <Text className="text-white font-semibold">✕ Đóng</Text>
                </TouchableOpacity>

                {scanned && (
                    <TouchableOpacity
                        onPress={() => setScanned(false)}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-3 rounded-lg z-10"
                    >
                        <Text className="text-white font-semibold">
                            Quét lại
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
