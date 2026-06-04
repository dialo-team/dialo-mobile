import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Image,
} from "react-native";
import { Phone, PhoneOff } from "lucide-react-native";
import { useCall } from "../../providers/CallProvider";
import { videoApi } from "../../api/video/videoApi";

export const IncomingCall = () => {
    const {
        callState,
        incomingCall,
        currentUser,
        acceptIncomingCall,
        declineIncomingCall,
    } = useCall();

    if (callState !== "incoming" || !incomingCall) {
        return null;
    }

    const handleAccept = async () => {
        if (!currentUser) return;
        try {
            // 1. Accept the call via API
            await videoApi.acceptCall({
                conversationId: incomingCall.conversationId,
                callerId: incomingCall.callerId,
            });

            // 2. Generate token to join LiveKit
            const tokenResponse = await videoApi.generateToken({
                roomId: incomingCall.conversationId,
                participantName: currentUser.id,
            });

            // 3. Update state to active and pass token and url
            acceptIncomingCall(tokenResponse.token, tokenResponse.url);
        } catch (error) {
            console.error("Failed to accept call:", error);
            declineIncomingCall();
        }
    };

    const handleDecline = async () => {
        try {
            await videoApi.declineCall({
                conversationId: incomingCall.conversationId,
                callerId: incomingCall.callerId,
            });
        } catch (error) {
            console.error("Failed to decline call:", error);
        } finally {
            declineIncomingCall();
        }
    };

    return (
        <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Cuộc gọi đến</Text>
                    {incomingCall.callerAvatar ? (
                        <Image
                            source={{ uri: incomingCall.callerAvatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder} />
                    )}
                    <Text style={styles.name}>{incomingCall.callerName}</Text>
                    <Text style={styles.subtitle}>Đang gọi cho bạn...</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={handleDecline}
                        >
                            <PhoneOff color="white" size={32} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={handleAccept}
                        >
                            <Phone color="white" size={32} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        width: "100%",
    },
    title: {
        color: "white",
        fontSize: 18,
        marginBottom: 40,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#555",
        marginBottom: 20,
    },
    name: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        color: "#ccc",
        fontSize: 16,
        marginBottom: 60,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "60%",
    },
    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
    },
    declineButton: {
        backgroundColor: "#EF4444", // Red
    },
    acceptButton: {
        backgroundColor: "#22C55E", // Green
    },
});
