import { chatApi } from "@/src/api/chat/chatApi";
import {
    AudioSession,
    LiveKitRoom,
    useLocalParticipant,
    useParticipants,
    VideoTrack,
} from "@livekit/react-native";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import { Track } from "livekit-client";
import {
    Mic,
    MicOff,
    PhoneOff,
    SwitchCamera,
    Video,
    VideoOff,
    Volume2,
    VolumeX,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { videoApi } from "../../api/video/videoApi";
import { useCall } from "../../providers/CallProvider";

const CallRoomContent = () => {
    const { endActiveCall, activeRoomId, currentUser, isCaller, incomingCall } =
        useCall();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();

    // Khởi tạo trạng thái tắt camera và mic ban đầu
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(
        "user",
    );

    const toggleSpeaker = async () => {
        const next = !isSpeaker;
        setIsSpeaker(next);
        try {
            const deviceId =
                Platform.OS === "ios"
                    ? next
                        ? "force_speaker"
                        : "default"
                    : next
                      ? "speaker"
                      : "earpiece";
            await AudioSession.selectAudioOutput(deviceId);
        } catch (e) {
            console.log("Error setting audio output:", e);
        }
    };

    const handleEndCall = async () => {
        if (activeRoomId) {
            try {
                if (
                    participants.length === 1 &&
                    duration === 0 &&
                    currentUser
                ) {
                    await chatApi.sendMessage({
                        conversationId: activeRoomId,
                        senderId: currentUser.id,
                        type: "SYSTEM",
                        content: "Bạn đã huỷ cuộc gọi",
                    });
                }
                // Bạn có thể cần truyền danh sách recipientIds nếu có
                await videoApi.endCall({
                    conversationId: activeRoomId,
                    recipientIds: [], // Chú ý: Backend cần cho phép mảng rỗng hoặc bạn phải lưu danh sách recipient
                });
            } catch (error) {
                console.error("Lỗi khi gọi API endCall:", error);
            }
        }
        endActiveCall();
    };

    const toggleMic = async () => {
        const nextState = !isMicOn;
        setIsMicOn(nextState);
        if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(nextState);
        }
    };

    const toggleCam = async () => {
        const nextState = !isCamOn;
        setIsCamOn(nextState);
        if (localParticipant) {
            await localParticipant.setCameraEnabled(nextState);
        }
    };

    const switchCamera = async () => {
        const nextMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(nextMode);
        const trackPub = localParticipant?.getTrackPublication(
            Track.Source.Camera,
        );
        if (trackPub?.videoTrack) {
            // Sử dụng restartTrack của LiveKit để đổi camera chuẩn xác
            await trackPub.videoTrack.restartTrack({ facingMode: nextMode });
        }
    };

    const getAvatarUrl = (identity: string) => {
        if (identity === currentUser?.id) return currentUser?.avatar;
        if (identity === incomingCall?.callerId)
            return incomingCall?.callerAvatar;
        return null;
    };

    const renderParticipant = (
        p: any,
        customClassName: string,
        avatarSize: number = 80,
    ) => {
        if (!p) return null;
        const trackPub = p.getTrackPublication(Track.Source.Camera);
        const isVideoEnabled =
            trackPub &&
            trackPub.isSubscribed &&
            trackPub.track &&
            !trackPub.isMuted;
        const isLocal = p.identity === localParticipant?.identity;
        const showVideo = isLocal ? isCamOn : isVideoEnabled;
        const avatarUrl = getAvatarUrl(p.identity);

        return (
            <View key={p.identity} className={customClassName}>
                {showVideo && trackPub?.track ? (
                    <VideoTrack
                        trackRef={{
                            participant: p,
                            publication: trackPub,
                            source: Track.Source.Camera,
                        }}
                        style={StyleSheet.absoluteFillObject}
                        mirror={isLocal && facingMode === "user"}
                    />
                ) : (
                    <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-[#222]">
                        <View
                            style={{
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                            }}
                            className="items-center justify-center bg-[#444] overflow-hidden"
                        >
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={{
                                        width: avatarSize,
                                        height: avatarSize,
                                    }}
                                />
                            ) : (
                                <Text
                                    style={{ fontSize: avatarSize * 0.4 }}
                                    className="text-white font-bold"
                                >
                                    {(p.name || p.identity)
                                        .charAt(0)
                                        .toUpperCase()}
                                </Text>
                            )}
                        </View>
                    </View>
                )}
                <Text className="absolute bottom-2.5 left-2.5 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    {p.name || p.identity}
                    {isLocal ? " (Bạn)" : ""}
                </Text>
            </View>
        );
    };

    const me =
        participants.find((p) => p.identity === localParticipant?.identity) ||
        participants[0];
    const others = participants.filter((p) => p.identity !== me?.identity);

    // Logic đếm thời gian
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        // Chỉ đếm thời gian khi có từ 2 người trở lên
        if (participants.length > 1) {
            const interval = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [participants.length]);

    // Auto-hangup for caller if no answer in 10s
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isCaller && participants.length === 1 && duration === 0) {
            timeout = setTimeout(async () => {
                if (activeRoomId && currentUser) {
                    await chatApi.sendMessage({
                        conversationId: activeRoomId,
                        senderId: currentUser.id,
                        type: "SYSTEM",
                        content: "Đối phương không phản hồi",
                    });
                    await videoApi.endCall({
                        conversationId: activeRoomId,
                        recipientIds: [],
                    });
                }
                endActiveCall();
            }, 10000);
        }
        return () => clearTimeout(timeout);
    }, [
        isCaller,
        participants.length,
        duration,
        activeRoomId,
        currentUser,
        endActiveCall,
    ]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111]">
            <View className="flex-1 bg-black relative">
                {/* Hiển thị thời gian cuộc gọi */}
                {participants.length > 1 && (
                    <View className="absolute top-4 self-center rounded-full bg-black/60 px-4 py-1.5 z-20">
                        <Text className="text-sm font-medium text-white">
                            {formatDuration(duration)}
                        </Text>
                    </View>
                )}

                {participants.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-base text-[#aaa]">
                            Đang chờ kết nối...
                        </Text>
                    </View>
                ) : participants.length === 1 ? (
                    // Chỉ có mình -> Full screen
                    renderParticipant(me, "flex-1 w-full relative", 120)
                ) : participants.length === 2 ? (
                    // 2 người -> PIP: Người kia Full Screen, mình góc trên phải
                    <>
                        {renderParticipant(
                            others[0],
                            "flex-1 w-full relative",
                            120,
                        )}
                        {renderParticipant(
                            me,
                            "absolute top-5 right-4 w-28 h-40 rounded-xl overflow-hidden border border-gray-600 shadow-lg z-10",
                            50,
                        )}
                    </>
                ) : (
                    // Group > 2 người -> Grid
                    <View className="flex-1 flex-row flex-wrap">
                        {participants.map((p) =>
                            renderParticipant(
                                p,
                                "relative w-1/2 h-1/2 border border-black",
                                60,
                            ),
                        )}
                    </View>
                )}
            </View>

            <View className="flex-row items-center justify-evenly bg-black pb-10 pt-5">
                <TouchableOpacity
                    className={`h-[60px] w-[60px] items-center justify-center rounded-full ${isSpeaker ? "bg-[#333]" : "bg-[#555]"}`}
                    onPress={toggleSpeaker}
                >
                    {isSpeaker ? (
                        <Volume2 color="white" size={24} />
                    ) : (
                        <VolumeX color="white" size={24} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className={`h-[60px] w-[60px] items-center justify-center rounded-full ${isMicOn ? "bg-[#333]" : "bg-[#555]"}`}
                    onPress={toggleMic}
                >
                    {isMicOn ? (
                        <Mic color="white" size={24} />
                    ) : (
                        <MicOff color="white" size={24} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="h-[70px] w-[70px] items-center justify-center rounded-full bg-red-500"
                    onPress={handleEndCall}
                >
                    <PhoneOff color="white" size={28} />
                </TouchableOpacity>

                <TouchableOpacity
                    className={`h-[60px] w-[60px] items-center justify-center rounded-full ${isCamOn ? "bg-[#333]" : "bg-[#555]"}`}
                    onPress={toggleCam}
                >
                    {isCamOn ? (
                        <Video color="white" size={24} />
                    ) : (
                        <VideoOff color="white" size={24} />
                    )}
                </TouchableOpacity>

                {/* Nút Flip Camera hiển thị khi đang bật camera */}
                {isCamOn && (
                    <TouchableOpacity
                        className="absolute right-6 top-[-70px] h-[50px] w-[50px] items-center justify-center rounded-full bg-[#333]"
                        onPress={switchCamera}
                    >
                        <SwitchCamera color="white" size={20} />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

export const ActiveCall = () => {
    const { callState, activeToken, activeLivekitUrl } = useCall();
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    useEffect(() => {
        // Cần khởi tạo AudioSession cho react-native webrtc (LiveKit)
        const startAudio = async () => {
            await AudioSession.startAudioSession();
        };
        startAudio();

        // Xin quyền truy cập Camera và Microphone trước khi render LiveKitRoom
        const requestPermissions = async () => {
            if (callState === "active") {
                await Camera.requestCameraPermissionsAsync();
                await Audio.requestPermissionsAsync();
                setPermissionsGranted(true);
            }
        };

        requestPermissions();

        return () => {
            AudioSession.stopAudioSession();
        };
    }, [callState]);

    if (
        callState !== "active" ||
        !activeToken ||
        !activeLivekitUrl ||
        !permissionsGranted
    ) {
        return null;
    }

    return (
        <Modal visible={true} transparent={false} animationType="fade">
            <LiveKitRoom
                serverUrl={activeLivekitUrl}
                token={activeToken}
                connect={true}
                audio={false}
                video={false}
                onDisconnected={() => {
                    console.log("Disconnected from LiveKit");
                }}
            >
                <CallRoomContent />
            </LiveKitRoom>
        </Modal>
    );
};
