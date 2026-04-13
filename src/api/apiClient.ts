// src/api/apiClient.ts
import axios from "axios";
// Import hàm lấy token từ file authStorage của bạn
import { getAccessToken } from "./auth/authStorage";

const BASE_URL = "http://14.225.254.174:9000";

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

// 1. REQUEST INTERCEPTOR: Tự động gắn Token vào mọi Request
apiClient.interceptors.request.use(
    async (config) => {
        try {
            // Lấy Access Token từ SecureStore
            const token = await getAccessToken();

            // Nếu có token, gắn vào header Authorization
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Lỗi khi lấy token chặn request:", error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// 2. RESPONSE INTERCEPTOR: Xử lý lỗi trả về từ Server (Đặc biệt là 401)
apiClient.interceptors.response.use(
    (response) => {
        // Có thể format lại data trả về ở đây nếu cần, ví dụ: return response.data;
        return response;
    },
    async (error) => {
        // Bắt lỗi 401 Unauthorized (Token hết hạn hoặc không hợp lệ)
        if (error.response && error.response.status === 401) {
            console.log("Token hết hạn! Cần xử lý Refresh Token hoặc Logout.");

            // TODO: Xử lý Refresh Token ở đây nếu BE của bạn có cơ chế này
            // Hoặc dispatch sự kiện logout để đẩy user về màn hình Login
        }

        return Promise.reject(error);
    },
);

export default apiClient;
