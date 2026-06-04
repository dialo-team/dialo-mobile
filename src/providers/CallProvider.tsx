import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { userApi } from "../api/user/userApi";
import { API_BASE_URL } from "../config/env";

interface CallUser {
    id: string;
    name?: string;
    avatar?: string;
}

interface IncomingCallData {
    conversationId?: string;
    roomId?: string;
    groupId?: string;
    callerId?: string;
    callerName?: string;
    callerAvatar?: string;
}

type CallState = "none" | "incoming" | "active";

interface CallContextProps {
    socket: Socket | null;
    callState: CallState;
    setCallState: (state: CallState) => void;
    incomingCall: IncomingCallData | null;
    activeRoomId: string | null;
    activeToken: string | null;
    activeLivekitUrl: string | null;
    currentUser: CallUser | null;
    acceptIncomingCall: (token: string, url: string) => void;
    declineIncomingCall: () => void;
    endActiveCall: () => void;
    startActiveCall: (roomId: string, token: string, url: string) => void;
}

const CallContext = createContext<CallContextProps | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [callState, setCallState] = useState<CallState>("none");
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
        null,
    );
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [activeLivekitUrl, setActiveLivekitUrl] = useState<string | null>(
        null,
    );
    const [currentUser, setCurrentUser] = useState<CallUser | null>(null);

    // Initialize socket connection and fetch user
    useEffect(() => {
        let currentSocket: Socket | null = null;

        const initSocket = async () => {
            try {
                const profile = await userApi.getProfile();
                if (profile && profile.id) {
                    const user = {
                        id: profile.id,
                        name: profile.userName,
                        avatar: profile.avatarUrl,
                    };
                    setCurrentUser(user);

                    // Connect to Video Socket Service
                    const newSocket = io(API_BASE_URL.VIDEO, {
                        transports: ["websocket"],
                    });

                    newSocket.on("connect", () => {
                        console.log("Connected to Video Socket:", newSocket.id);
                        // Emit register event
                        newSocket.emit("register", user.id);
                    });

                    newSocket.on("incoming-call", (data: IncomingCallData) => {
                        console.log("Received incoming-call:", data);
                        setIncomingCall(data);
                        setCallState("incoming");
                    });

                    newSocket.on("call-ended", () => {
                        console.log("Received call-ended");
                        setCallState("none");
                        setIncomingCall(null);
                        setActiveRoomId(null);
                        setActiveToken(null);
                        setActiveLivekitUrl(null);
                    });

                    newSocket.on("disconnect", () => {
                        console.log("Disconnected from Video Socket");
                    });

                    setSocket(newSocket);
                    currentSocket = newSocket;
                }
            } catch (error) {
                console.error("Error initializing video socket:", error);
            }
        };

        initSocket();

        return () => {
            if (currentSocket) {
                currentSocket.disconnect();
            }
        };
    }, []);

    const acceptIncomingCall = (token: string, url: string) => {
        if (incomingCall) {
            const id =
                incomingCall.conversationId ||
                incomingCall.roomId ||
                incomingCall.groupId ||
                "";
            setActiveRoomId(id);
            setActiveToken(token);
            setActiveLivekitUrl(url);
            setCallState("active");
            setIncomingCall(null);
        }
    };

    const declineIncomingCall = () => {
        setCallState("none");
        setIncomingCall(null);
    };

    const endActiveCall = () => {
        setCallState("none");
        setActiveRoomId(null);
        setActiveToken(null);
        setActiveLivekitUrl(null);
    };

    const startActiveCall = (roomId: string, token: string, url: string) => {
        setActiveRoomId(roomId);
        setActiveToken(token);
        setActiveLivekitUrl(url);
        setCallState("active");
    };

    return (
        <CallContext.Provider
            value={{
                socket,
                callState,
                setCallState,
                incomingCall,
                activeRoomId,
                activeToken,
                activeLivekitUrl,
                currentUser,
                acceptIncomingCall,
                declineIncomingCall,
                endActiveCall,
                startActiveCall,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
};
