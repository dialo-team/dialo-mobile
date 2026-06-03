import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { getAccessToken } from "./auth/authStorage";

const BASE_URL = API_BASE_URL.AUTH;

// Danh sách các API không cần gửi Token và không xử lý Logout khi gặp 401
const PUBLIC_ENDPOINTS = [
    "/api/v1/auth/signup",
    "/api/v1/auth/verify-otp", // Đảm bảo tên route này khớp với URL thực tế của bạn
    "/api/v1/auth/signin",
    "/api/v1/auth/resend-otp",
];

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

apiClient.interceptors.request.use(
    async (config) => {
        // Kiểm tra nếu URL hiện tại nằm trong danh sách PUBLIC thì không gắn Token
        const isPublic = PUBLIC_ENDPOINTS.some((endpoint) =>
            config.url?.includes(endpoint),
        );

        if (!isPublic) {
            try {
                const token = await Promise.race([
                    getAccessToken(),
                    new Promise<string | null>((resolve) =>
                        setTimeout(() => resolve(null), 5000),
                    ),
                ]);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error("Lỗi khi lấy token:", error);
            }
        }
        return config;
    },
    (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Chỉ xử lý logic "Token hết hạn" nếu:
        // 1. Lỗi là 401
        // 2. Request đó KHÔNG PHẢI là request đến các API công khai (public)
        if (error.response?.status === 401) {
            const isPublic = PUBLIC_ENDPOINTS.some((endpoint) =>
                originalRequest.url?.includes(endpoint),
            );

            if (!isPublic) {
                console.log(
                    "Token hết hạn thực sự! Xử lý Refresh Token hoặc Logout tại đây.",
                );
                // TODO: Xử lý logout hoặc refresh token ở đây
            } else {
                console.log(
                    "Lỗi xác thực (OTP sai hoặc sai thông tin), không phải lỗi Token.",
                );
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
