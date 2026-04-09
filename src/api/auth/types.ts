export interface SigninPayload {
    phone: string;
    password: string;
}

export interface SignupPayload {
    phone: string;
    password: string;
}

export interface SignupVerifyPayload {
    phone: string;
    otp: string;
}

export interface SigninVerifyPayload {
    phone: string;
    otp: string;
}

export interface ChangePasswordPayload {
    oldPass?: string;
    newPass: string;
    refreshToken: string;
}

export interface ForgotPasswordPhonePayload {
    phone: string;
}

export interface ForgotPasswordPhoneVerifyPayload {
    phone: string;
    otp?: string;
}
