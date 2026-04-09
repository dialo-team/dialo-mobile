import apiClient from "../apiClient";
import {
    ChangePasswordPayload,
    ForgotPasswordPhonePayload,
    ForgotPasswordPhoneVerifyPayload,
    SigninPayload,
    SigninVerifyPayload,
    SignupPayload,
    SignupVerifyPayload,
} from "./types";

export const authenticationApi = {
    signin: async (data: SigninPayload) => {
        const response = await apiClient.post("/auth/signin", data);
        return response.data;
    },

    signup: async (data: SignupPayload) => {
        const response = await apiClient.post("/auth/signup", data);
        return response.data;
    },

    signupVerify: async (data: SignupVerifyPayload) => {
        const response = await apiClient.post("/auth/signup/verify", data);
        return response.data;
    },

    signinVerify: async (data: SigninVerifyPayload) => {
        const response = await apiClient.post("/auth/signin/verify", data);
        return response.data;
    },

    forgotPhone: async (
        data: ForgotPasswordPhonePayload,
        accessToken?: string,
    ) => {
        const response = await apiClient.post(
            "/auth/forgot/phone",
            data,
            accessToken
                ? {
                      headers: {
                          Authorization: `Bearer ${accessToken}`,
                      },
                  }
                : undefined,
        );
        return response.data;
    },

    forgotPhoneVerify: async (
        data: ForgotPasswordPhoneVerifyPayload,
        accessToken?: string,
    ) => {
        const response = await apiClient.post(
            "/auth/forgot/phone/verify",
            data,
            accessToken
                ? {
                      headers: {
                          Authorization: `Bearer ${accessToken}`,
                      },
                  }
                : undefined,
        );
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
                      headers: {
                          Authorization: `Bearer ${accessToken}`,
                      },
                  }
                : undefined,
        );
        return response.data;
    },
};
