import {
    AudioSession,
    LiveKitRoom,
    useLocalParticipant,
    useTracks,
    VideoTrack,
} from "@livekit/react-native";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import { Track } from "livekit-client";
import {
    Mic,
    MicOff,
    PhoneOff,
    Video,
    VideoOff,
    SwitchCamera,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { videoApi } from "../../api/video/videoApi";
import { useCall } from "../../providers/CallProvider";

const CallRoomContent = () => {
    const { endActiveCall, activeRoomId } = useCall();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
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
        <SafeAreaView style={styles.container}>
            <View style={styles.videoContainer}>
                {tracks.length === 0 ? (
                    <View style={styles.waitingContainer}>
                        <Text style={styles.waitingText}>
                            Đang chờ người khác tham gia...
                        </Text>
                    </View>
                ) : (
                    // Hiển thị Grid các video tracks (đơn giản hoá, hiển thị video đầu tiên lớn nhất)
                    tracks.map((trackRef, index) => (
                        <View
                            key={trackRef.participant.identity + index}
                            style={styles.participantVideo}
                        >
                            <VideoTrack trackRef={trackRef} />
                            <Text style={styles.participantName}>
                                {trackRef.participant.name ||
                                    trackRef.participant.identity}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.controlsContainer}>
                {/* Nút Flip Camera hiển thị khi đang bật camera */}
                {isCamOn && (
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={switchCamera}
                    >
                        <SwitchCamera color="white" size={24} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        !isMicOn && styles.controlButtonOff,
                    ]}
                    onPress={toggleMic}
                >
                    {isMicOn ? (
                        <Mic color="white" size={24} />
                    ) : (
                        <MicOff color="white" size={24} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endButton]}
                    onPress={handleEndCall}
                >
                    <PhoneOff color="white" size={28} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        !isCamOn && styles.controlButtonOff,
                    ]}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111",
    },
    videoContainer: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
    },
    participantVideo: {
        width: "100%",
        height: "50%", // Giả sử hiển thị 2 người chia đôi màn hình
        backgroundColor: "#222",
        position: "relative",
    },
    participantName: {
        position: "absolute",
        bottom: 10,
        left: 10,
        color: "white",
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    waitingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    waitingText: {
        color: "#aaa",
        fontSize: 16,
    },
    controlsContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: "#000",
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#333",
        justifyContent: "center",
        alignItems: "center",
    },
    controlButtonOff: {
        backgroundColor: "#555",
    },
    endButton: {
        backgroundColor: "#EF4444",
        width: 70,
        height: 70,
        borderRadius: 35,
    },
});
