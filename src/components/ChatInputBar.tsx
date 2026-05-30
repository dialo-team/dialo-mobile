import { Image, Mic, Paperclip, Send, Smile, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    PanResponder,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface ChatInputBarProps {
    message: string;
    onMessageChange: (text: string) => void;
    onSend: () => void;
    onAttachFile?: () => void;
    onPickMedia?: () => void;
    onPickVoice?: () => void;
    onVoiceRecordStart?: () => void;
    onVoiceRecordStop?: () => void;
    onVoiceRecordCancel?: () => void;
    isRecording?: boolean;
    recordingSeconds?: number;
    onEmojiPress?: () => void;
    showEmojiMenu?: boolean;
    onEmojiSelect?: (emoji: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    isDisabled?: boolean;
    isGroupChat?: boolean;
    isBlockedByMe?: boolean;
    isBlockedByThem?: boolean;
    onUnblock?: () => void;
    displayName?: string;
    containerClassName?: string;
    inputClassName?: string;
    showEmojiButton?: boolean;
    showAttachButton?: boolean;
    showMediaButton?: boolean;
    showMoreButton?: boolean;
    customEmojis?: string[];
}

const formatSeconds = (s?: number) => {
    if (!s || s <= 0) return "00:00";
    const mm = Math.floor(s / 60)
        .toString()
        .padStart(2, "0");
    const ss = Math.floor(s % 60)
        .toString()
        .padStart(2, "0");
    return `${mm}:${ss}`;
};

// ─── Recording Bar (shown instead of the normal input row during recording) ──
function RecordingBar({
    seconds,
    isCanceling,
    onCancel,
}: {
    seconds: number;
    isCanceling: boolean;
    onCancel: () => void;
}) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: isCanceling ? "#fef2f2" : "#fff",
                borderTopWidth: 1,
                borderTopColor: "#e5e7eb",
            }}
        >
            {/* Cancel button */}
            <TouchableOpacity
                onPress={onCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#f3f4f6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                }}
            >
                <X size={16} color="#6b7280" />
            </TouchableOpacity>

            {/* Waveform + label */}
            <View
                style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            >
                <Animated.View
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: isCanceling ? "#9ca3af" : "#ef4444",
                        marginRight: 8,
                        opacity: isCanceling ? 1 : pulseAnim,
                    }}
                />
                <Text
                    style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: isCanceling ? "#9ca3af" : "#ef4444",
                        marginRight: 8,
                    }}
                >
                    {formatSeconds(seconds)}
                </Text>
                <Text style={{ fontSize: 13, color: "#9ca3af" }}>
                    {isCanceling ? "Nhả để hủy" : "Đang ghi âm..."}
                </Text>
            </View>

            {/* Swipe hint (only when NOT in cancel mode) */}
            {!isCanceling && (
                <Text
                    style={{ fontSize: 12, color: "#d1d5db", marginRight: 4 }}
                >
                    ← Vuốt
                </Text>
            )}
        </View>
    );
}

