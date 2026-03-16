import { useLocalSearchParams, useRouter } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FriendProfileOptionScreen() {
    const { id, name } = useLocalSearchParams();

    const router = useRouter();

    const [bestFriend, setBestFriend] = useState(false);
    const [notify, setNotify] = useState(true);
    const [blockMyActivity, setBlockMyActivity] = useState(false);
    const [hideTheirActivity, setHideTheirActivity] = useState(false);

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* HEADER */}
            <View className="bg-blue-600 flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={() => router.back()}>
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

                    <OptionItem title="Đổi tên gợi nhớ" />

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
                    <TouchableOpacity className="px-4 py-4">
                        <Text className="text-red-500 text-[16px]">
                            Xóa bạn
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="h-10" />
            </ScrollView>
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

function OptionItem({ title, right }: any) {
    return (
        <TouchableOpacity className="flex-row items-center px-4 py-4 border-t border-gray-100">
            <Text className="flex-1 text-[15px]">{title}</Text>
            {right}
        </TouchableOpacity>
    );
}
