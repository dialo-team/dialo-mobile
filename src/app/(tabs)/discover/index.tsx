import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiscoverScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 bg-white items-center justify-center">
                <Text className="text-xl text-gray-500">Khám phá</Text>
            </View>
        </SafeAreaView>
    );
}
