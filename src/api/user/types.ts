export interface UpdateBasicInfoRequest {
    userName: string;
    dob: string; // Định dạng "YYYY-MM-DD"
    gender: string; // Tùy thuộc vào Backend quy định, ví dụ: "MALE", "FEMALE", "OTHER"
}

export interface UserProfile {
    id: string;
    userName: string;
    dob: string;
    gender: string;
    avatarUrl: string | null;
    phone: string;
}

// Interface Response chung (có thể bạn đã định nghĩa ở đâu đó, nếu có thì import vào)
export interface BaseResponse<T> {
    status: number;
    message: string;
    data?: T;
}
