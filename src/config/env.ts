// Cấu hình endpoint tập trung.
// Khi backend đổi host/port, chỉ sửa tại đây — không sửa rải rác ở từng file API.

const HOST = "http://14.225.192.37";

export const API_BASE_URL = {
    // Auth / dịch vụ chung (apiClient)
    AUTH: `${HOST}:9000`,
    // Chat / media / group / websocket
    CHAT: `${HOST}:8085`,
    // Friend service
    FRIEND: `${HOST}:8084`,
    // Video service
    VIDEO: "https://dialo-video-service-production.up.railway.app",
} as const;
