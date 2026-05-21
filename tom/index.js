const { Client } = require("@stomp/stompjs");
const SockJS = require("sockjs-client");

const BASE_URL = "http://14.225.192.37:8085";
const conversationId = "69df8eabe75de55cdf3a118c";
const userId = "a3c139d4-35df-4253-884e-15fcbe899f2d";

if (!userId) {
    console.error("Thiếu userId. Ví dụ: node test-chat.js <userId>");
    process.exit(1);
}

const wsUrl = `${BASE_URL}/ws-chat`;

function safeParse(body) {
    try {
        return JSON.parse(body);
    } catch {
        return body;
    }
}

const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (msg) => console.log("[STOMP]", msg),

    onConnect: () => {
        console.log("Connected to", wsUrl);

        client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
            console.log("\n=== MESSAGE FROM CONVERSATION TOPIC ===");
            console.log("destination:", frame.headers.destination);
            console.log("raw body:", frame.body);
            console.log("parsed:", safeParse(frame.body));
        });

        client.subscribe(`/topic/inbox/${userId}`, (frame) => {
            console.log("\n=== MESSAGE FROM INBOX TOPIC ===");
            console.log("destination:", frame.headers.destination);
            console.log("raw body:", frame.body);
            console.log("parsed:", safeParse(frame.body));
        });

        console.log("Subscribed:");
        console.log(`- /topic/conversations/${conversationId}`);
        console.log(`- /topic/inbox/${userId}`);
        console.log("Đợi có tin nhắn/chat mới...");
    },

    onStompError: (frame) => {
        console.error("STOMP error:", frame.headers, frame.body);
    },

    onWebSocketError: (err) => {
        console.error("WebSocket error:", err);
    },

    onDisconnect: () => {
        console.log("Disconnected");
    },
});

client.activate();

process.on("SIGINT", async () => {
    console.log("\nClosing...");
    await client.deactivate();
    process.exit(0);
});
