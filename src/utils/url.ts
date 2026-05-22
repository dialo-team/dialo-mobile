export const MEDIA_BASE_URL = "http://14.225.192.37:8085";

export const getFullUrl = (url: string) => {
    if (!url) return "";

    // 1. Đã là link tuyệt đối
    if (/^https?:\/\//i.test(url)) {
        return encodeURI(url);
    }

    // 2. Đã chứa /uploads chuẩn từ backend cũ
    if (url.startsWith("/uploads")) {
        return encodeURI(`${MEDIA_BASE_URL}${url}`);
    }

    // 3. 🔥 FIX CHO LUỒNG MỚI: Nếu chỉ trả về tên file thô (ví dụ: 48662f19-....png)
    // Ta tự động chèn thêm /uploads/ vào trước tên file
    const cleanUrl = url.replace(/^\/+/, ""); // Xóa dấu / ở đầu nếu có
    if (!cleanUrl.startsWith("uploads/")) {
        return encodeURI(`${MEDIA_BASE_URL}/uploads/${cleanUrl}`);
    }

    return encodeURI(`${MEDIA_BASE_URL}/${cleanUrl}`);
};
