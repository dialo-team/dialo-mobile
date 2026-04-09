import { MoveLeft } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

type BackHeaderProps = {
    onBack: () => void;
};

export default function BackHeader({ onBack }: BackHeaderProps) {
    return (
        <View className="h-14 justify-center">
            <TouchableOpacity
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MoveLeft size={24} color="gray" />
            </TouchableOpacity>
        </View>
    );
}
