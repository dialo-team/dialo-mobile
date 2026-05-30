import { Audio } from "expo-av";
import { Pause, Play } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type VoicePlayerProps = {
    uri: string;
    isMe: boolean;
};

const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
};

export default function VoicePlayer({ uri, isMe }: VoicePlayerProps) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const loadingRef = useRef(false); // synchronous guard against double-tap race
    const mountedRef = useRef(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [positionMs, setPositionMs] = useState<number | null>(null);

    // Cleanup on unmount and when uri changes
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            soundRef.current?.unloadAsync().catch(() => {});
            soundRef.current = null;
            loadingRef.current = false;
        };
    }, [uri]); // re-run when uri changes to unload stale sound

    const handlePress = async () => {
        // Synchronous guard — prevents double-tap race before re-render
        if (loadingRef.current) return;

        if (isPlaying && soundRef.current) {
            await soundRef.current.pauseAsync().catch(() => {});
            if (mountedRef.current) setIsPlaying(false);
            return;
        }

        if (soundRef.current) {
            await soundRef.current.playAsync().catch(() => {});
            if (mountedRef.current) setIsPlaying(true);
            return;
        }

        loadingRef.current = true;
        if (mountedRef.current) setIsLoading(true);

        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                (status) => {
                    if (!status.isLoaded || !mountedRef.current) return;
                    if (status.durationMillis)
                        setDurationMs(status.durationMillis);
                    setPositionMs(status.positionMillis);
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setPositionMs(0);
                        // Use soundRef.current, not the local `sound` variable — by the time
                        // didJustFinish fires, the local reference may have been unloaded if
                        // the component unmounted or the uri changed. soundRef.current is the
                        // live reference; if it's been cleared we skip the reset safely.
                        soundRef.current?.setPositionAsync(0).catch(() => {});
                    }
                },
            );

            if (!mountedRef.current) {
                await sound.unloadAsync().catch(() => {});
                return;
            }

            soundRef.current = sound;
            setIsPlaying(true);
        } catch (e) {
            console.error("VoicePlayer error:", e);
        } finally {
            loadingRef.current = false;
            if (mountedRef.current) setIsLoading(false);
        }
    };

    const progress =
        durationMs && positionMs != null ? positionMs / durationMs : 0;

    const trackBg = isMe ? "rgba(255,255,255,0.25)" : "#e5e7eb";
    const fillBg = isMe ? "rgba(255,255,255,0.85)" : "#3b82f6";
    const btnBg = "#3b82f6";

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.75}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: isMe ? "rgba(0,0,0,0.12)" : "#f3f4f6",
                minWidth: 140,
                maxWidth: 220,
                marginBottom: 2,
            }}
        >
            {/* Play/Pause button */}
            <View
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: btnBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                }}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : isPlaying ? (
                    <Pause size={15} color="#fff" />
                ) : (
                    <Play size={15} color="#fff" />
                )}
            </View>

            {/* Progress + time */}
            <View style={{ flex: 1 }}>
                {/* Track bar — uses absolute positioning to avoid % string issues on older RN */}
                <View
                    style={{
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: trackBg,
                        marginBottom: 4,
                        overflow: "hidden",
                    }}
                    onLayout={(e) => {
                        // store track width for accurate fill computation if needed
                        void e.nativeEvent.layout.width;
                    }}
                >
                    <View
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${Math.min(100, Math.round(progress * 100))}%`,
                            backgroundColor: fillBg,
                            borderRadius: 2,
                        }}
                    />
                </View>

                {/* Time label */}
                <Text
                    style={{
                        fontSize: 11,
                        color: isMe ? "rgba(255,255,255,0.85)" : "#6b7280",
                        fontVariant: ["tabular-nums"],
                    }}
                >
                    {positionMs != null && positionMs > 0
                        ? formatTime(positionMs)
                        : durationMs != null
                          ? formatTime(durationMs)
                          : "Tin nhắn thoại"}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
