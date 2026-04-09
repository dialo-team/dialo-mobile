import apiClient from "../apiClient";
import {
    ChangePasswordPayload,
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
    signin: async (data: SigninPayload) => {
        const response = await apiClient.post("/auth/signin/request", data);
        return response.data;
    },

    signup: async (data: SignupPayload) => {
        const response = await apiClient.post("/auth/signup/request", data);
        return response.data;
    },

    signupVerify: async (data: SignupVerifyPayload) => {
        const response = await apiClient.post("/auth/signup", data);
        return response.data;
    },

    signinVerify: async (data: SigninVerifyPayload) => {
        const response = await apiClient.post("/auth/signin", data);
        return response.data;
    },

    // 1. Xin OTP reset
    passwordResetRequest: async (data: PasswordResetRequestPayload) => {
        const response = await apiClient.post(
            "/auth/password/reset/request",
            data,
        );
        return response.data;
    },

    // 2. Xác nhận OTP reset (Trả về resetToken)
    passwordResetConfirm: async (data: PasswordResetConfirmPayload) => {
        const response = await apiClient.post(
            "/auth/password/reset/confirm",
            data,
        );
        return response.data;
    },

    // 3. Đặt lại mật khẩu mới (Gắn resetToken vào header)
    resetPassword: async (data: PasswordResetPayload, resetToken: string) => {
        const response = await apiClient.post("/auth/password/reset", data, {
            headers: {
                Authorization: resetToken,
            },
        });
        return response.data;
    },

    changePassword: async (
        data: ChangePasswordPayload,
        accessToken?: string,
    ) => {
        const response = await apiClient.put(
            "/accounts/password",
            data,
            accessToken
                ? {
                      headers: { Authorization: `Bearer ${accessToken}` },
                  }
                : undefined,
        );
        return response.data;
    },

    signout: async (data: SignoutPayload, accessToken: string) => {
        const response = await apiClient.post("/auth/signout", data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    },
};
