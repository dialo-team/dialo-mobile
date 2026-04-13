import { friendApi } from "@/src/api/friend/friendApi"; // Bổ sung import API
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useState } from "react";
import {
    Alert, // Thêm Alert để báo lỗi nếu có
    Modal,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function paramStr(v: string | string[] | undefined): string | undefined {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v[0] != null) return v[0];
    return undefined;
}

export default function FriendProfileOptionScreen() {
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
    }>();
    const id = paramStr(params.id);
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);

    const router = useRouter();

    const handleHeaderBack = () => {
        if (id) {
            router.replace({
                pathname: "/(tabs)/contact/friend/[id]" as any,
                params: {
                    id,
                    ...(name != null ? { name } : {}),
                    ...(avatar != null ? { avatar } : {}),
                },
            });
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/(tabs)/contact" as any);
    };

    const [bestFriend, setBestFriend] = useState(false);
    const [notify, setNotify] = useState(true);
    const [blockMyActivity, setBlockMyActivity] = useState(false);
    const [hideTheirActivity, setHideTheirActivity] = useState(false);
    const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* HEADER */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={handleHeaderBack}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg font-semibold ml-4">
                    {name}
                </Text>
            </View>

            <ScrollView>
                {/* INFORMATION */}
                <View className="bg-white mt-2">
                    <SectionTitle title="Thông tin" />

                    <OptionItem
                        title="Đổi tên gợi nhớ"
                        onPress={() =>
                            router.push({
                                pathname: "/contact/friend/[id]",
                                params: {
                                    id,
                                    name,
                                    avatar,
                                    openRename: "1",
                                },
                            } as any)
                        }
                    />

                    <OptionItem
                        title="Đánh dấu bạn thân"
                        right={
                            <Switch
                                value={bestFriend}
                                onValueChange={setBestFriend}
                            />
                        }
                    />

                    <OptionItem title="Giới thiệu cho bạn" />
                </View>

                {/* NOTIFICATION */}
                <View className="bg-white mt-2">
                    <SectionTitle title="Thông báo" />

                    <OptionItem
                        title="Nhận thông báo về hoạt động mới của người này"
                        right={
                            <Switch value={notify} onValueChange={setNotify} />
                        }
                    />
                </View>

                {/* BLOCK & HIDE */}
                <View className="bg-white mt-2">
                    <SectionTitle title="Chặn và ẩn khỏi nhật ký" />

                    <OptionItem
                        title="Chặn xem hoạt động của tôi"
                        right={
                            <Switch
                                value={blockMyActivity}
                                onValueChange={setBlockMyActivity}
                            />
                        }
                    />

                    <OptionItem
                        title="Ẩn hoạt động của người này"
                        right={
                            <Switch
                                value={hideTheirActivity}
                                onValueChange={setHideTheirActivity}
                            />
                        }
                    />
                </View>

                {/* REPORT */}
                <View className="bg-white mt-2">
                    <OptionItem title="Báo xấu" />
                </View>

                {/* DELETE FRIEND */}
                <View className="bg-white mt-2">
                    <TouchableOpacity
                        className="px-4 py-4"
                        onPress={() => setShowUnfriendConfirm(true)}
                    >
                        <Text className="text-red-500 text-[16px]">
                            Xóa bạn
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="h-10" />
            </ScrollView>

            <Modal
                visible={showUnfriendConfirm}
                transparent
                animationType="fade"
            >
                <View className="flex-1 items-center justify-center bg-black/30 px-6">
                    <View className="w-full bg-white rounded-2xl p-5">
                        <Text className="text-lg font-semibold text-center">
                            Xóa bạn
                        </Text>
                        <Text className="text-gray-500 text-center mt-2">
                            Bạn có chắc muốn xóa {name} khỏi danh bạ không?
                        </Text>

                        <View className="flex-row mt-5">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-full bg-gray-100 mr-2 items-center"
                                onPress={() => setShowUnfriendConfirm(false)}
                            >
                                <Text className="text-gray-700 font-medium">
                                    Hủy
                                </Text>
                            </TouchableOpacity>

                            {/* --- ĐÃ GẮN API XÓA BẠN VÀO ĐÂY --- */}
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-full bg-red-500 ml-2 items-center"
                                onPress={async () => {
                                    if (!id) return;
                                    try {
                                        // 1. Gọi API xóa bạn
                                        await friendApi.unfriend(id);

                                        // 2. Tắt modal và điều hướng về trang danh bạ
                                        setShowUnfriendConfirm(false);
                                        router.replace(
                                            "/(tabs)/contact" as any,
                                        );
                                    } catch (error) {
                                        console.log("Lỗi xóa bạn bè:", error);
                                        Alert.alert(
                                            "Lỗi",
                                            "Không thể xóa bạn lúc này, vui lòng thử lại.",
                                        );
                                        setShowUnfriendConfirm(false);
                                    }
                                }}
                            >
                                <Text className="text-white font-medium">
                                    Xóa bạn
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function SectionTitle({ title }: any) {
    return (
        <Text className="text-blue-500 text-[14px] px-4 pt-4 pb-2">
            {title}
        </Text>
    );
}

function OptionItem({ title, right, onPress }: any) {
    return (
        <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-t border-gray-100"
            onPress={onPress}
        >
            <Text className="flex-1 text-[15px]">{title}</Text>
            {right}
        </TouchableOpacity>
    );
}
