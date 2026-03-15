import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Thêm import useRouter
import { MoveLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewPasswordScreen() {
    const router = useRouter(); // Khởi tạo router

    // Quản lý trạng thái ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    const [showRePassword, setShowRePassword] = useState(false);

    // Quản lý giá trị người dùng nhập
    const [password, setPassword] = useState("");
    const [rePassword, setRePassword] = useState("");

    // Quản lý trạng thái hiển thị Modal thành công
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Logic kiểm tra mật khẩu hợp lệ:
    const isValidLength = password.length >= 6 && password.length <= 32;
    const hasLetterAndNumberOrSpecial = /(?=.*[a-zA-Z])(?=.*[\d\W_])/.test(
        password,
    );
    const isMatched = password === rePassword && password !== "";

    // Nút "Tiếp tục" chỉ bật khi thoả mãn tất cả điều kiện trên
    const isFormValid =
        isValidLength && hasLetterAndNumberOrSpecial && isMatched;

    // Tự động chuyển trang sau 5s khi hiện Modal
    useEffect(() => {
        if (isModalVisible) {
            const timer = setTimeout(() => {
                setIsModalVisible(false); // Ẩn modal trước khi chuyển trang
                router.push("/(tabs)/message");
            }, 3000);

            // Dọn dẹp timer nếu component unmount để tránh rò rỉ bộ nhớ
            return () => clearTimeout(timer);
        }
    }, [isModalVisible, router]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="px-6">
                    <View className="h-14 justify-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <MoveLeft size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View className="items-center mt-4 px-4">
                    <Text className="text-[22px] font-bold text-black mb-3">
                        Tạo mật khẩu đăng nhập
                    </Text>
                    <Text className="text-[15px] text-gray-500 text-center leading-6 mb-8">
                        Tạo mật khẩu để đăng nhập Dialo tiện lợi hơn trong{"\n"}
                        lần sau
                    </Text>
                </View>

                {/* Form nhập liệu */}
                <View className="px-5">
                    {/* Ô nhập mật khẩu */}
                    <View
                        className={`flex-row items-center border rounded-[10px] h-[50px] px-4 mb-4 bg-white ${password ? "border-[#0068FF]" : "border-gray-300"}`}
                    >
                        <TextInput
                            className="flex-1 text-[16px] text-black"
                            placeholder="Nhập mật khẩu"
                            placeholderTextColor="#A0A0A0"
                            secureTextEntry={!showPassword}
                            autoFocus={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Feather
                                name={showPassword ? "eye" : "eye-off"}
                                size={20}
                                color={password ? "black" : "#A0A0A0"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Ô nhập lại mật khẩu */}
                    <View
                        className={`flex-row items-center border rounded-[10px] h-[50px] px-4 mb-6 bg-white ${rePassword ? "border-[#0068FF]" : "border-gray-300"}`}
                    >
                        <TextInput
                            className="flex-1 text-[16px] text-black"
                            placeholder="Nhập lại mật khẩu"
                            placeholderTextColor="#A0A0A0"
                            secureTextEntry={!showRePassword}
                            value={rePassword}
                            onChangeText={setRePassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowRePassword(!showRePassword)}
                        >
                            <Feather
                                name={showRePassword ? "eye" : "eye-off"}
                                size={20}
                                color={rePassword ? "black" : "#A0A0A0"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Quy tắc mật khẩu */}
                    <View className="px-2 mb-8">
                        <View className="flex-row items-center mb-2">
                            <Text
                                className={`text-[18px] mr-2 leading-5 ${isValidLength ? "text-[#0068FF]" : "text-gray-500"}`}
                            >
                                •
                            </Text>
                            <Text
                                className={`text-[14px] ${isValidLength ? "text-[#0068FF]" : "text-gray-600"}`}
                            >
                                Dài từ 6 đến 32 ký tự
                            </Text>
                        </View>
                        <View className="flex-row items-start">
                            <Text
                                className={`text-[18px] mr-2 leading-5 ${hasLetterAndNumberOrSpecial ? "text-[#0068FF]" : "text-gray-500"}`}
                            >
                                •
                            </Text>
                            <Text
                                className={`text-[14px] flex-1 ${hasLetterAndNumberOrSpecial ? "text-[#0068FF]" : "text-gray-600"}`}
                            >
                                Gồm chữ và ít nhất 1 số hoặc 1 ký tự đặc biệt
                            </Text>
                        </View>
                    </View>

                    {/* Nút Tiếp tục */}
                    <TouchableOpacity
                        disabled={!isFormValid}
                        onPress={() => setIsModalVisible(true)}
                        className={`h-[48px] rounded-full items-center justify-center ${isFormValid ? "bg-[#0068FF]" : "bg-[#D1D5DB]"}`}
                    >
                        <Text
                            className={`font-medium text-[16px] ${isFormValid ? "text-white" : "text-white/80"}`}
                        >
                            Tiếp tục
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Modal Thông báo Thành công */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)} // Dành cho nút back trên Android
            >
                {/* Nền làm mờ (Overlay) */}
                <View className="flex-1 justify-center items-center bg-black/40 px-5">
                    {/* Hộp thoại Modal */}
                    <View className="bg-white rounded-[20px] w-full p-6 items-center shadow-lg">
                        <View className="w-16 h-16 bg-[#E5F0FF] rounded-full items-center justify-center mb-4">
                            <Feather name="check" size={32} color="#0068FF" />
                        </View>

                        <Text className="text-[20px] font-bold text-black mb-2">
                            Đổi mật khẩu thành công
                        </Text>
                        <Text className="text-[15px] text-gray-500 text-center">
                            Bạn đã thiết lập mật khẩu mới thành công. Vui lòng
                            sử dụng mật khẩu này cho những lần đăng nhập sau.
                        </Text>
                        {/* Đã xóa nút Đóng ở đây */}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
