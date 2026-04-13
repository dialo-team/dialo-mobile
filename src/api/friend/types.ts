// 1. Dữ liệu Trạng thái kết bạn (Dành cho API /check)
export type FriendStatus =
    | "NONE"
    | "PENDING"
    | "REQUESTED"
    | "WAITING"
    | "FRIEND"
    | "BLOCKED";

// 2. Dữ liệu Người dùng / Profile (Đã bám sát log BE của bạn)
export interface UserProfileResponse {
    id: string;
    userName?: string;
    name?: string; // Dự phòng
    phone?: string;
    avatar?: string;
    avatarUrl?: string; // Dự phòng
    background?: string | null;
    backgroundUrl?: string;
    bio?: string; // Lời giới thiệu
    gender?: "MALE" | "FEMALE" | "OTHER";
    dob?: string; // Ngày sinh (VD: "2004-03-29")
}

export interface FriendRequestItem {
    friendshipId: string;
    senderId: string;
    receiverId: string;
    requestedAt?: string;

    // Lưu ý: 2 trường dưới đây hiện tại BE CHƯA TRẢ VỀ.
    // Bạn định nghĩa sẵn ở đây để khi BE update API là Frontend ăn khớp luôn.
    userName?: string;
    avatar?: string;
}
