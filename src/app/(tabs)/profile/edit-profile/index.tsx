import { userApi } from "@/src/api/user/userApi";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

    const [name, setName] = useState("");
    const [dob, setDob] = useState(new Date());
    const [gender, setGender] = useState("Nam");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const genderOptions = ["Nam", "Nữ", "Khác"];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await userApi.getProfile();
                if (response.data) {
                    setName(response.data.userName || "");
                    setAvatar(
                        response.data.avatarUrl || response.data.avatar || null,
                    );

                    if (response.data.gender) {
                        setGender(
                            response.data.gender === "MALE"
                                ? "Nam"
                                : response.data.gender === "FEMALE"
                                  ? "Nữ"
                                  : "Khác",
                        );
                    }

                    // --- ĐÃ SỬA: Ép Javascript đọc đúng Ngày/Tháng/Năm từ chuỗi YYYY-MM-DD để không bị lệch múi giờ ---
                    if (response.data.dob) {
                        const dobString = response.data.dob; // Ví dụ: "2026-04-13"
                        const [year, month, day] = dobString.split("-");
                        if (year && month && day) {
                            setDob(
                                new Date(
                                    Number(year),
                                    Number(month) - 1,
                                    Number(day),
                                ),
                            );
                        }
                    }
                }
            } catch (error) {
                console.log("Lỗi tải thông tin:", error);
                Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            alert("Bạn cần cấp quyền truy cập thư viện!");
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [1, 1],
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setIsUploadingAvatar(true);

                try {
                    await userApi.updateAvatar(uri);
                    setAvatar(uri);
                    Alert.alert("Thành công", "Đã cập nhật ảnh đại diện.");
                } catch (apiError: any) {
                    console.log("Lỗi upload avatar:", apiError);
                    Alert.alert("Lỗi", "Không thể lưu ảnh đại diện mới.");
                } finally {
                    setIsUploadingAvatar(false);
                }
            }
        } catch (error) {
            console.log("Lỗi thư viện ảnh:", error);
        }
    };

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            // Đảm bảo lúc lưu cũng gửi chuẩn YYYY-MM-DD không bị ảnh hưởng bởi múi giờ
            const year = dob.getFullYear();
            const month = String(dob.getMonth() + 1).padStart(2, "0");
            const day = String(dob.getDate()).padStart(2, "0");
            const dobString = `${year}-${month}-${day}`;

            const genderEnum =
                gender === "Nam"
                    ? "MALE"
                    : gender === "Nữ"
                      ? "FEMALE"
                      : "OTHER";

            await userApi.updateBasicInfo({
                userName: name,
                dob: dobString,
                gender: genderEnum,
            });

            setModalVisible(false);
            Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân.");
        } catch (error: any) {
            console.log("Lỗi lưu info:", error);
            Alert.alert("Lỗi", "Cập nhật thông tin thất bại.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, "0")}/${(
            date.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* Header */}
            <View className="bg-blue-600 flex-row items-center px-4 py-5">
                <TouchableOpacity onPress={() => router.back()}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg font-semibold flex-1 text-center">
                    Thông tin cá nhân
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Avatar */}
            <View className="bg-white items-center py-6 relative">
                <TouchableOpacity
                    onPress={pickImage}
                    disabled={isUploadingAvatar}
                >
                    {avatar ? (
                        <Image
                            source={{ uri: avatar }}
                            className={`w-28 h-28 rounded-full ${isUploadingAvatar ? "opacity-50" : ""}`}
                        />
                    ) : (
                        <View
                            className={`w-28 h-28 rounded-full bg-green-600 items-center justify-center ${isUploadingAvatar ? "opacity-50" : ""}`}
                        >
                            <Text className="text-white text-3xl font-semibold">
                                {name ? name[0].toUpperCase() : "U"}
                            </Text>
                        </View>
                    )}

                    {isUploadingAvatar && (
                        <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center">
                            <ActivityIndicator size="large" color="#2563EB" />
                        </View>
                    )}
                </TouchableOpacity>
                <Text className="text-gray-500 mt-2">
                    {isUploadingAvatar
                        ? "Đang tải ảnh lên..."
                        : "Nhấn để đổi ảnh"}
                </Text>
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
                            className="border rounded-lg px-3 py-2 mb-3 border-gray-300"
                        />

                        {/* DOB */}
                        <Text className="mb-1 text-gray-600">Ngày sinh</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="border rounded-lg px-3 py-2 mb-3 border-gray-300"
                        >
                            <Text>{formatDate(dob)}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <View className="mb-3 bg-gray-50 rounded-lg p-2">
                                <DateTimePicker
                                    value={dob}
                                    mode="date"
                                    display={
                                        Platform.OS === "ios"
                                            ? "spinner"
                                            : "default"
                                    }
                                    maximumDate={new Date()} // Không cho chọn ngày tương lai
                                    onChange={(event, selectedDate) => {
                                        // Android tự tắt sau khi bấm OK/Cancel
                                        if (Platform.OS === "android") {
                                            setShowDatePicker(false);
                                        }
                                        if (selectedDate) {
                                            setDob(selectedDate);
                                        }
                                    }}
                                />

                                {/* Nút "Xong" dành riêng cho iOS để người dùng tắt bảng chọn */}
                                {Platform.OS === "ios" && (
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(false)}
                                        className="mt-2 bg-blue-500 py-2 rounded-lg items-center"
                                    >
                                        <Text className="text-white font-semibold">
                                            Xong
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Gender */}
                        <Text className="mb-1 text-gray-600">Giới tính</Text>
                        <View className="border border-gray-300 rounded-lg mb-5 overflow-hidden">
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
                                className="px-4 py-2 justify-center"
                            >
                                <Text className="text-gray-500 font-medium">
                                    Hủy
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={isSaving}
                                onPress={handleSaveInfo}
                                className={`px-4 py-2 rounded-lg ${isSaving ? "bg-blue-400" : "bg-blue-600"}`}
                            >
                                <Text className="text-white font-medium">
                                    {isSaving ? "Đang lưu..." : "Xác nhận"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
