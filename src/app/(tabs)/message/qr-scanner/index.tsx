import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
                                  setTimeout(() => router.back(), 500);
                              }
                    }
                />

                {/* Close Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg"
                >
                    <Text className="text-white font-semibold">✕ Đóng</Text>
                </TouchableOpacity>

                {/* Scan Again Button */}
                {scanned && (
                    <TouchableOpacity
                        onPress={() => setScanned(false)}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-3 rounded-lg"
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
