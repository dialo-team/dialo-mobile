import apiClient from "../apiClient";
import {
    QrChallengeExchangeResponse,
    QrChallengeRequestResponse,
} from "./types";

export const qrAuthApi = {
    requestChallenge: async (): Promise<QrChallengeRequestResponse> => {
        const response = await apiClient.post(
            "/auth/qr/challenges/request",
            {},
        );
        return response.data;
    },

    approveChallenge: async (challengeId: string) => {
        const response = await apiClient.post(
            `/auth/qr/challenges/${challengeId}/approve`,
            {},
        );
        return response.data;
    },

    exchangeChallenge: async (
        challengeId: string,
    ): Promise<QrChallengeExchangeResponse> => {
        const response = await apiClient.post(
            `/auth/qr/challenges/${challengeId}/exchange`,
            {},
        );
        return response.data;
    },
};
