import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddFriendScreen() {
    const router = useRouter();
    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white">
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)/contact")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="chevron-back" size={28} color="black" />
                </TouchableOpacity>
                <Text className="text-[18px] font-medium ml-2 text-black">
                    Thêm bạn
                </Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Vùng chứa Thẻ Mã QR */}
                <View className="items-center mt-6 mb-8">
                    {/* Thẻ QR nền xanh xám */}
                    <View className="bg-[#415C84] w-[260px] rounded-2xl p-5 items-center shadow-sm">
                        <Text className="text-white text-[16px] font-medium mb-4">
                            Trâm Anh
                        </Text>

                        {/* Khung trắng bọc mã QR */}
                        <View className="bg-white p-2 rounded-xl mb-4">
                            {/* Dùng ảnh placeholder cho mã QR */}
                            <Image
                                source={{
                                    uri: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
                                }}
                                className="w-[140px] h-[140px]"
                            />
                        </View>

                        <Text className="text-white/80 text-[12px]">
                            Quét mã để thêm bạn Dialo với tôi
                        </Text>
                    </View>
                </View>

                {/* Phần Nhập số điện thoại */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center border border-gray-300 rounded-lg bg-white h-[48px]">
                        {/* Chọn mã vùng */}
                        <TouchableOpacity className="flex-row items-center px-3 border-r border-gray-300 h-full">
                            <Text className="text-[16px] text-black mr-1">
                                +84
                            </Text>
                            <Ionicons
                                name="chevron-down"
                                size={16}
                                color="#666"
                            />
                        </TouchableOpacity>

                        {/* Ô nhập số */}
                        <TextInput
                            className="flex-1 px-3 text-[16px] text-black"
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="phone-pad"
                        />

                        {/* Nút gửi (Đang ở trạng thái disable màu xám) */}
                        <TouchableOpacity className="px-2" activeOpacity={0.8}>
                            <View className="w-9 h-9 bg-gray-200 rounded-full items-center justify-center">
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color="white"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Khoảng xám phân cách */}
                <View className="h-[1px] bg-gray-100" />

                {/* Các tùy chọn khác */}
                <View className="bg-white">
                    {/* Quét mã QR */}
                    <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
                        <View className="w-10">
                            <MaterialCommunityIcons
                                name="qrcode-scan"
                                size={22}
                                color="#0068FF"
                            />
                        </View>
                        <Text className="text-[16px] font-normal text-black">
                            Quét mã QR
                        </Text>
                    </TouchableOpacity>

                    {/* Footer Text */}
                    <View className="mt-8 px-8 items-center">
                        <Text className="text-[13px] text-gray-500 text-center">
                            Xem lời mời kết bạn đã gửi tại trang Danh bạ Dialo
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
