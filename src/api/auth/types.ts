export interface SignupPayload {
    phone: string;
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
    otp: string;
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
