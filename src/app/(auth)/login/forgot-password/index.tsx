import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordPage() {
    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
            className="bg-white"
        >
            <View className="flex-1 items-center justify-center">
                <Text>Forgot Password Page</Text>
            </View>
        </SafeAreaView>
    );
}
