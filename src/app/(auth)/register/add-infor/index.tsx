import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function AddInforPage() {
    const router = useRouter();

    const [birthday, setBirthday] = useState<Date | null>(null);
    const [tempBirthday, setTempBirthday] = useState<Date>(new Date());
    const [gender, setGender] = useState<string | null>(null);
    const [showDate, setShowDate] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);

    const genderOptions = ["Nam", "Nữ", "Khác"];

    const isValid = birthday && gender;

    const formatDate = (date: Date | null) => {
        if (!date) return "Sinh nhật";
        return date.toLocaleDateString("vi-VN");
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
            className="bg-white"
        >
            <View className="flex-1 bg-white px-6 pt-12">
                {/* Back */}
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} />
                </TouchableOpacity>

                {/* Title */}
                <Text className="text-xl font-semibold text-center mt-6">
                    Thêm thông tin cá nhân
                </Text>

                {/* Birthday */}
                <TouchableOpacity
                    onPress={() => {
                        setTempBirthday(birthday || new Date());
                        setShowDate(true);
                    }}
                    className="h-14 border border-gray-300 rounded-xl px-4 mt-8 flex-row items-center justify-between"
                >
                    <Text className={birthday ? "text-black" : "text-gray-400"}>
                        {formatDate(birthday)}
                    </Text>
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>

                {/* Gender */}
                <View className="relative">
                    <TouchableOpacity
                        onPress={() =>
                            setShowGenderDropdown(!showGenderDropdown)
                        }
                        className="h-14 border border-gray-300 rounded-xl px-4 mt-4 flex-row items-center justify-between"
                    >
                        <Text
                            className={gender ? "text-black" : "text-gray-400"}
                        >
                            {gender ?? "Giới tính"}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>

                    {/* Dropdown */}
                    {showGenderDropdown && (
                        <View className="absolute top-16 left-0 right-0 bg-white border border-gray-300 rounded-xl overflow-hidden z-10">
                            {genderOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => {
                                        setGender(option);
                                        setShowGenderDropdown(false);
                                    }}
                                    className="h-12 px-4 justify-center border-b border-gray-100"
                                >
                                    <Text
                                        className={`${
                                            gender === option
                                                ? "text-blue-600 font-semibold"
                                                : "text-black"
                                        }`}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Illustration (fake) */}
                <View className="flex-1 items-center justify-center opacity-20">
                    <View className="w-32 h-32 bg-blue-100 rounded-2xl" />
                </View>

                {/* Continue */}
                <TouchableOpacity
                    disabled={!isValid}
                    onPress={() =>
                        router.push({
                            pathname: "/register/update-avatar",
                        } as any)
                    }
                    className={`h-14 rounded-full items-center justify-center mb-6
          ${isValid ? "bg-blue-600" : "bg-gray-300"}
        `}
                >
                    <Text className="text-white font-semibold text-base">
                        Tiếp tục
                    </Text>
                </TouchableOpacity>

                {/* Date Picker */}
                {showDate && (
                    <View>
                        <DateTimePicker
                            value={tempBirthday}
                            mode="date"
                            display={
                                Platform.OS === "ios" ? "spinner" : "default"
                            }
                            maximumDate={new Date()}
                            onChange={(e, date) => {
                                if (date) setTempBirthday(date);
                            }}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setBirthday(tempBirthday);
                                setShowDate(false);
                            }}
                            className="mt-3 h-12 rounded-xl items-center justify-center bg-blue-600"
                        >
                            <Text className="text-white font-semibold">
                                Xác nhận
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
