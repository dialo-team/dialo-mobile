export interface SignupPayload {
    phone: string;
    password?: string;
}

export interface SigninPayload {
    phone: string;
    password: string;
}

export interface SignupVerifyPayload {
    phone: string;
    password: string;
    otp: string;
}

export interface SigninVerifyPayload {
    phone: string;
    password?: string;
    otp?: string;
}

export interface PasswordResetRequestPayload {
    source: string;
    type: string;
}

export interface PasswordResetConfirmPayload {
    source: string;
    type: string;
    otp: string;
}

export interface PasswordResetPayload {
    password: string;
}

export interface ChangePasswordPayload {
    oldPass?: string;
    newPass: string;
    refreshToken: string;
}

export interface SignoutPayload {
    refreshToken: string;
}

export interface QrChallengeRequestResponse {
    id: string;
    qrToken?: string;
    expiresAt?: string;
    [key: string]: unknown;
}

export interface QrChallengeExchangeResponse {
    accessToken?: string;
    refreshToken?: string;
    approved?: boolean;
    status?: string;
    [key: string]: unknown;
}

export interface SessionDeviceItem {
    sessId?: string;
    id?: string;
    deviceName?: string;
    platform?: string;
    ip?: string;
    userAgent?: string;
    lastActiveAt?: string;
    createdAt?: string;
    [key: string]: unknown;
}
