import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";

const CHAT_WS_BASE_URL = "http://14.225.254.174:8085";

type UseChatRealtimeOptions = {
    currentUserId?: string;
    conversationId?: string;
    onInboxPayload?: (payload: any) => void;
    onConversationMessage?: (payload: any) => void;
};

const parseFrameBody = (frame: IMessage) => {
    try {
        return JSON.parse(frame.body);
    } catch {
        return null;
    }
};

export function useChatRealtime({
    currentUserId,
    conversationId,
    onInboxPayload,
    onConversationMessage,
}: UseChatRealtimeOptions) {
    const [connected, setConnected] = useState(false);

    const clientRef = useRef<Client | null>(null);
    const inboxSubRef = useRef<StompSubscription | null>(null);
    const conversationSubRef = useRef<StompSubscription | null>(null);

    const disconnect = useCallback(() => {
        if (inboxSubRef.current) {
            try {
                inboxSubRef.current.unsubscribe();
            } catch {
                // no-op
            }
            inboxSubRef.current = null;
        }

        if (conversationSubRef.current) {
            try {
                conversationSubRef.current.unsubscribe();
            } catch {
                // no-op
            }
            conversationSubRef.current = null;
        }

        if (clientRef.current) {
            clientRef.current.deactivate();
            clientRef.current = null;
        }

        setConnected(false);
    }, []);

    const subscribeConversation = useCallback(
        (id?: string) => {
            const client = clientRef.current;
            if (!client?.connected || !id) return;

            if (conversationSubRef.current) {
                try {
                    conversationSubRef.current.unsubscribe();
                } catch {
                    // no-op
                }
                conversationSubRef.current = null;
            }

            conversationSubRef.current = client.subscribe(
                `/topic/conversations/${id}`,
                (frame) => {
                    const payload = parseFrameBody(frame);
                    if (payload && onConversationMessage) {
                        onConversationMessage(payload);
                    }
                },
            );
        },
        [onConversationMessage],
    );

    const connect = useCallback(() => {
        if (!currentUserId) {
            console.warn(
                "[useChatRealtime] No currentUserId, skipping connect",
            );
            return;
        }

        disconnect();

        const wsUrl = `${CHAT_WS_BASE_URL}/ws-chat`;
        console.log("[useChatRealtime] Connecting to", wsUrl);

        const client = new Client({
            webSocketFactory: () => {
                try {
                    return new SockJS(wsUrl, null, {
                        transports: [
                            "websocket",
                            "xhr-streaming",
                            "xhr-polling",
                        ],
                    }) as any;
                } catch (error) {
                    console.error(
                        "[useChatRealtime] SockJS creation error:",
                        error,
                    );
                    throw error;
                }
            },
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (msg) => {
                console.log("[STOMP]", msg);
            },
            onConnect: () => {
                console.log("[useChatRealtime] Connected");
                setConnected(true);

                try {
                    inboxSubRef.current = client.subscribe(
                        `/topic/inbox/${currentUserId}`,
                        (frame) => {
                            const payload = parseFrameBody(frame);
                            if (payload && onInboxPayload) {
                                onInboxPayload(payload);
                            }
                        },
                    );
                    console.log(
                        "[useChatRealtime] Subscribed to inbox:",
                        currentUserId,
                    );
                } catch (error) {
                    console.error(
                        "[useChatRealtime] Inbox subscribe error:",
                        error,
                    );
                }

                subscribeConversation(conversationId);
            },
            onDisconnect: (frame) => {
                console.log("[useChatRealtime] Disconnected", frame?.body);
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error("[useChatRealtime] STOMP error", frame?.body);
                setConnected(false);
            },
            onWebSocketError: (error) => {
                console.error("[useChatRealtime] WebSocket error", error);
                setConnected(false);
            },
        });

        try {
            client.activate();
            clientRef.current = client;
            console.log("[useChatRealtime] Client activated");
        } catch (error) {
            console.error("[useChatRealtime] Activate error:", error);
            setConnected(false);
        }
    }, [
        conversationId,
        currentUserId,
        disconnect,
        onInboxPayload,
        subscribeConversation,
    ]);

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    useEffect(() => {
        if (connected) {
            subscribeConversation(conversationId);
        }
    }, [connected, conversationId, subscribeConversation]);

    return {
        connected,
        reconnect: connect,
        disconnect,
    };
}
