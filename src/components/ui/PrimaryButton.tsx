import { Text, TouchableOpacity } from "react-native";

type PrimaryButtonProps = {
    label: string;
    disabled?: boolean;
    onPress: () => void;
    loadingLabel?: string;
    isLoading?: boolean;
    className?: string;
};

export default function PrimaryButton({
    label,
    disabled,
    onPress,
    loadingLabel,
    isLoading,
    className = "",
}: PrimaryButtonProps) {
    const isDisabled = Boolean(disabled || isLoading);

    return (
        <TouchableOpacity
            disabled={isDisabled}
            onPress={onPress}
            activeOpacity={0.85}
            className={`h-12 rounded-full items-center justify-center ${
                isDisabled ? "bg-gray-300" : "bg-blue-600"
            } ${className}`}
        >
            <Text
                className={`font-semibold text-base ${
                    isDisabled ? "text-gray-500" : "text-white"
                }`}
            >
                {isLoading ? loadingLabel || "Đang xử lý..." : label}
            </Text>
        </TouchableOpacity>
    );
}
