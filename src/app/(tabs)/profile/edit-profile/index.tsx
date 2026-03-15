import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useState } from "react";
import {
    Image,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfile() {
    const router = useRouter();

    const [name, setName] = useState("Phan Nhật Tiến");
    const [dob, setDob] = useState(new Date(2000, 2, 27));
    const [gender, setGender] = useState("Nam");
    const [avatar, setAvatar] = useState("https://i.pravatar.cc/300");

    const [modalVisible, setModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const genderOptions = ["Nam", "Nữ", "Khác"];

    // 📷 Chọn ảnh từ thư viện
    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            alert("Bạn cần cấp quyền truy cập thư viện!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, "0")}/${(
            date.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* Header */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.push("/profile" as any)}
                >
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg font-semibold flex-1 text-center">
                    Thông tin cá nhân
                </Text>
            </View>

            {/* Avatar */}
            <View className="bg-white items-center py-6">
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={{ uri: avatar }}
                        className="w-28 h-28 rounded-full"
                    />
                </TouchableOpacity>
                <Text className="text-gray-500 mt-2">Nhấn để đổi ảnh</Text>
            </View>

            {/* Info */}
            <View className="mt-3 bg-white">
                <View className="flex-row justify-between px-4 py-4 border-b border-gray-200">
                    <Text className="text-gray-700">Tên</Text>
                    <Text className="font-semibold">{name}</Text>
                </View>

                <View className="flex-row justify-between px-4 py-4 border-b border-gray-200">
                    <Text className="text-gray-700">Ngày sinh</Text>
                    <Text className="font-semibold">{formatDate(dob)}</Text>
                </View>

                <View className="flex-row justify-between px-4 py-4">
                    <Text className="text-gray-700">Giới tính</Text>
                    <Text className="font-semibold">{gender}</Text>
                </View>
            </View>

            {/* Edit Button */}
            <View className="mt-4 items-center">
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-blue-600 px-8 py-3 rounded-full"
                >
                    <Text className="text-white font-medium">Chỉnh sửa</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/40 justify-center px-6">
                    <View className="bg-white rounded-2xl p-6">
                        <Text className="text-lg font-semibold mb-4">
                            Chỉnh sửa thông tin
                        </Text>

                        {/* Name */}
                        <Text className="mb-1 text-gray-600">Tên</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            className="border rounded-lg px-3 py-2 mb-3"
                        />

                        {/* DOB */}
                        <Text className="mb-1 text-gray-600">Ngày sinh</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="border rounded-lg px-3 py-2 mb-3"
                        >
                            <Text>{formatDate(dob)}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dob}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(
                                        Platform.OS === "ios" ? true : false,
                                    );
                                    if (selectedDate) {
                                        setDob(selectedDate);
                                    }
                                }}
                            />
                        )}

                        {/* Gender */}
                        <Text className="mb-1 text-gray-600">Giới tính</Text>
                        <View className="border rounded-lg mb-5">
                            {genderOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => setGender(option)}
                                    className={`px-3 py-2 ${
                                        gender === option ? "bg-blue-100" : ""
                                    }`}
                                >
                                    <Text
                                        className={`text-base ${
                                            gender === option
                                                ? "text-blue-600 font-semibold"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Buttons */}
                        <View className="flex-row justify-end gap-4">
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                            >
                                <Text className="text-gray-500">Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="bg-blue-600 px-4 py-2 rounded-lg"
                            >
                                <Text className="text-white font-medium">
                                    Xác nhận
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
