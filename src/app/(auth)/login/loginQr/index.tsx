import { qrAuthApi } from "@/src/api/auth/qrAuthApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginQrConfirmScreen() {
    const router = useRouter();
    const { challengeId } = useLocalSearchParams<{ challengeId?: string }>();
    const [isApproving, setIsApproving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleApproveLogin = async () => {
        if (!challengeId) {
            Alert.alert(
                "Lỗi",
                "Không tìm thấy dữ liệu QR để xác nhận đăng nhập.",
            );
            return;
        }

        setIsApproving(true);
        setStatusMessage(null);

        try {
            await qrAuthApi.approveChallenge(challengeId);
            setStatusMessage(
                "Yêu cầu đã được gửi. Vui lòng quay lại thiết bị đang chờ để hoàn tất đăng nhập.",
            );
            Alert.alert("Đã xác nhận", "Đã gửi yêu cầu xác nhận đăng nhập.");
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể xác nhận đăng nhập.";
            setStatusMessage(`Lỗi: ${message}`);
            Alert.alert("Lỗi", message);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <View className="flex-1 px-6 py-8">
                    <Text className="text-[22px] font-bold text-gray-900 text-center">
                        Xác nhận đăng nhập bằng QR
                    </Text>

                    <View className="mt-6 rounded-3xl border border-gray-200 bg-slate-50 p-4">
                        <Text className="text-sm text-gray-500 mb-2">
                            Mã QR đã quét chứa challenge đăng nhập. Hãy xác nhận
                            để hoàn tất đăng nhập trên thiết bị khác.
                        </Text>

                        <Text className="text-[13px] text-gray-600">
                            Challenge ID:
                        </Text>
                        <Text className="break-words text-base font-medium text-gray-900 mt-1">
                            {challengeId ?? "Không có dữ liệu"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleApproveLogin}
                        disabled={isApproving || !challengeId}
                        className={`mt-8 rounded-2xl px-4 py-4 items-center ${
                            isApproving || !challengeId
                                ? "bg-slate-300"
                                : "bg-blue-600"
                        }`}
                    >
                        <Text className="text-white font-semibold text-base">
                            {isApproving
                                ? "Đang xác nhận..."
                                : "Xác nhận đăng nhập"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4 rounded-2xl border border-gray-200 px-4 py-4 items-center"
                    >
                        <Text className="text-gray-700 font-semibold">Hủy</Text>
                    </TouchableOpacity>

                    {statusMessage ? (
                        <View className="mt-6 rounded-2xl bg-blue-50 p-4">
                            <Text className="text-sm text-blue-900">
                                {statusMessage}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
