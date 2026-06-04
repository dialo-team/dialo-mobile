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
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { videoApi } from "../../api/video/videoApi";
import { useCall } from "../../providers/CallProvider";

const CallRoomContent = () => {
    const { endActiveCall, activeRoomId } = useCall();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();

    // Khởi tạo trạng thái tắt camera và mic ban đầu
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);

    const handleEndCall = async () => {
        if (activeRoomId) {
            try {
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

    const switchCamera = () => {
        const trackPub = localParticipant?.getTrackPublication(
            Track.Source.Camera,
        );
        if (
            trackPub &&
            trackPub.videoTrack &&
            trackPub.videoTrack.mediaStreamTrack
        ) {
            // react-native-webrtc cung cấp hàm _switchCamera() trên MediaStreamTrack để đổi camera trước/sau mượt mà
            if (
                typeof (trackPub.videoTrack.mediaStreamTrack as any)
                    ._switchCamera === "function"
            ) {
                (trackPub.videoTrack.mediaStreamTrack as any)._switchCamera();
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111]">
            <View className="flex-1 flex-row flex-wrap items-center justify-center">
                {participants.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-base text-[#aaa]">
                            Đang chờ người khác tham gia...
                        </Text>
                    </View>
                ) : (
                    // Hiển thị Grid các thành viên
                    participants.map((p, index) => {
                        const trackPub = p.getTrackPublication(
                            Track.Source.Camera,
                        );
                        const isVideoEnabled =
                            trackPub &&
                            trackPub.isSubscribed &&
                            trackPub.track &&
                            !trackPub.isMuted;
                        // Đối với local participant, track luôn có sẵn nếu đang bật (isCamOn)
                        const isLocal =
                            p.identity === localParticipant?.identity;
                        const showVideo = isLocal ? isCamOn : isVideoEnabled;

                        return (
                            <View
                                key={p.identity + index}
                                className="relative h-1/2 w-full bg-[#222]"
                            >
                                {showVideo && trackPub?.track ? (
                                    <VideoTrack
                                        trackRef={{
                                            participant: p,
                                            publication: trackPub,
                                            source: Track.Source.Camera,
                                        }}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                ) : (
                                    <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-black">
                                        <View className="h-20 w-20 items-center justify-center rounded-full bg-[#333]">
                                            <Text className="text-3xl text-white">
                                                {(p.name || p.identity)
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                <Text className="absolute bottom-2.5 left-2.5 rounded bg-black/50 px-2 py-1 text-white">
                                    {p.name || p.identity}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>

            <View className="flex-row items-center justify-evenly bg-black pb-10 pt-5">
                {/* Nút Flip Camera hiển thị khi đang bật camera */}
                {isCamOn && (
                    <TouchableOpacity
                        className="h-[60px] w-[60px] items-center justify-center rounded-full bg-[#333]"
                        onPress={switchCamera}
                    >
                        <SwitchCamera color="white" size={24} />
                    </TouchableOpacity>
                )}

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
