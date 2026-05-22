import { chatAuthUtils } from "@/src/api/chat/chatApi";
import { mediaApi } from "@/src/api/chat/mediaApi";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const useChatAttachments = (
    conversationId: string,
    onSuccess: () => void,
) => {
    const handlePickMedia = async () => {
        if (!conversationId) return;

        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Cần quyền", "Vui lòng cấp quyền thư viện ảnh.");
            return;
        }

        // Tối ưu hóa cấu hình chọn ảnh để tránh làm sập RAM và Server Backend
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsEditing: true,
            aspect: [1, 1], // 🔥 THÊM DÒNG NÀY: Ép cắt ảnh vuông (ví dụ 800x800 hoặc 1000x1000)
            quality: 0.5, // 💎 FIX: Tắt đi vì chúng ta sử dụng FileSystem đọc ở Api để tránh lãng phí RAM song song
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const isVideo = asset.type === "video";

        // ✅ VALIDATE SIZE
        if (asset.fileSize) {
            if (!isVideo && asset.fileSize > MAX_IMAGE_SIZE) {
                Alert.alert("Lỗi", "Ảnh vượt quá 10MB.");
                return;
            }
            if (isVideo && asset.fileSize > MAX_VIDEO_SIZE) {
                Alert.alert("Lỗi", "Video vượt quá 100MB.");
                return;
            }
        }

        try {
            const userId = await chatAuthUtils.getCurrentUserId();

            console.log(
                `[useChatAttachments] 📸 Chọn ảnh thành công. Kích thước đã tối ưu: W:${asset.width} x H:${asset.height}`,
            );

            await mediaApi.sendMediaFile(userId, conversationId, {
                uri: asset.uri,
                name:
                    asset.fileName ||
                    `upload-${Date.now()}${isVideo ? ".mp4" : ".jpg"}`,
                type: asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
            });
            onSuccess();
        } catch (error: any) {
            console.error("Send media error:", {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            });
            Alert.alert("Lỗi", "Không thể gửi media.");
        }
    };

    const handlePickFile = async () => {
        if (!conversationId) return;

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
            });
            if (result.canceled) return;

            const asset = result.assets[0];

            // ✅ VALIDATE SIZE
            if (asset.size && asset.size > MAX_FILE_SIZE) {
                Alert.alert("Lỗi", "File vượt quá 100MB.");
                return;
            }

            const userId = await chatAuthUtils.getCurrentUserId();
            await mediaApi.sendMediaFile(userId, conversationId, {
                uri: asset.uri,
                name: asset.name || `file-${Date.now()}`,
                type: asset.mimeType || "application/octet-stream",
            });

            onSuccess();
        } catch (error: any) {
            console.error("Send file error:", {
                message: error?.message,
                status: error?.response?.status,
            });
            Alert.alert("Lỗi", "Không thể gửi tài liệu.");
        }
    };

    const handlePickVoice = async () => {
        if (!conversationId) return;

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["audio/*"],
            });
            if (result.canceled) return;

            const asset = result.assets[0];

            if (asset.size && asset.size > MAX_FILE_SIZE) {
                Alert.alert("Lỗi", "File thoại vượt quá 100MB.");
                return;
            }

            const userId = await chatAuthUtils.getCurrentUserId();
            await mediaApi.sendMediaFile(userId, conversationId, {
                uri: asset.uri,
                name: asset.name || `voice-${Date.now()}.m4a`,
                type: asset.mimeType || "audio/mpeg",
            });

            onSuccess();
        } catch (error: any) {
            console.error("Send voice error:", {
                message: error?.message,
                status: error?.response?.status,
            });
            Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại.");
        }
    };

    const handleOpenFile = async (fileUrl: string, fileName: string) => {
        if (!fileUrl) {
            Alert.alert("Lỗi", "Đường dẫn file không hợp lệ.");
            return;
        }

        const baseDir =
            FileSystem.cacheDirectory || FileSystem.documentDirectory;

        if (!baseDir) {
            Alert.alert("Lỗi", "Thiết bị không hỗ trợ lưu trữ tạm thời.");
            return;
        }

        try {
            const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const localFileUri = baseDir + safeFileName;

            let fileToShare = fileUrl;

            // Nếu là link server → download
            if (fileUrl.startsWith("http")) {
                const downloadResult = await FileSystem.downloadAsync(
                    fileUrl,
                    localFileUri,
                );
                fileToShare = downloadResult.uri;
            }

            const isAvailable = await Sharing.isAvailableAsync();

            if (isAvailable) {
                await Sharing.shareAsync(fileToShare, {
                    dialogTitle: `Mở file: ${fileName}`,
                });
            } else {
                Alert.alert(
                    "Thông báo",
                    "Ứng dụng không tìm thấy trình xử lý file này.",
                );
            }
        } catch (error: any) {
            console.error("Open file error:", error);
            Alert.alert("Lỗi", "Không thể tải hoặc mở file này.");
        }
    };

    return { handlePickMedia, handlePickFile, handlePickVoice, handleOpenFile };
};
