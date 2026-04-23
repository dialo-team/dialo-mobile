import { ChevronRight, Pin, PinOff } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PinnedMessage {
    messageId: string;
    content: string;
}

interface PinnedMessageBarProps {
    pinnedMessages: PinnedMessage[];
    onUnpin: (messageId: string) => void;
    onPress: (messageId: string) => void; // Để scroll tới tin nhắn đó
}

export const PinnedMessageBar: React.FC<PinnedMessageBarProps> = ({
    pinnedMessages,
    onUnpin,
    onPress,
}) => {
    if (!pinnedMessages || pinnedMessages.length === 0) return null;

    // Lấy tin nhắn ghim mới nhất để hiển thị
    const latestPin = pinnedMessages[pinnedMessages.length - 1];

    return (
        <View className="bg-white/95 mx-3 mt-2 rounded-xl border-l-4 border-blue-500 px-3 py-2 flex-row items-center shadow-sm">
            <TouchableOpacity
                className="flex-row items-center flex-1"
                onPress={() => onPress(latestPin.messageId)}
            >
                <Pin size={16} color="#2563eb" />
                <View className="ml-2 flex-1">
                    <Text className="text-blue-600 font-bold text-[11px] uppercase">
                        Tin nhắn đã ghim ({pinnedMessages.length})
                    </Text>
                    <Text
                        numberOfLines={1}
                        className="text-gray-600 text-[13px]"
                    >
                        {latestPin.content || "Nội dung đính kèm"}
                    </Text>
                </View>
                <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>

            <View className="w-[1px] h-6 bg-gray-200 mx-2" />

            <TouchableOpacity
                onPress={() => onUnpin(latestPin.messageId)}
                className="p-1"
            >
                <PinOff size={18} color="#9ca3af" />
            </TouchableOpacity>
        </View>
    );
};
