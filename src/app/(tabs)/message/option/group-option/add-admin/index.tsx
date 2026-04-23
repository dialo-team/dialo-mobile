import { chatAuthUtils } from "@/src/api/chat/chatApi";
import { groupApi } from "@/src/api/group/groupApi";
import { pickBestDisplayName } from "@/src/utils/displayUser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddAdminScreen() {
    const router = useRouter();
    const { conversationId } = useLocalSearchParams<{
        conversationId: string;
    }>();

    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        loadEligibleMembers();
    }, []);

    const loadEligibleMembers = async () => {
        try {
            const currentUserId = await chatAuthUtils.getCurrentUserId();
            const membersRes = await groupApi.getGroupMembers(
                conversationId,
                currentUserId as string,
            );

            // Lọc: Chỉ lấy những người đang là MEMBER (chưa phải Owner/Admin) và loại bản thân
            const eligible = membersRes.filter(
                (m: any) =>
                    m.role === "MEMBER" &&
                    String(m.userId) !== String(currentUserId),
            );
            setMembers(eligible);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải danh sách thành viên");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (userId: string) => {
        setSelectedIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const handlePromote = async () => {
        if (selectedIds.length === 0) return;
        setSubmitting(true);
        try {
            // Lặp qua mảng các ID đã chọn để gán quyền (Thực tế nên có API bulk assign, nhưng dùng vòng lặp tạm nếu API chưa hỗ trợ)
            await Promise.all(
                selectedIds.map((id) =>
                    groupApi.assignRole(conversationId, id, "ADMIN"),
                ),
            );
            router.back(); // Trở về màn hình trước sau khi thành công
        } catch (error) {
            Alert.alert("Lỗi", "Không thể bổ nhiệm phó nhóm lúc này");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMembers = members.filter((m) =>
        (m.displayName || m.fullName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4"
                    >
                        <X color="black" size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-black text-[18px] font-semibold">
                            Thêm phó nhóm
                        </Text>
                        <Text className="text-gray-500 text-[13px]">
                            Đã chọn: {selectedIds.length}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={handlePromote}
                    disabled={selectedIds.length === 0 || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                        <Text
                            className={`text-[16px] font-semibold ${selectedIds.length > 0 ? "text-blue-500" : "text-gray-300"}`}
                        >
                            Xong
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="px-4 py-3 border-b border-gray-100">
                <View className="bg-gray-100 rounded-lg px-3 py-2 flex-row items-center">
                    <TextInput
                        className="flex-1 text-[15px] p-0 text-black"
                        placeholder="Nhập tên bạn bè"
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Danh sách */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredMembers.map((member) => {
                        const isSelected = selectedIds.includes(member.userId);
                        const displayName = pickBestDisplayName(
                            [
                                member.displayName,
                                member.fullName,
                                member.userName,
                            ],
                            "Thành viên",
                        );

                        return (
                            <TouchableOpacity
                                key={member.userId}
                                className="flex-row items-center px-4 py-3"
                                onPress={() => toggleSelect(member.userId)}
                                activeOpacity={0.7}
                            >
                                {/* Checkbox Radio style */}
                                <View
                                    className={`w-5 h-5 rounded-full border mr-4 items-center justify-center ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-400 bg-transparent"}`}
                                >
                                    {isSelected && (
                                        <View className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </View>

                                {/* Avatar */}
                                {member.avatarUrl ? (
                                    <Image
                                        source={{ uri: member.avatarUrl }}
                                        className="w-12 h-12 rounded-full mr-3 bg-gray-200"
                                    />
                                ) : (
                                    <View className="w-12 h-12 rounded-full bg-blue-400 items-center justify-center mr-3">
                                        <Text className="text-white text-lg font-bold">
                                            {displayName
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                {/* Name */}
                                <Text className="text-[16px] text-black flex-1">
                                    {displayName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
