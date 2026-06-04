import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    SafeAreaView,
} from "react-native";
import {
    LiveKitRoom,
    useTracks,
    VideoTrack,
    AudioSession,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react-native";
import { useCall } from "../../providers/CallProvider";
import { API_BASE_URL } from "../../config/env";
import { videoApi } from "../../api/video/videoApi";

// Thay đổi WebSocket URL cho LiveKit.
// Thông thường LiveKit server chạy trên ws(s)://...
// Ở đây giả định backend LiveKit server chạy trên cùng host nhưng protocol WS.
// Vui lòng kiểm tra lại cấu hình LiveKit URL thực tế từ phía Backend.
// Tạm thời lấy HOST từ API_BASE_URL.VIDEO nhưng đổi https thành wss.
const LIVEKIT_URL = API_BASE_URL.VIDEO.replace("http", "ws");

const CallRoomContent = () => {
    const { endActiveCall, activeRoomId } = useCall();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);

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
                            <VideoTrack
                                trackRef={trackRef}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.participantName}>
                                {trackRef.participant.name ||
                                    trackRef.participant.identity}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        !isMicOn && styles.controlButtonOff,
                    ]}
                    onPress={() => setIsMicOn(!isMicOn)}
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
                    onPress={() => setIsCamOn(!isCamOn)}
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
    const { callState, activeToken } = useCall();

    useEffect(() => {
        // Cần khởi tạo AudioSession cho react-native webrtc (LiveKit)
        const startAudio = async () => {
            await AudioSession.startAudioSession();
        };
        startAudio();
        return () => {
            AudioSession.stopAudioSession();
        };
    }, []);

    if (callState !== "active" || !activeToken) {
        return null;
    }

    return (
        <Modal visible={true} transparent={false} animationType="fade">
            <LiveKitRoom
                serverUrl={LIVEKIT_URL}
                token={activeToken}
                connect={true}
                audio={true}
                video={true}
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
