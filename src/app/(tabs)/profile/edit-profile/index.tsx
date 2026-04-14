import { userApi } from "@/src/api/user/userApi";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, CircleX, MoveLeft, Pencil, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfile() {
    const router = useRouter();

    // === STATE DỮ LIỆU ===
    const [name, setName] = useState("");
    const [dob, setDob] = useState(new Date());
    const [gender, setGender] = useState("Nam");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [background, setBackground] = useState<string | null>(null);
    const [bio, setBio] = useState(""); // Thêm state lưu Bio

    // === STATE LOADING & UI ===
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingBio, setIsSavingBio] = useState(false); // Loading riêng cho Bio
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    // Modal Bottom Sheet
    const [modalVisible, setModalVisible] = useState(false);
    const [bioModalVisible, setBioModalVisible] = useState(false); // Modal Bio
    const [showDatePicker, setShowDatePicker] = useState(false);

    const genderOptions = ["Nam", "Nữ", "Khác"];

    const getInitials = (text: string) => {
        if (!text || text === "undefined") return "U";
        const words = text.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    // === FETCH DỮ LIỆU TỪ BACKEND ===
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await userApi.getProfile();
                if (response.data) {
                    setName(response.data.userName || "");
                    setBio(response.data.bio || ""); // Load Bio từ BE
                    setAvatar(
                        response.data.avatarUrl || response.data.avatar || null,
                    );
                    setBackground(
                        response.data.backgroundUrl ||
                            response.data.background ||
                            null,
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

                    if (response.data.dob) {
                        const dobString = response.data.dob;
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

    const pickImage = async (isAvatar: boolean) => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            alert("Bạn cần cấp quyền truy cập thư viện để đổi ảnh!");
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.8,
                allowsEditing: true,
                aspect: isAvatar ? [1, 1] : [16, 9],
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                if (isAvatar) {
                    setIsUploadingAvatar(true);
                    try {
                        await userApi.updateAvatar(uri);
                        setAvatar(uri);
                    } catch (error) {
                        Alert.alert("Lỗi", "Không thể lưu ảnh đại diện.");
                    } finally {
                        setIsUploadingAvatar(false);
                    }
                } else {
                    setIsUploadingCover(true);
                    try {
                        await userApi.updateBackground(uri); //
                        setBackground(uri);
                    } catch (error) {
                        Alert.alert("Lỗi", "Không thể lưu ảnh bìa.");
                    } finally {
                        setIsUploadingCover(false);
                    }
                }
            }
        } catch (error) {
            console.log("Lỗi thư viện ảnh:", error);
        }
    };

    const handleSaveInfo = async () => {
        if (!name.trim()) {
            Alert.alert("Lỗi", "Tên hiển thị không được để trống.");
            return;
        }
        setIsSaving(true);
        try {
            const dobString = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, "0")}-${String(dob.getDate()).padStart(2, "0")}`;
            const genderEnum =
                gender === "Nam"
                    ? "MALE"
                    : gender === "Nữ"
                      ? "FEMALE"
                      : "OTHER";

            await userApi.updateBasicInfo({
                //
                userName: name.trim(),
                dob: dobString,
                gender: genderEnum,
            });
            setModalVisible(false);
        } catch (error: any) {
            Alert.alert("Lỗi", "Cập nhật thông tin thất bại.");
        } finally {
            setIsSaving(false);
        }
    };

    // === XỬ LÝ LƯU BIO ===
    const handleSaveBio = async () => {
        setIsSavingBio(true);
        try {
            await userApi.updateBio(bio.trim()); //
            setBioModalVisible(false);
            Alert.alert("Thành công", "Đã cập nhật giới thiệu bản thân.");
        } catch (error) {
            Alert.alert("Lỗi", "Cập nhật giới thiệu thất bại.");
        } finally {
            setIsSavingBio(false);
        }
    };

    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* === ẢNH BÌA === */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    className="h-60 w-full bg-gray-200 relative"
                    onPress={() => pickImage(false)}
                >
                    <Image
                        source={{
                            uri: background || "https://picsum.photos/600/400",
                        }}
                        className={`w-full h-full ${!background ? "opacity-60" : ""}`}
                        resizeMode="cover"
                    />
                    <View className="absolute bottom-4 right-4 bg-black/40 p-2 rounded-full">
                        <Camera size={20} color="white" />
                    </View>
                    {isUploadingCover && (
                        <View className="absolute inset-0 items-center justify-center bg-black/30">
                            <ActivityIndicator size="large" color="white" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* === OVERLAY BUTTONS === */}
                <View className="absolute top-4 left-4">
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                        onPress={() => router.back()}
                    >
                        <MoveLeft size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* === AVATAR === */}
                <View className="items-center -mt-16 z-10">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => pickImage(true)}
                        className="relative"
                    >
                        {avatar ? (
                            <Image
                                source={{ uri: avatar }}
                                className="w-32 h-32 rounded-full border-4 border-white bg-gray-100"
                            />
                        ) : (
                            <View className="w-32 h-32 rounded-full border-4 border-white bg-blue-500 items-center justify-center">
                                <Text className="text-white text-4xl font-bold">
                                    {getInitials(name)}
                                </Text>
                            </View>
                        )}
                        <View className="absolute bottom-1 right-1 bg-gray-200 p-2 rounded-full border-2 border-white">
                            <Camera size={18} color="gray" />
                        </View>
                        {isUploadingAvatar && (
                            <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full border-4 border-white">
                                <ActivityIndicator size="large" color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* === THÔNG TIN TÊN & BIO === */}
                <View className="items-center mt-3 px-6">
                    <View className="flex-row items-center">
                        <Text className="text-2xl font-bold text-black">
                            {name}
                        </Text>
                        <TouchableOpacity
                            className="ml-2 p-2"
                            onPress={() => setModalVisible(true)}
                        >
                            <Pencil size={20} color="gray" />
                        </TouchableOpacity>
                    </View>

                    {/* BIO HIỂN THỊ */}
                    <TouchableOpacity
                        onPress={() => setBioModalVisible(true)}
                        className="flex-row items-center mt-2 bg-gray-100 px-4 py-2 rounded-full border border-gray-200"
                    >
                        <Pencil size={14} color="#0068FF" />
                        <Text
                            className="ml-2 text-blue-600 font-medium"
                            numberOfLines={1}
                        >
                            {bio ? bio : "Cập nhật giới thiệu bản thân"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* === THÔNG TIN CHI TIẾT === */}
                <View className="mt-8 px-4">
                    <Text className="text-gray-500 font-medium uppercase mb-3 ml-2">
                        Thông tin cá nhân
                    </Text>
                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <View className="flex-row justify-between py-3 border-b border-gray-200">
                            <Text className="text-gray-600 text-base">
                                Ngày sinh
                            </Text>
                            <Text className="text-black font-medium text-base">
                                {formatDate(dob)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between py-3">
                            <Text className="text-gray-600 text-base">
                                Giới tính
                            </Text>
                            <Text className="text-black font-medium text-base">
                                {gender}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* === MODAL SỬA BIO === */}
            <Modal visible={bioModalVisible} animationType="fade" transparent>
                <View className="flex-1 justify-center bg-black/50 px-6">
                    <View className="bg-white rounded-3xl p-6 shadow-xl">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-black">
                                Giới thiệu bản thân
                            </Text>
                            <TouchableOpacity
                                onPress={() => setBioModalVisible(false)}
                            >
                                <X size={24} color="gray" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Nhập vài dòng giới thiệu về bạn..."
                            className="bg-gray-50 rounded-xl p-4 text-base text-black border border-gray-200"
                            textAlignVertical="top"
                            maxLength={150}
                        />
                        <Text className="text-right text-gray-400 mt-2 text-xs">
                            {bio.length}/150
                        </Text>

                        <TouchableOpacity
                            disabled={isSavingBio}
                            onPress={handleSaveBio}
                            className={`mt-6 py-4 rounded-full items-center ${isSavingBio ? "bg-gray-300" : "bg-[#0068FF]"}`}
                        >
                            <Text className="text-white text-lg font-bold">
                                {isSavingBio ? "Đang lưu..." : "Lưu giới thiệu"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* === MODAL SỬA THÔNG TIN CƠ BẢN (GIỮ NGUYÊN) === */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1 justify-end bg-black/40">
                        <View className="bg-white rounded-t-3xl p-6 pb-10">
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="w-6" />
                                <Text className="text-lg font-bold text-black">
                                    Chỉnh sửa thông tin
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    className="bg-gray-100 p-1.5 rounded-full"
                                >
                                    <X size={22} color="gray" />
                                </TouchableOpacity>
                            </View>

                            <Text className="mb-2 text-gray-500 font-medium">
                                Tên hiển thị
                            </Text>
                            <View className="border-b border-blue-500 pb-2 mb-6 flex-row items-center">
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    maxLength={40}
                                    className="flex-1 text-lg text-black font-medium"
                                    placeholder="Nhập tên của bạn"
                                />
                                {name.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setName("")}
                                    >
                                        <CircleX size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text className="mb-2 text-gray-500 font-medium">
                                Ngày sinh
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="border-b border-gray-300 pb-3 mb-6"
                            >
                                <Text className="text-lg text-black font-medium">
                                    {formatDate(dob)}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <View className="mb-4">
                                    <DateTimePicker
                                        value={dob}
                                        mode="date"
                                        display={
                                            Platform.OS === "ios"
                                                ? "spinner"
                                                : "default"
                                        }
                                        maximumDate={new Date()}
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === "android")
                                                setShowDatePicker(false);
                                            if (selectedDate)
                                                setDob(selectedDate);
                                        }}
                                    />
                                    {Platform.OS === "ios" && (
                                        <TouchableOpacity
                                            onPress={() =>
                                                setShowDatePicker(false)
                                            }
                                            className="mt-2 bg-gray-100 py-2.5 rounded-xl items-center"
                                        >
                                            <Text className="text-blue-600 font-semibold text-base">
                                                Xong
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            <Text className="mb-3 text-gray-500 font-medium">
                                Giới tính
                            </Text>
                            <View className="flex-row space-x-3 mb-8">
                                {genderOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => setGender(option)}
                                        className={`flex-1 py-3 rounded-xl border items-center ${gender === option ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                                    >
                                        <Text
                                            className={`font-semibold text-base ${gender === option ? "text-blue-600" : "text-gray-600"}`}
                                        >
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                disabled={isSaving || !name.trim()}
                                onPress={handleSaveInfo}
                                className={`py-4 rounded-full items-center ${isSaving || !name.trim() ? "bg-gray-300" : "bg-[#0068FF]"}`}
                            >
                                <Text className="text-white text-lg font-bold">
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
