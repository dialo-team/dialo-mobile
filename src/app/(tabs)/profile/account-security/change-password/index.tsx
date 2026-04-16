import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { getAccessToken, getRefreshToken } from "@/src/api/auth/authStorage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
    const router = useRouter();

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [refreshToken, setRefreshToken] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadRefreshToken = async () => {
            const [storedAccessToken, storedRefreshToken] = await Promise.all([
                getAccessToken(),
                getRefreshToken(),
            ]);

            if (!storedAccessToken || !storedRefreshToken) {
                Alert.alert(
                    "Chưa đăng nhập",
                    "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.",
                    [
                        {
                            text: "OK",
                            onPress: () =>
                                router.replace("/(auth)/login" as any),
                        },
                    ],
                );
                return;
            }

            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
        };

        loadRefreshToken();
    }, [router]);

    const isValidOldPass = oldPass.length >= 6;
    const isValidNewPass = newPass.length >= 6 && newPass.length <= 32;
    const hasLetterAndNumberOrSpecial = /(?=.*[a-zA-Z])(?=.*[\d\W_])/.test(
        newPass,
    );
    const isMatched = newPass === confirmPass && confirmPass !== "";

    const isFormValid =
        isValidOldPass &&
        isValidNewPass &&
        hasLetterAndNumberOrSpecial &&
        isMatched;

    const handleChangePassword = async () => {
        if (!refreshToken) {
            Alert.alert(
                "Lỗi",
                "Không tìm thấy refresh token. Vui lòng đăng nhập lại.",
            );
            return;
        }

        try {
            setIsSubmitting(true);
            console.log("=== THÔNG TIN GỬI LÊN BE ===");
            console.log("Body Data:", { oldPass, newPass, refreshToken });
            console.log("Header AccessToken:", accessToken);
            console.log("============================");
            const response = await authenticationApi.changePassword(
                {
                    oldPass,
                    newPass,
                    refreshToken,
                },
                accessToken,
            );

            console.log("Change password response:", response);
            Alert.alert("Thành công", "Đổi mật khẩu thành công");
            router.back();
        } catch (error: any) {
            console.error(
                "Lỗi đổi mật khẩu:",
                error.response?.data || error.message,
            );
            Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể đổi mật khẩu",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBorderOld = useMemo(
        () => (oldPass ? "border-[#0068FF]" : "border-gray-300"),
        [oldPass],
    );
    const inputBorderNew = useMemo(
        () => (newPass ? "border-[#0068FF]" : "border-gray-300"),
        [newPass],
    );
    const inputBorderConfirm = useMemo(
        () => (confirmPass ? "border-[#0068FF]" : "border-gray-300"),
        [confirmPass],
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1 bg-white"
            >
                <View className="flex-1 px-6">
                    <View className="h-14 justify-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <MoveLeft size={24} color="gray" />
                        </TouchableOpacity>
                    </View>

                    <View className="mt-4 items-center">
                        <Text className="text-[22px] font-bold text-black">
                            Đổi mật khẩu
                        </Text>
                        <Text className="text-[14px] text-gray-500 mt-2 text-center leading-5">
                            Nhập mật khẩu cũ và tạo mật khẩu mới để cập nhật tài
                            khoản.
                        </Text>
                    </View>

                    <View className="mt-8">
                        <View
                            className={`flex-row items-center border rounded-[10px] h-[50px] px-4 bg-white mb-4 ${inputBorderOld}`}
                        >
                            <TextInput
                                className="flex-1 text-[16px] text-black"
                                placeholder="Mật khẩu cũ"
                                placeholderTextColor="#A0A0A0"
                                secureTextEntry={!showOldPass}
                                value={oldPass}
                                onChangeText={setOldPass}
                            />
                            <TouchableOpacity
                                onPress={() => setShowOldPass(!showOldPass)}
                            >
                                <Feather
                                    name={showOldPass ? "eye" : "eye-off"}
                                    size={20}
                                    color={oldPass ? "black" : "#A0A0A0"}
                                />
                            </TouchableOpacity>
                        </View>

                        <View
                            className={`flex-row items-center border rounded-[10px] h-[50px] px-4 bg-white mb-4 ${inputBorderNew}`}
                        >
                            <TextInput
                                className="flex-1 text-[16px] text-black"
                                placeholder="Mật khẩu mới"
                                placeholderTextColor="#A0A0A0"
                                secureTextEntry={!showNewPass}
                                value={newPass}
                                onChangeText={setNewPass}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPass(!showNewPass)}
                            >
                                <Feather
                                    name={showNewPass ? "eye" : "eye-off"}
                                    size={20}
                                    color={newPass ? "black" : "#A0A0A0"}
                                />
                            </TouchableOpacity>
                        </View>

                        <View
                            className={`flex-row items-center border rounded-[10px] h-[50px] px-4 bg-white ${inputBorderConfirm}`}
                        >
                            <TextInput
                                className="flex-1 text-[16px] text-black"
                                placeholder="Nhập lại mật khẩu mới"
                                placeholderTextColor="#A0A0A0"
                                secureTextEntry={!showConfirmPass}
                                value={confirmPass}
                                onChangeText={setConfirmPass}
                            />
                            <TouchableOpacity
                                onPress={() =>
                                    setShowConfirmPass(!showConfirmPass)
                                }
                            >
                                <Feather
                                    name={showConfirmPass ? "eye" : "eye-off"}
                                    size={20}
                                    color={confirmPass ? "black" : "#A0A0A0"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mt-6 px-2 space-y-2">
                        <Text
                            className={`text-[14px] ${isValidNewPass ? "text-[#0068FF]" : "text-gray-500"}`}
                        >
                            • Từ 6 đến 32 ký tự
                        </Text>
                        <Text
                            className={`text-[14px] ${hasLetterAndNumberOrSpecial ? "text-[#0068FF]" : "text-gray-500"}`}
                        >
                            • Gồm chữ và ít nhất 1 số hoặc 1 ký tự đặc biệt
                        </Text>
                        <Text
                            className={`text-[14px] ${isMatched ? "text-[#0068FF]" : "text-gray-500"}`}
                        >
                            • Mật khẩu mới khớp
                        </Text>
                    </View>

                    <TouchableOpacity
                        disabled={!isFormValid || isSubmitting}
                        onPress={handleChangePassword}
                        className={`mt-8 h-[48px] rounded-full items-center justify-center ${isFormValid && !isSubmitting ? "bg-[#0068FF]" : "bg-[#D1D5DB]"}`}
                    >
                        <Text
                            className={`font-medium text-[16px] ${isFormValid && !isSubmitting ? "text-white" : "text-white/80"}`}
                        >
                            {isSubmitting ? "Đang đổi..." : "Tiếp tục"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
