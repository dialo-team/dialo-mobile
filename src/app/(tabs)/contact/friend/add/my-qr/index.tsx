import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { DEMO_FRIEND_QR_VALUE } from "../../../../../../../constants/demoFriendQr";

const QR_SIZE = 280;

export default function MyQR() {
    const router = useRouter();
    const qrCaptureRef = useRef<View>(null);
    const [saving, setSaving] = useState(false);

    const handleHeaderBack = () => {
        router.replace("/(tabs)/contact/friend/add" as any);
    };

    const handleSave = async () => {
        if (Platform.OS === "web") {
            Alert.alert(
                "Thông báo",
                "Lưu ảnh chỉ hỗ trợ trên thiết bị di động.",
            );
            return;
        }

        if (!qrCaptureRef.current) return;

        try {
            setSaving(true);
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Cần quyền",
                    "Vui lòng cấp quyền lưu ảnh vào thư viện để tải mã QR.",
                );
                return;
            }

            const uri = await captureRef(qrCaptureRef, {
                format: "png",
                quality: 1,
            });
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert("Đã lưu", "Mã QR đã được lưu vào thư viện ảnh.");
        } catch (e) {
            console.warn(e);
            Alert.alert("Lỗi", "Không thể lưu ảnh. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                <TouchableOpacity
                    onPress={handleHeaderBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ChevronLeft size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-[18px] font-medium ml-2 text-black">
                    Mã QR của tôi
                </Text>
            </View>

            <View className="flex-1 items-center justify-center px-6">
                <View
                    ref={qrCaptureRef}
                    collapsable={false}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                >
                    <QRCode
                        value={DEMO_FRIEND_QR_VALUE}
                        size={QR_SIZE}
                        backgroundColor="#FFFFFF"
                        color="#000000"
                    />
                </View>

                <Text className="text-gray-500 text-[14px] text-center mt-6 px-4">
                    Quét mã để thêm bạn Dialo với tôi
                </Text>
            </View>

            <View className="px-6 pb-4">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="bg-blue-600 py-4 rounded-xl items-center justify-center flex-row"
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-[16px]">
                            Lưu ảnh QR
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
