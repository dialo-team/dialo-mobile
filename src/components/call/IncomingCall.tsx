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
            const id =
                incomingCall.conversationId ||
                incomingCall.roomId ||
                incomingCall.groupId ||
                "";
            const caller = incomingCall.callerId || "";

            // 1. Accept the call via API
            await videoApi.acceptCall({
                conversationId: id,
                callerId: caller,
            });

            // 2. Generate token to join LiveKit
            const tokenResponse = await videoApi.generateToken({
                roomId: id,
                participantName: currentUser.name || currentUser.id,
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
            const id =
                incomingCall.conversationId ||
                incomingCall.roomId ||
                incomingCall.groupId ||
                "";
            const caller = incomingCall.callerId || "";

            await videoApi.declineCall({
                conversationId: id,
                callerId: caller,
            });
        } catch (error) {
            console.error("Failed to decline call:", error);
        } finally {
            declineIncomingCall();
        }
    };

    return (
        <Modal visible={true} transparent={true} animationType="slide">
            <View className="flex-1 items-center justify-center bg-black/90">
                <View className="w-full items-center">
                    <Text className="mb-10 text-lg text-white">
                        Cuộc gọi đến
                    </Text>
                    {incomingCall.callerAvatar ? (
                        <Image
                            source={{ uri: incomingCall.callerAvatar }}
                            className="mb-5 h-[120px] w-[120px] rounded-full"
                        />
                    ) : (
                        <View className="mb-5 h-[120px] w-[120px] rounded-full bg-[#555]" />
                    )}
                    <Text className="mb-2.5 text-2xl font-bold text-white">
                        {incomingCall.callerName}
                    </Text>
                    <Text className="mb-14 text-base text-[#ccc]">
                        Đang gọi cho bạn...
                    </Text>

                    <View className="w-[60%] flex-row justify-around">
                        <TouchableOpacity
                            className="h-[70px] w-[70px] items-center justify-center rounded-full bg-red-500"
                            onPress={handleDecline}
                        >
                            <PhoneOff color="white" size={32} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="h-[70px] w-[70px] items-center justify-center rounded-full bg-green-500"
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