// ─── Main component ─────────────────────────────────────────────────────────
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
            onVoiceRecordStart,
            onVoiceRecordStop,
            onVoiceRecordCancel,
        } = props;

        // Recording cancel-swipe state — tracked locally for UI feedback only
        const [isSwipeCanceling, setIsSwipeCanceling] = useState(false);

        const scaleAnim = useRef(new Animated.Value(1)).current;

        const handleEmojiSelect = useCallback(
            (emoji: string) => {
                onEmojiSelect?.(emoji);
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

        // ── Blocked states ─────────────────────────────────────────────────
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

        // ── Recording state → show recording bar instead of normal input ──
        if (props.isRecording) {
            return (
                <View className={containerClassName}>
                    <RecordingBar
                        seconds={props.recordingSeconds ?? 0}
                        isCanceling={isSwipeCanceling}
                        onCancel={() => {
                            setIsSwipeCanceling(false);
                            onVoiceRecordCancel?.();
                        }}
                    />
                    {/* Invisible VoiceRecordControl so gestures still work */}
                    <View
                        style={{
                            position: "absolute",
                            right: 12,
                            bottom: 8,
                        }}
                    >
                        <VoiceRecordControl
                            onStart={onVoiceRecordStart}
                            onStop={onVoiceRecordStop}
                            onCancel={onVoiceRecordCancel}
                            onShortPress={onPickVoice}
                            onSwipeCancelChange={setIsSwipeCanceling}
                            disabled={false}
                        />
                    </View>
                </View>
            );
        }

        // ── Normal input bar ───────────────────────────────────────────────
        return (
            <View
                className={`bg-white border-t border-gray-200 px-3 py-2 flex-row items-center ${containerClassName}`}
            >
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
                        >
                            <Smile
                                size={26}
                                color={isDisabled ? "#ccc" : "#666"}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {showAttachButton && (
                    <TouchableOpacity
                        className="mr-2 p-1"
                        onPress={onAttachFile}
                        disabled={isDisabled}
                    >
                        <Paperclip
                            size={22}
                            color={isDisabled ? "#ccc" : "#6b7280"}
                        />
                    </TouchableOpacity>
                )}

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

                {showMediaButton && (
                    <TouchableOpacity
                        className="ml-2 p-1"
                        onPress={onPickMedia}
                        disabled={isDisabled}
                    >
                        <Image size={26} color={isDisabled ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                )}

                {showMoreButton && (
                    <VoiceRecordControl
                        onStart={onVoiceRecordStart}
                        onStop={onVoiceRecordStop}
                        onCancel={onVoiceRecordCancel}
                        onShortPress={onPickVoice}
                        onSwipeCancelChange={setIsSwipeCanceling}
                        disabled={isDisabled}
                    />
                )}

                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                        className="ml-2 p-1"
                        onPress={handleSendPress}
                        disabled={!canSend || isLoading}
                    >
                        <Send
                            size={26}
                            color={canSend ? "#2563eb" : "#999"}
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

// ─── VoiceRecordControl ──────────────────────────────────────────────────────
//
// PanResponder callbacks are created ONCE (inside useRef) and their closures
// never re-capture React state/props. Every value read inside a callback must
// live in a ref that is kept in sync on every render.
//
const HOLD_THRESHOLD_MS = 350; // shorter than this → short tap → pick file

const VoiceRecordControl: React.FC<{
    onStart?: () => void;
    onStop?: () => void;
    onCancel?: () => void;
    onShortPress?: () => void;
    onSwipeCancelChange?: (canceling: boolean) => void;
    disabled?: boolean;
}> = ({
    onStart,
    onStop,
    onCancel,
    onShortPress,
    onSwipeCancelChange,
    disabled,
}) => {
    const [isRecording, setIsRecording] = useState(false);

    // Refs — updated every render, read safely inside stale PanResponder closures
    const disabledRef = useRef(disabled);
    const isRecordingRef = useRef(false);
    const isCanceledRef = useRef(false);
    const pressStartRef = useRef(0);
    const onStartRef = useRef(onStart);
    const onStopRef = useRef(onStop);
    const onCancelRef = useRef(onCancel);
    const onShortPressRef = useRef(onShortPress);
    const onSwipeCancelChangeRef = useRef(onSwipeCancelChange);

    disabledRef.current = disabled;
    onStartRef.current = onStart;
    onStopRef.current = onStop;
    onCancelRef.current = onCancel;
    onShortPressRef.current = onShortPress;
    onSwipeCancelChangeRef.current = onSwipeCancelChange;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !disabledRef.current,
            onMoveShouldSetPanResponder: () => !disabledRef.current,

            onPanResponderGrant: () => {
                if (disabledRef.current) return;
                pressStartRef.current = Date.now();
                isCanceledRef.current = false;
                isRecordingRef.current = true;
                setIsRecording(true);
                onSwipeCancelChangeRef.current?.(false);
                onStartRef.current?.();
            },

            onPanResponderMove: (_, gs) => {
                if (!isRecordingRef.current) return;
                const nowCanceled = gs.dx < -60;
                if (nowCanceled !== isCanceledRef.current) {
                    isCanceledRef.current = nowCanceled;
                    onSwipeCancelChangeRef.current?.(nowCanceled);
                }
            },

            onPanResponderRelease: () => {
                if (!isRecordingRef.current) return;
                const holdMs = Date.now() - pressStartRef.current;
                const wasCanceled = isCanceledRef.current;

                isRecordingRef.current = false;
                isCanceledRef.current = false;
                setIsRecording(false);
                onSwipeCancelChangeRef.current?.(false);

                if (holdMs < HOLD_THRESHOLD_MS) {
                    // Short tap — cancel the started recording, then open file picker
                    onCancelRef.current?.();
                    onShortPressRef.current?.();
                } else if (wasCanceled) {
                    onCancelRef.current?.();
                } else {
                    onStopRef.current?.();
                }
            },

            onPanResponderTerminate: () => {
                isRecordingRef.current = false;
                isCanceledRef.current = false;
                setIsRecording(false);
                onSwipeCancelChangeRef.current?.(false);
                onCancelRef.current?.();
            },
        }),
    ).current;

    return (
        <View
            style={{ marginLeft: 8, padding: 4 }}
            {...panResponder.panHandlers}
        >
            <Mic
                size={26}
                color={disabled ? "#ccc" : isRecording ? "#2563eb" : "#666"}
            />
        </View>
    );
};
