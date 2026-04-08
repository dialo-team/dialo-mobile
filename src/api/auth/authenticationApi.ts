import apiClient from "../apiClient";
import { SignupPayload } from "./types";

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
};
