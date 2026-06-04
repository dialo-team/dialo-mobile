import { getAccessToken } from "@/src/api/auth/authStorage";
import { API_BASE_URL } from "@/src/config/env";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";

const CHAT_WS_BASE_URL = API_BASE_URL.CHAT;

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
    const onInboxPayloadRef = useRef(onInboxPayload);
    const onConversationMessageRef = useRef(onConversationMessage);

    useEffect(() => {
        onInboxPayloadRef.current = onInboxPayload;
        onConversationMessageRef.current = onConversationMessage;
    }, [onInboxPayload, onConversationMessage]);

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

    const subscribeConversation = useCallback((id?: string) => {
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

                if (payload && onConversationMessageRef.current) {
                    onConversationMessageRef.current(payload);
                }
            },
        );
    }, []);

    const connect = useCallback(async () => {
        if (!currentUserId) {
            setConnected(false);
            return;
        }

        disconnect();

        try {
            const token = (await getAccessToken()) || "";

            const wsUrl = `${CHAT_WS_BASE_URL}/ws-chat`;

            // Một số Backend code cứng việc lấy token từ query param khi xài SockJS. Nếu code dưới không chạy, bạn thử mở comment dòng này:
            // const finalWsUrl = token ? `${wsUrl}?token=${token}` : wsUrl;

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

                connectHeaders: token
                    ? {
                          Authorization: `Bearer ${token}`,
                      }
                    : {},

                reconnectDelay: 1000,
                heartbeatIncoming: 2000,
                heartbeatOutgoing: 2000,
                debug: () => {},
                onConnect: () => {
                    setConnected(true);

                    try {
                        inboxSubRef.current = client.subscribe(
                            `/topic/inbox/${currentUserId}`,
                            (frame) => {
                                const payload = parseFrameBody(frame);

                                if (payload && onInboxPayloadRef.current) {
                                    onInboxPayloadRef.current(payload);
                                }
                            },
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

            client.activate();
            clientRef.current = client;
        } catch (error) {
            console.error("[useChatRealtime] Activate error:", error);
            setConnected(false);
        }
    }, [conversationId, currentUserId, disconnect, subscribeConversation]);

    useEffect(() => {
        if (!currentUserId) {
            disconnect();
            return;
        }

        connect();
        return () => {
            disconnect();
        };
    }, [connect, currentUserId, disconnect]);

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
