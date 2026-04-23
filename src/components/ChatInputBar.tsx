import { Image, Mic, Paperclip, Send, Smile } from "lucide-react-native";
import React, { useCallback, useRef } from "react";
import {
    Animated,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface ChatInputBarProps {
    /** Message text value */
    message: string;
    /** Callback when message changes */
    onMessageChange: (text: string) => void;
    /** Callback when send button pressed */
    onSend: () => void;
    /** Callback when attach file pressed */
    onAttachFile?: () => void;
    /** Callback when pick media pressed */
    onPickMedia?: () => void;
    /** Callback when pick/send voice pressed */
    onPickVoice?: () => void;
    /** Callback when emoji button pressed */
    onEmojiPress?: () => void;
    /** Show emoji menu state (for controlled emoji menu) */
    showEmojiMenu?: boolean;
    /** Callback for emoji select */
    onEmojiSelect?: (emoji: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Is loading/sending */
    isLoading?: boolean;
    /** Disabled state */
    isDisabled?: boolean;
    /** For group chat: disable all features */
    isGroupChat?: boolean;

    // Direct chat block features
    /** Is blocked by current user */
    isBlockedByMe?: boolean;
    /** Is blocked by the other user */
    isBlockedByThem?: boolean;
    /** Callback to unblock user */
    onUnblock?: () => void;
    /** Display name for blocked message */
    displayName?: string;

    // Customization
    /** Custom container style */
    containerClassName?: string;
    /** Custom input style */
    inputClassName?: string;
    /** Show emoji button */
    showEmojiButton?: boolean;
    /** Show attachment button */
    showAttachButton?: boolean;
    /** Show media button */
    showMediaButton?: boolean;
    /** Show more menu button (for group) */
    showMoreButton?: boolean;
    /** Custom emojis list */
    customEmojis?: string[];
}

/**
 * ChatInputBar - Reusable text input component for both direct and group chat
 *
 * Features:
 * - Direct chat: Block status handling (isBlockedByMe, isBlockedByThem)
 * - Group chat: Simple input without block features
 * - Customizable buttons and callbacks
 * - Emoji quick select menu
 * - Loading states
 */
const ChatInputBar = React.forwardRef<TextInput, ChatInputBarProps>(
    (props, ref) => {
        const {
            message,
            onMessageChange,
            onSend,
            onAttachFile,
            onPickMedia,
            onPickVoice,
            onEmojiPress,
            showEmojiMenu = false,
            onEmojiSelect,
            placeholder = "Nhập tin nhắn",
            isLoading = false,
            isDisabled = false,
            isGroupChat = false,
            isBlockedByMe = false,
            isBlockedByThem = false,
            onUnblock,
            displayName = "Người dùng",
            containerClassName = "",
            inputClassName = "",
            showEmojiButton = true,
            showAttachButton = true,
            showMediaButton = true,
            showMoreButton = false,
            customEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"],
        } = props;

        const scaleAnim = useRef(new Animated.Value(1)).current;

        // Handle emoji select with animation
        const handleEmojiSelect = useCallback(
            (emoji: string) => {
                onEmojiSelect?.(emoji);
                // Animate emoji button
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 0.9,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start();
            },
            [onEmojiSelect, scaleAnim],
        );

        // Handle send with visual feedback
        const handleSendPress = useCallback(() => {
            if (message.trim() && !isLoading && !isDisabled) {
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 0.85,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start();
                onSend();
            }
        }, [message, isLoading, isDisabled, onSend, scaleAnim]);

        const canSend = message.trim() && !isLoading && !isDisabled;
        const sendButtonColor = canSend ? "#2563eb" : "#999";

        // Blocked by me state
        if (isBlockedByMe) {
            return (
                <View
                    className={`bg-white px-4 pt-4 pb-8 border-t border-gray-100 items-center ${containerClassName}`}
                >
                    <Text className="text-gray-800 text-sm mb-4 font-medium">
                        Bạn đã chặn tin nhắn
                    </Text>
                    <TouchableOpacity
                        className="bg-[#e9f2ff] py-3 rounded-full w-full items-center"
                        onPress={onUnblock}
                        disabled={isLoading}
                    >
                        <Text className="text-blue-600 font-semibold text-[16px]">
                            Bỏ chặn
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Blocked by them state
        if (isBlockedByThem) {
            return (
                <View
                    className={`bg-white px-4 pt-4 pb-8 border-t border-gray-100 items-center ${containerClassName}`}
                >
                    <Text className="text-gray-800 text-sm mb-4 font-medium">
                        {displayName} đã chặn tin nhắn của bạn
                    </Text>
                    <Text className="text-gray-600 text-xs text-center">
                        Bạn không thể gửi tin nhắn đến họ
                    </Text>
                </View>
            );
        }

        // Normal input bar
        return (
            <View
                className={`bg-white border-t border-gray-200 px-3 py-2 flex-row items-center ${containerClassName}`}
            >
                {/* Emoji button with popup menu */}
                {showEmojiButton && (
                    <View className="relative z-50">
                        {showEmojiMenu && (
                            <View
                                className="absolute bottom-12 -left-2 bg-white rounded-full shadow-lg border border-gray-200 flex-row px-3 py-2 items-center"
                                style={{ elevation: 5 }}
                            >
                                {customEmojis.map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        onPress={() => handleEmojiSelect(emoji)}
                                        className="mx-2"
                                        accessibilityLabel={`Select ${emoji} emoji`}
                                    >
                                        <Text className="text-2xl">
                                            {emoji}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity
                            className="mr-2 p-1"
                            onPress={onEmojiPress}
                            disabled={isDisabled}
                            accessibilityLabel="Emoji menu"
                        >
                            <Smile
                                size={26}
                                color={isDisabled ? "#ccc" : "#666"}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Attach file button */}
                {showAttachButton && (
                    <TouchableOpacity
                        className="mr-2 p-1"
                        onPress={onAttachFile}
                        disabled={isDisabled}
                        accessibilityLabel="Attach file"
                    >
                        <Paperclip
                            size={22}
                            color={isDisabled ? "#ccc" : "#6b7280"}
                        />
                    </TouchableOpacity>
                )}

                {/* Text input */}
                <TextInput
                    ref={ref}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={message}
                    onChangeText={onMessageChange}
                    editable={!isDisabled && !isLoading}
                    multiline
                    maxLength={2000}
                    className={`flex-1 bg-gray-100 px-4 py-2 rounded-full text-[15px] ${inputClassName}`}
                    style={{
                        maxHeight: 100,
                        color: isDisabled ? "#ccc" : "#000",
                    }}
                />

                {/* Media button */}
                {showMediaButton && (
                    <TouchableOpacity
                        className="ml-2 p-1"
                        onPress={onPickMedia}
                        disabled={isDisabled}
                        accessibilityLabel="Pick media"
                    >
                        <Image size={26} color={isDisabled ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                )}

                {/* More button (for group chat or other features) */}
                {showMoreButton && (
                    <TouchableOpacity
                        className="ml-2 p-1"
                        onPress={onPickVoice}
                        disabled={isDisabled}
                        accessibilityLabel="More options"
                    >
                        <Mic size={26} color={isDisabled ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                )}

                {/* Send button */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                        className="ml-2 p-1"
                        onPress={handleSendPress}
                        disabled={!canSend || isLoading}
                        accessibilityLabel="Send message"
                    >
                        <Send
                            size={26}
                            color={sendButtonColor}
                            strokeWidth={2.5}
                        />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    },
);

ChatInputBar.displayName = "ChatInputBar";

export default ChatInputBar;
