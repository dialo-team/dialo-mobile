import apiClient from "../apiClient";
import {
    PasswordResetConfirmPayload,
    PasswordResetPayload,
    PasswordResetRequestPayload,
    SigninPayload,
    SigninVerifyPayload,
    SignoutPayload,
    SignupPayload,
    SignupVerifyPayload,
} from "./types";

export const authenticationApi = {
    signup: async (data: SignupPayload) => {
        const response = await apiClient.post(
            "/api/v1/auth/signup/request",
            data,
        );
        return response.data;
    },

    signupVerify: async (data: SignupVerifyPayload) => {
        const response = await apiClient.post("/api/v1/auth/signup", data);
        return response.data;
    },

    signin: async (data: SigninPayload) => {
        const response = await apiClient.post(
            "/api/v1/auth/signin/request",
            data,
        );
        return response.data;
    },

    signinVerify: async (data: SigninVerifyPayload) => {
        const response = await apiClient.post("/api/v1/auth/signin", data);
        return response.data;
    },

    // 1. Xin OTP reset
    passwordResetRequest: async (data: PasswordResetRequestPayload) => {
        const response = await apiClient.post(
            "/api/v1/auth/password/reset/request",
            data,
        );
        return response.data;
    },

    // 2. Xác nhận OTP reset (Trả về resetToken)
    passwordResetConfirm: async (data: PasswordResetConfirmPayload) => {
        const response = await apiClient.post(
            "/api/v1/auth/password/reset/confirm",
            data,
        );
        return response.data;
    },

    // 3. Đặt lại mật khẩu mới (Gắn resetToken vào header)
    resetPassword: async (data: PasswordResetPayload, resetToken: string) => {
        const response = await apiClient.post(
            "/api/v1/auth/password/reset",
            data,
            {
                headers: {
                    Authorization: resetToken,
                },
            },
        );
        return response.data;
    },

    changePassword: async (
        data: { oldPass: string; newPass: string; refreshToken: string },
        accessToken?: string, // Có thể truyền hoặc không nếu apiClient đã tự động gắn Token
    ) => {
        // Gọi đúng URL và method POST theo hình Swagger
        const response = await apiClient.post(
            "/api/v1/auth/password/change",
            data,
            {
                // Chỉ thêm header nếu apiClient của bạn không tự động gắn Authorization
                ...(accessToken && {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            },
        );
        return response.data;
    },

    qrRequest: async () => {
        const response = await apiClient.post(
            "/api/v1/auth/qr/challenges/request",
        );
        return response.data;
    },

    qrApprove: async (challengeId: string, accessToken?: string) => {
        const response = await apiClient.post(
            `/api/v1/auth/qr/challenges/${challengeId}/approve`,
            {},
            {
                ...(accessToken && {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            },
        );
        return response.data;
    },

    qrExchange: async (challengeId: string) => {
        const response = await apiClient.post(
            `/api/v1/auth/qr/challenges/${challengeId}/exchange`,
        );
        return response.data;
    },

    // 1. Đăng xuất thông thường (Body chứa refreshToken và sessId)
    signout: async (
        data: SignoutPayload | { refreshToken: string; sessId: string },
        accessToken?: string,
    ) => {
        const response = await apiClient.post("/api/v1/auth/signout", data, {
            ...(accessToken && {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }),
        });
        return response.data;
    },

    // 2. Đăng xuất theo Session ID cụ thể (Truyền sessId lên URL)
    signoutBySession: async (sessId: string, accessToken?: string) => {
        const response = await apiClient.post(
            `/api/v1/auth/signout/${sessId}`,
            {},
            {
                ...(accessToken && {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            },
        );
        return response.data;
    },

    // 3. Đăng xuất khỏi TẤT CẢ các thiết bị (Body chỉ chứa refreshToken)
    signoutAll: async (
        data: { refreshToken: string },
        accessToken?: string,
    ) => {
        const response = await apiClient.post(
            "/api/v1/auth/signout/all",
            data,
            {
                ...(accessToken && {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            },
        );
        return response.data;
    },
};
