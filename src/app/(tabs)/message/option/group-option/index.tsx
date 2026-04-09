import { useLocalSearchParams, useRouter } from "expo-router";
import {
    BarChart3,
    Bell,
    Clock,
    EyeOff,
    Flag,
    Image as ImageIcon,
    Link,
    MoveLeft,
    Pin,
    Trash,
    UserPlus,
    Users,
} from "lucide-react-native";

import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupChatOptionsScreen() {
    const router = useRouter();
    const { id, avatar, name } = useLocalSearchParams();

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* HEADER */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={() => router.back()}>
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-lg ml-6 font-semibold">
                    Tuỳ chọn
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* GROUP PROFILE */}
                <View className="bg-white items-center py-6">
                    <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                        <Users size={40} color="#6b7280" />
                    </View>

                    <Text className="text-xl font-semibold mt-3 text-center px-6">
                        {name}
                    </Text>

                    {/* ACTION BUTTONS */}
                    <View className="flex-row justify-around w-full mt-6">
                        <Action
                            icon={<ImageIcon size={22} />}
                            title="Tìm tin nhắn"
                        />
                        <Action
                            icon={<UserPlus size={22} />}
                            title="Thêm thành viên"
                        />
                        <Action
                            icon={<ImageIcon size={22} />}
                            title="Đổi hình nền"
                        />
                        <Action
                            icon={<Bell size={22} />}
                            title="Tắt thông báo"
                        />
                    </View>
                </View>

                {/* DESCRIPTION */}
                <View className="bg-white mt-2">
                    <OptionItem title="Thêm mô tả nhóm" />
                </View>

                {/* MEDIA */}
                <View className="bg-white mt-2">
                    <OptionItem
                        icon={<ImageIcon size={20} />}
                        title="Ảnh, file, link"
                    />
                </View>

                {/* GROUP FEATURES */}
                <View className="bg-white mt-2">
                    <OptionItem icon={<Clock size={20} />} title="Lịch nhóm" />

                    <OptionItem
                        icon={<Pin size={20} />}
                        title="Tin nhắn đã ghim"
                    />

                    <OptionItem
                        icon={<BarChart3 size={20} />}
                        title="Bình chọn"
                    />
                </View>

                {/* MEMBERS */}
                <View className="bg-white mt-2">
                    <OptionItem
                        icon={<Users size={20} />}
                        title="Xem thành viên (47)"
                    />

                    <OptionItem
                        icon={<Link size={20} />}
                        title="Link nhóm"
                        description="https://zalo.me/g/fammlp886"
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
                        icon={<Users size={20} />}
                        title="Cài đặt cá nhân"
                    />
                </View>

                {/* SECURITY */}
                <View className="bg-white mt-2">
                    <OptionItem icon={<Flag size={20} />} title="Báo xấu" />

                    <OptionItem
                        icon={<Clock size={20} />}
                        title="Dung lượng trò chuyện"
                    />

                    <OptionItem
                        icon={<Trash size={20} />}
                        title="Xóa lịch sử trò chuyện"
                    />
                </View>

                {/* LEAVE GROUP */}
                <View className="bg-white mt-2">
                    <TouchableOpacity className="px-4 py-4 items-center">
                        <Text className="text-red-500 text-[15px] font-medium">
                            Rời nhóm
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    );
}

function OptionItem({ icon, title, description, right }: any) {
    return (
        <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            {icon && <View className="mr-3">{icon}</View>}

            <View className="flex-1">
                <Text className="text-[15px]">{title}</Text>

                {description && (
                    <Text className="text-gray-400 text-xs mt-1">
                        {description}
                    </Text>
                )}
            </View>

            {right}
        </TouchableOpacity>
    );
}

function Action({ icon, title }: any) {
    return (
        <View className="items-center">
            <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                {icon}
            </TouchableOpacity>
            <Text className="text-xs mt-1">{title}</Text>
        </View>
    );
}
