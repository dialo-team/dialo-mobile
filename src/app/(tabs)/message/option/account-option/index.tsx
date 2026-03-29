import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Bell,
    Clock,
    EyeOff,
    FileImage,
    Flag,
    Folder,
    MoveLeft,
    Pin,
    Shield,
    Trash,
    User,
    UserPlus,
    Users,
} from "lucide-react-native";
import {
    Image,
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

export default function ChatOptionsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        from?: string | string[];
    }>();
    const id = paramStr(params.id);
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);
    const from = paramStr(params.from);

    const handleHeaderBack = () => {
        if (id) {
            router.replace({
                pathname: "/(tabs)/message/chat/[id]" as any,
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
        router.replace("/(tabs)/message" as any);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* HEADER */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={handleHeaderBack}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg ml-10 font-semibold">
                    Tuỳ chọn
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* PROFILE */}
                <View className="bg-white items-center py-6">
                    <Image
                        source={{ uri: avatar as string }}
                        className="w-24 h-24 rounded-full"
                    />
                    <Text className="text-xl font-semibold mt-3">{name}</Text>

                    {/* ACTIONS */}
                    <View className="flex-row justify-around w-full mt-6">
                        <View className="items-center">
                            <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                                <Bell size={22} />
                            </TouchableOpacity>
                            <Text className="text-xs mt-1">Tìm tin nhắn</Text>
                        </View>

                        <View className="items-center">
                            <TouchableOpacity
                                className="bg-gray-100 p-3 rounded-full"
                                onPress={() =>
                                    router.push({
                                        pathname: "/(tabs)/contact/friend/[id]",
                                        params: {
                                            id,
                                            name,
                                            avatar,
                                        },
                                    })
                                }
                            >
                                <User size={22} />
                            </TouchableOpacity>
                            <Text className="text-xs mt-1">Trang cá nhân</Text>
                        </View>

                        <View className="items-center">
                            <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                                <Pin size={22} />
                            </TouchableOpacity>
                            <Text className="text-xs mt-1">Đổi hình nền</Text>
                        </View>

                        <View className="items-center">
                            <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                                <Bell size={22} />
                            </TouchableOpacity>
                            <Text className="text-xs mt-1">Tắt thông báo</Text>
                        </View>
                    </View>
                </View>

                {/* OPTION LIST */}
                <View className="bg-white mt-2">
                    <OptionItem
                        icon={<User size={20} />}
                        title="Đổi tên gợi nhớ"
                    />

                    <OptionItem
                        icon={<Pin size={20} />}
                        title="Đánh dấu bạn thân"
                        right={<Switch />}
                    />

                    <OptionItem
                        icon={<Clock size={20} />}
                        title="Nhật ký chung"
                    />
                    <OptionItem
                        icon={<FileImage size={20} />}
                        title="Ảnh, file, link"
                    />
                </View>

                {/* GROUP OPTIONS */}
                <View className="bg-white mt-2">
                    <OptionItem
                        icon={<Users size={20} />}
                        title={`Tạo nhóm với ${name}`}
                    />
                    <OptionItem
                        icon={<UserPlus size={20} />}
                        title={`Thêm ${name} vào nhóm`}
                    />
                    <OptionItem
                        icon={<Users size={20} />}
                        title="Xem nhóm chung (4)"
                    />
                </View>

                {/* CHAT SETTINGS */}
                <View className="bg-white mt-2">
                    <OptionItem
                        icon={<Pin size={20} />}
                        title="Ghim trò chuyện"
                        right={<Switch />}
                    />

                    <OptionItem
                        icon={<EyeOff size={20} />}
                        title="Ẩn trò chuyện"
                        right={<Switch />}
                    />

                    <OptionItem
                        icon={<Bell size={20} />}
                        title="Báo cuộc gọi đến"
                        right={<Switch value={true} />}
                    />

                    <OptionItem
                        icon={<Shield size={20} />}
                        title="Cài đặt cá nhân"
                    />
                    <OptionItem
                        icon={<Clock size={20} />}
                        title="Tin nhắn tự xoá"
                    />
                </View>

                {/* DANGER ZONE */}
                <View className="bg-white mt-2">
                    <OptionItem icon={<Flag size={20} />} title="Báo xấu" />
                    <OptionItem
                        icon={<Shield size={20} />}
                        title="Quản lý chặn"
                    />
                    <OptionItem
                        icon={<Folder size={20} />}
                        title="Dung lượng trò chuyện"
                    />
                    <OptionItem
                        icon={<Trash size={20} />}
                        title="Xóa lịch sử trò chuyện"
                    />
                </View>
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}

function OptionItem({ icon, title, right }: any) {
    return (
        <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <View className="mr-3">{icon}</View>
            <Text className="flex-1 text-[15px]">{title}</Text>
            {right}
        </TouchableOpacity>
    );
}
