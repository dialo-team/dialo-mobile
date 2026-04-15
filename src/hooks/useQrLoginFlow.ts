import { qrAuthApi } from "@/src/api/auth/qrAuthApi";
import {
    QrChallengeExchangeResponse,
    QrChallengeRequestResponse,
} from "@/src/api/auth/types";
import { useCallback, useRef, useState } from "react";

export type QrLoginStatus =
    | "idle"
    | "requesting"
    | "pending_approval"
    | "approved"
    | "authenticated"
    | "expired"
    | "error";

type StartQrLoginOptions = {
    pollIntervalMs?: number;
    maxAttempts?: number;
};

const wait = (ms: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

export function useQrLoginFlow() {
    const [status, setStatus] = useState<QrLoginStatus>("idle");
    const [challenge, setChallenge] =
        useState<QrChallengeRequestResponse | null>(null);
    const [exchangeData, setExchangeData] =
        useState<QrChallengeExchangeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pollingRef = useRef(false);

    const stopPolling = useCallback(() => {
        pollingRef.current = false;
    }, []);

    const startLogin = useCallback(
        async (options?: StartQrLoginOptions) => {
            const pollIntervalMs = options?.pollIntervalMs ?? 1800;
            const maxAttempts = options?.maxAttempts ?? 45;

            try {
                setError(null);
                setStatus("requesting");

                const challengeResponse = await qrAuthApi.requestChallenge();
                if (!challengeResponse?.id) {
                    throw new Error("Challenge ID is missing from response.");
                }

                setChallenge(challengeResponse);
                setStatus("pending_approval");

                pollingRef.current = true;
                let attempts = 0;

                while (pollingRef.current && attempts < maxAttempts) {
                    attempts += 1;

                    const result = await qrAuthApi.exchangeChallenge(
                        challengeResponse.id,
                    );

                    const hasToken = Boolean(
                        result?.accessToken || result?.refreshToken,
                    );
                    const isApproved =
                        result?.approved === true ||
                        result?.status === "APPROVED" ||
                        result?.status === "SUCCESS";
                    const isExpired =
                        result?.status === "EXPIRED" ||
                        result?.status === "TIMEOUT";

                    if (isExpired) {
                        setStatus("expired");
                        setExchangeData(result);
                        stopPolling();
                        return {
                            challenge: challengeResponse,
                            exchange: result,
                            status: "expired" as const,
                        };
                    }

                    if (hasToken || isApproved) {
                        setStatus(hasToken ? "authenticated" : "approved");
                        setExchangeData(result);
                        stopPolling();
                        return {
                            challenge: challengeResponse,
                            exchange: result,
                            status: hasToken
                                ? ("authenticated" as const)
                                : ("approved" as const),
                        };
                    }

                    await wait(pollIntervalMs);
                }

                setStatus("expired");
                return {
                    challenge: challengeResponse,
                    exchange: null,
                    status: "expired" as const,
                };
            } catch (e: any) {
                setStatus("error");
                setError(e?.message ?? "QR login flow failed.");
                stopPolling();
                throw e;
            }
        },
        [stopPolling],
    );

    const approveChallenge = useCallback(async (challengeId: string) => {
        return qrAuthApi.approveChallenge(challengeId);
    }, []);

    return {
        status,
        challenge,
        exchangeData,
        error,
        startLogin,
        approveChallenge,
        stopPolling,
    };
}
