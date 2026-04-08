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
