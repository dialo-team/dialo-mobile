import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Plus, User, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image as RNImage,
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

// Local helper to resolve file paths
const resolveFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `http://14.225.192.37:8085${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

const extractValidId = (item: any) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    return String(
        item?.userId ||
            item?.id ||
            item?.targetId ||
            item?.senderId ||
            item?.user?.id ||
            "",
    ).trim();
};

const extractAvatar = (profile: any) => {
    if (!profile) return null;
    return (
        profile?.avatarUrl ||
        profile?.avatar ||
        profile?.profilePictureUrl ||
        profile?.profilePicture ||
        profile?.photoUrl ||
        profile?.imageUrl ||
        profile?.user?.avatarUrl ||
        profile?.user?.profilePictureUrl ||
        null
    );
};

const extractPollData = (raw: any) =>
    raw?.poll || raw?.payload?.poll || (raw?.type === "POLL" ? raw : null);

export default function PollDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        messageId?: string;
        conversationId?: string;
        pollData?: string;
        senderId?: string;
    }>();

    const messageId = params.messageId;
    const conversationId = params.conversationId;
    const senderId = params.senderId;

    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState("");
    const [poll, setPoll] = useState<any>(null);
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>(
        {},
    );

    // Add custom option states
    const [showAddModal, setShowAddModal] = useState(false);
    const [newOptionText, setNewOptionText] = useState("");
    const [submittingOption, setSubmittingOption] = useState(false);

    // Submit vote states
    const [submittingVote, setSubmittingVote] = useState(false);

    // Fetch user IDs for lookup
    const loadUserProfiles = async (pollObj: any) => {
        if (!pollObj) return;
        const options = Array.isArray(pollObj.options) ? pollObj.options : [];
        const uniqueUserIds = new Set<string>();

        options.forEach((opt: any) => {
            const voters = Array.isArray(opt.voters) ? opt.voters : [];
            voters.forEach((v: any) => {
                const voterId = extractValidId(v);
                if (voterId) uniqueUserIds.add(voterId);
            });
        });

        const profiles: Record<string, any> = {};
        for (const userId of Array.from(uniqueUserIds)) {
            try {
                const userRes = await friendApi.getUserById(userId);
                const userData = userRes?.data || userRes;
                profiles[userId] = {
                    displayName:
                        userData?.userName ||
                        userData?.fullName ||
                        userData?.displayName ||
                        "Thành viên",
                    avatarUrl: resolveFileUrl(
                        userData?.avatar ||
                            userData?.avatarUrl ||
                            userData?.profilePictureUrl,
                    ),
                };
            } catch {
                profiles[userId] = {
                    displayName: "Thành viên",
                    avatarUrl: null,
                };
            }
        }
        setMemberProfiles((prev) => ({ ...prev, ...profiles }));
    };

    const loadPollDetail = useCallback(async () => {
        if (!conversationId || !messageId) {
            setLoading(false);
            return;
        }

        try {
            const detail = await chatApi.getConversationDetail(conversationId);
            const found = detail.messages.find(
                (m) => String(m.id || m.messageId) === String(messageId),
            );
            if (found) {
                const parsedPoll = extractPollData(found);
                setPoll(parsedPoll);
                await loadUserProfiles(parsedPoll);
            }
        } catch (error) {
            console.warn("Lỗi tải chi tiết bình chọn:", error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, messageId]);

    // Initial load
    useEffect(() => {
        (async () => {
            try {
                const sub = await chatAuthUtils.getCurrentUserId();
                setCurrentUserId(sub || "");
            } catch {
                setCurrentUserId("");
            }
        })();

        if (params.pollData) {
            try {
                const initialPoll = JSON.parse(params.pollData);
                setPoll(initialPoll);
                loadUserProfiles(initialPoll);
            } catch {
                // fallback
            }
        }
        loadPollDetail();
    }, [params.pollData, loadPollDetail]);

    // Initialize selection from poll object
    useEffect(() => {
        if (poll && currentUserId) {
            const options = Array.isArray(poll.options) ? poll.options : [];
            const userVotes = options
                .filter((opt: any) => {
                    const voters = Array.isArray(opt.voters) ? opt.voters : [];
                    return voters.some(
                        (v: any) => extractValidId(v) === currentUserId,
                    );
                })
                .map((opt: any) => String(opt.id || opt.optionId || opt.value));
            setSelectedOptionIds(userVotes);
        }
    }, [poll, currentUserId]);

    const handleToggleOption = (optionId: string) => {
        const isClosed =
            poll?.closed === true ||
            poll?.status === "CLOSED" ||
            poll?.isClosed === true;
        if (isClosed) {
            Alert.alert(
                "Bình chọn đã khóa",
                "Bình chọn này đã khóa. Bạn không thể thay đổi phiếu bầu.",
            );
            return;
        }
        setSelectedOptionIds((prev) => {
            if (prev.includes(optionId)) {
                return prev.filter((id) => id !== optionId);
            } else {
                return [...prev, optionId];
            }
        });
    };

    const handleConfirmVote = async () => {
        if (!messageId) return;
        setSubmittingVote(true);
        try {
            await chatApi.votePoll(messageId, selectedOptionIds);
            Alert.alert("Thành công", "Đã cập nhật bình chọn!");
            await loadPollDetail();
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.message || "Không thể thực hiện bình chọn.",
            );
        } finally {
            setSubmittingVote(false);
        }
    };

    const handleAddOption = async () => {
        const text = newOptionText.trim();
        if (!text) {
            Alert.alert("Lỗi", "Vui lòng nhập nội dung phương án.");
            return;
        }
        if (!messageId) return;

        setSubmittingOption(true);
        try {
            await chatApi.addPollOption(messageId, text);
            setNewOptionText("");
            setShowAddModal(false);
            Alert.alert("Thành công", "Đã thêm phương án mới!");
            await loadPollDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể thêm phương án.");
        } finally {
            setSubmittingOption(false);
        }
    };

    if (loading && !poll) {
        return (
            <SafeAreaView className="flex-1 bg-[#f3f4f6] items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-gray-500 mt-2">
                    Đang tải bình chọn...
                </Text>
            </SafeAreaView>
        );
    }

    const isClosed =
        poll?.closed === true ||
        poll?.status === "CLOSED" ||
        poll?.isClosed === true;
    const options = Array.isArray(poll?.options) ? poll.options : [];
    const totalVotes = options.reduce(
        (sum: number, opt: any) => sum + (Number(opt?.voteCount) || 0),
        0,
    );

    return (
        <SafeAreaView className="flex-1 bg-[#f3f4f6]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
            >
                {/* Header */}
                <View className="bg-blue-600 flex-row items-center px-4 py-4 shadow-sm">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-1"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-[18px] ml-4">
                        Chi tiết bình chọn
                    </Text>
                </View>

                <View className="flex-1">
                    <ScrollView
                        className="flex-1 px-4 py-4"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {/* Warning Banner */}
                        {isClosed && (
                            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex-row items-center">
                                <Text className="text-amber-800 text-[13px] font-semibold flex-1">
                                    Bình chọn này đã khóa. Bạn chỉ có thể xem
                                    kết quả.
                                </Text>
                            </View>
                        )}

                        {/* Poll Card Info */}
                        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                            <View className="flex-row items-center mb-2">
                                <Users size={20} color="#2563eb" />
                                <Text className="text-[12px] font-bold text-blue-600 ml-2 uppercase tracking-wider">
                                    Bình chọn nhóm
                                </Text>
                            </View>
                            <Text className="text-[18px] font-bold text-gray-800 mb-2">
                                {poll?.title || poll?.question || "Bình chọn"}
                            </Text>
                            <Text className="text-[13px] text-gray-500 font-medium">
                                Tổng số: {totalVotes} lượt bình chọn
                            </Text>

                            {/* Lock Poll button for author */}
                            {!isClosed && senderId === currentUserId && (
                                <TouchableOpacity
                                    onPress={async () => {
                                        Alert.alert(
                                            "Khóa bình chọn",
                                            "Bạn có chắc chắn muốn khóa bình chọn này không? Sau khi khóa, không ai có thể tiếp tục bình chọn.",
                                            [
                                                {
                                                    text: "Hủy",
                                                    style: "cancel",
                                                },
                                                {
                                                    text: "Khóa",
                                                    style: "destructive",
                                                    onPress: async () => {
                                                        try {
                                                            await chatApi.closePoll(
                                                                messageId ?? "",
                                                            );
                                                            Alert.alert(
                                                                "Thành công",
                                                                "Đã khóa bình chọn.",
                                                                [
                                                                    {
                                                                        text: "OK",
                                                                        onPress:
                                                                            () =>
                                                                                router.back(),
                                                                    },
                                                                ],
                                                            );
                                                        } catch (error: any) {
                                                            Alert.alert(
                                                                "Lỗi",
                                                                "Không thể khóa bình chọn.",
                                                            );
                                                        }
                                                    },
                                                },
                                            ],
                                        );
                                    }}
                                    className="bg-red-50 border border-red-100 rounded-xl py-2.5 items-center justify-center mt-3"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-red-500 font-semibold text-[14px]">
                                        Khóa bình chọn
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Options List */}
                        <Text className="text-gray-500 text-[13px] font-bold uppercase tracking-wider mb-2 ml-1">
                            Phương án lựa chọn
                        </Text>

                        {options.map((opt: any, idx: number) => {
                            const optId = String(
                                opt.id || opt.optionId || opt.value,
                            );
                            const isSelected =
                                selectedOptionIds.includes(optId);
                            const voteCount = Number(opt.voteCount) || 0;
                            const percentage =
                                totalVotes > 0
                                    ? (voteCount / totalVotes) * 100
                                    : 0;

                            const voters = Array.isArray(opt.voters)
                                ? opt.voters
                                : [];

                            return (
                                <View
                                    key={optId}
                                    className="bg-white rounded-2xl p-3 mb-3 shadow-sm border border-gray-100"
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() =>
                                            handleToggleOption(optId)
                                        }
                                        className="flex-row items-center justify-between min-h-[46px] relative rounded-xl overflow-hidden px-3"
                                        style={{ backgroundColor: "#f9fafb" }}
                                    >
                                        {/* Progress Indicator */}
                                        <View
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: `${percentage}%`,
                                                backgroundColor: "#e0f2fe",
                                                zIndex: 1,
                                            }}
                                        />

                                        {/* Checkbox & Label */}
                                        <View
                                            className="flex-row items-center flex-1 mr-3"
                                            style={{ zIndex: 2 }}
                                        >
                                            <View
                                                className={`w-5 h-5 rounded-md border items-center justify-center ${
                                                    isSelected
                                                        ? "bg-blue-600 border-blue-600"
                                                        : "border-gray-300 bg-white"
                                                }`}
                                            >
                                                {isSelected && (
                                                    <Check
                                                        size={14}
                                                        color="white"
                                                    />
                                                )}
                                            </View>
                                            <Text
                                                className="text-[14px] text-gray-800 font-semibold ml-3 flex-1"
                                                numberOfLines={2}
                                            >
                                                {opt.text ||
                                                    opt.optionText ||
                                                    opt.content ||
                                                    `Phương án ${idx + 1}`}
                                            </Text>
                                        </View>

                                        {/* Votes Statistics */}
                                        <View
                                            className="items-end"
                                            style={{ zIndex: 2 }}
                                        >
                                            <Text className="text-[14px] font-bold text-gray-700">
                                                {voteCount}
                                            </Text>
                                            <Text className="text-[11px] text-gray-400 font-medium">
                                                {percentage.toFixed(0)}%
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Voters Details */}
                                    {voters.length > 0 && (
                                        <View className="mt-3 pt-3 border-t border-gray-100 px-1">
                                            <Text className="text-[12px] text-gray-400 font-bold mb-2">
                                                Danh sách bình chọn (
                                                {voters.length}):
                                            </Text>
                                            <View className="flex-row flex-wrap">
                                                {voters.map(
                                                    (
                                                        voter: any,
                                                        vIdx: number,
                                                    ) => {
                                                        const voterId =
                                                            extractValidId(
                                                                voter,
                                                            );
                                                        const profile =
                                                            memberProfiles[
                                                                voterId
                                                            ];
                                                        const displayName =
                                                            profile?.displayName ||
                                                            voter?.displayName ||
                                                            voter?.fullName ||
                                                            "Thành viên";
                                                        const rawAvatar =
                                                            extractAvatar(
                                                                voter,
                                                            ) ||
                                                            profile?.avatarUrl ||
                                                            "";
                                                        const avatarUri =
                                                            rawAvatar
                                                                ? resolveFileUrl(
                                                                      rawAvatar,
                                                                  )
                                                                : "";

                                                        return (
                                                            <View
                                                                key={
                                                                    voterId ||
                                                                    `voter-${vIdx}`
                                                                }
                                                                className="flex-row items-center bg-gray-50 rounded-full px-2.5 py-1.5 mr-2 mb-2 border border-gray-150 shadow-sm"
                                                            >
                                                                {avatarUri ? (
                                                                    <RNImage
                                                                        source={{
                                                                            uri: avatarUri,
                                                                        }}
                                                                        className="w-5 h-5 rounded-full mr-1.5"
                                                                    />
                                                                ) : (
                                                                    <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center mr-1.5">
                                                                        <Text className="text-white text-[9px] font-bold">
                                                                            {getInitials(
                                                                                displayName,
                                                                            ).slice(
                                                                                0,
                                                                                1,
                                                                            )}
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                                <Text className="text-[12px] text-gray-700 font-semibold">
                                                                    {
                                                                        displayName
                                                                    }
                                                                </Text>
                                                            </View>
                                                        );
                                                    },
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* Add Custom Option Button */}
                        {!isClosed && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setShowAddModal(true)}
                                className="flex-row items-center justify-center bg-white rounded-2xl py-3 border border-dashed border-gray-300 shadow-sm mb-6"
                            >
                                <Plus size={18} color="#4b5563" />
                                <Text className="text-gray-600 font-semibold text-[14px] ml-2">
                                    Thêm phương án bình chọn mới
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    {/* Bottom Submit Action Bar */}
                    <View className="bg-white px-4 pt-3 pb-6 border-t border-gray-100 shadow-lg flex-row items-center justify-between">
                        {isClosed ? (
                            <View className="bg-gray-100 rounded-full py-3.5 items-center justify-center border border-gray-200 flex-1 shadow-sm">
                                <Text className="text-gray-500 font-bold text-[15px]">
                                    Bình chọn đã khóa
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View className="flex-1 mr-3">
                                    <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                                        Đang chọn
                                    </Text>
                                    <Text className="text-gray-800 text-[14px] font-bold">
                                        {selectedOptionIds.length} phương án
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleConfirmVote}
                                    disabled={submittingVote}
                                    className="bg-blue-600 rounded-full px-8 py-3.5 items-center justify-center shadow-md flex-row"
                                >
                                    {submittingVote ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="white"
                                        />
                                    ) : (
                                        <Text className="text-white font-bold text-[15px]">
                                            Xác nhận bình chọn
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Add Custom Option Modal */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 bg-black/55 justify-center px-6"
                >
                    <View className="bg-white rounded-3xl p-5 shadow-2xl">
                        <Text className="text-[17px] font-bold text-gray-800 mb-3 text-left">
                            Thêm phương án mới
                        </Text>
                        <TextInput
                            placeholder="Nhập nội dung phương án..."
                            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 text-[15px] mb-4"
                            value={newOptionText}
                            onChangeText={setNewOptionText}
                            autoFocus
                        />
                        <View className="flex-row justify-end items-center">
                            <TouchableOpacity
                                onPress={() => {
                                    setNewOptionText("");
                                    setShowAddModal(false);
                                }}
                                className="px-4 py-2"
                            >
                                <Text className="text-gray-500 font-semibold text-[14px]">
                                    Hủy
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddOption}
                                disabled={submittingOption}
                                className="bg-blue-600 rounded-full px-5 py-2.5 ml-2 shadow-md"
                            >
                                {submittingOption ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="white"
                                    />
                                ) : (
                                    <Text className="text-white font-bold text-[14px]">
                                        Thêm phương án
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
