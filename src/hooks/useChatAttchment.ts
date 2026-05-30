import { chatAuthUtils } from "@/src/api/chat/chatApi";
import { mediaApi } from "@/src/api/chat/mediaApi";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { Audio } from "expo-av";
import { useRef } from "react";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const AUDIO_EXTENSIONS = new Set([
    "mp3",
    "m4a",
    "aac",
    "ogg",
    "wav",
    "flac",
    "opus",
    "wma",
    "amr",
]);

const isAudioMimeType = (
    mimeType?: string | null,
    fileName?: string | null,
) => {
    if (mimeType && mimeType.toLowerCase().startsWith("audio/")) return true;
    if (fileName) {
        const ext = fileName.toLowerCase().split(".").pop() || "";
        if (AUDIO_EXTENSIONS.has(ext)) return true;
    }
    return false;
};

const buildFallbackVoiceName = (mimeType?: string | null) => {
    if (mimeType?.toLowerCase().includes("aac"))
        return `voice-${Date.now()}.aac`;
    if (mimeType?.toLowerCase().includes("wav"))
        return `voice-${Date.now()}.wav`;
    if (mimeType?.toLowerCase().includes("ogg"))
        return `voice-${Date.now()}.ogg`;
    return `voice-${Date.now()}.m4a`;
};

// High-quality recording options compatible with both old and new expo-av API.
// Falls back to explicit options so recording always uses AAC/m4a regardless of
// whether RECORDING_OPTIONS_PRESET_HIGH_QUALITY is defined.
const getRecordingOptions = () => {
    const av = Audio as any;
    return (
        av.RecordingOptionsPresets?.HIGH_QUALITY ??
        av.RECORDING_OPTIONS_PRESET_HIGH_QUALITY ?? {
            android: {
                extension: ".m4a",
                outputFormat: 2, // MPEG_4
                audioEncoder: 3, // AAC
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
            },
            ios: {
                extension: ".m4a",
                outputFormat: ".mp4",
                audioQuality: 127, // HIGH
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
            },
            web: { mimeType: "audio/webm", bitsPerSecond: 128000 },
        }
    );
};

export const useChatAttachments = (
    conversationId: string,
    onSuccess: () => void,
) => {
    const recordingRef = useRef<Audio.Recording | null>(null);

    // ─── Media ─────────────────────────────────────────────────────────────
    const handlePickMedia = async () => {
        if (!conversationId) return;

        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Cần quyền", "Vui lòng cấp quyền thư viện ảnh.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsEditing: false,
            quality: 0.7,
        });
        if (result.canceled) return;

        const asset = result.assets[0];
        const isVideo = asset.type === "video";

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
            await mediaApi.sendMediaFile(
                userId,
                conversationId,
                {
                    uri: asset.uri,
                    name:
                        asset.fileName ||
                        `upload-${Date.now()}${isVideo ? ".mp4" : ".jpg"}`,
                    type:
                        asset.mimeType ||
                        (isVideo ? "video/mp4" : "image/jpeg"),
                },
                isVideo ? "VIDEO" : "IMAGE",
            );
            onSuccess();
        } catch (error: any) {
            console.error(
                "Send media error:",
                error?.response?.data ?? error?.message,
            );
            Alert.alert("Lỗi", "Không thể gửi media.");
        }
    };

    // ─── File ──────────────────────────────────────────────────────────────
    const handlePickFile = async () => {
        if (!conversationId) return;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;

            const asset = result.assets[0];
            if (asset.size && asset.size > MAX_FILE_SIZE) {
                Alert.alert("Lỗi", "File vượt quá 100MB.");
                return;
            }

            const userId = await chatAuthUtils.getCurrentUserId();
            await mediaApi.sendMediaFile(
                userId,
                conversationId,
                {
                    uri: asset.uri,
                    name: asset.name || `file-${Date.now()}`,
                    type: asset.mimeType || "application/octet-stream",
                },
                "FILE",
            );
            onSuccess();
        } catch (error: any) {
            console.error(
                "Send file error:",
                error?.response?.data ?? error?.message,
            );
            Alert.alert("Lỗi", "Không thể gửi tài liệu.");
        }
    };

    // ─── Voice file picker (pick existing audio) ───────────────────────────
    const handlePickVoice = async () => {
        if (!conversationId) return;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;

            const asset = result.assets[0];
            if (!isAudioMimeType(asset.mimeType, asset.name)) {
                Alert.alert("Lỗi", "Vui lòng chọn file âm thanh hợp lệ.");
                return;
            }
            if (asset.size && asset.size > MAX_FILE_SIZE) {
                Alert.alert("Lỗi", "File thoại vượt quá 100MB.");
                return;
            }

            const userId = await chatAuthUtils.getCurrentUserId();
            await mediaApi.sendMediaFile(
                userId,
                conversationId,
                {
                    uri: asset.uri,
                    name: asset.name || buildFallbackVoiceName(asset.mimeType),
                    type: asset.mimeType || "audio/mpeg",
                },
                "VOICE",
            );
            onSuccess();
        } catch (error: any) {
            console.error(
                "Send voice file error:",
                error?.response?.data ?? error?.message,
            );
            Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại.");
        }
    };

    // ─── Open / share file ──────────────────────────────────────────────────
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
            const urlHash = Math.abs(
                fileUrl
                    .split("")
                    .reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
            ).toString(36);
            const safeFileName = `${urlHash}_${fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
            const localUri = baseDir + safeFileName;

            let fileToShare = fileUrl;
            if (fileUrl.startsWith("http")) {
                const dl = await FileSystem.downloadAsync(fileUrl, localUri);
                fileToShare = dl.uri;
            }

            if (await Sharing.isAvailableAsync()) {
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

    // ─── Native voice recording ─────────────────────────────────────────────

    const startRecording = async () => {
        if (!conversationId) return;

        // Guard: never start a second recording if one is already active
        if (recordingRef.current) {
            console.warn(
                "[useChatAttachments] startRecording called while already recording — ignored",
            );
            return;
        }

        try {
            const perm = await Audio.requestPermissionsAsync();
            if (!perm.granted) {
                Alert.alert("Cần quyền", "Vui lòng cấp quyền micro.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(getRecordingOptions());

            try {
                await recording.startAsync();
            } catch (startErr) {
                // Clean up the prepared-but-not-started recording to avoid native leak
                await recording.stopAndUnloadAsync().catch(() => {});
                throw startErr;
            }

            recordingRef.current = recording;
        } catch (error) {
            console.error("startRecording error:", error);
            Alert.alert("Lỗi", "Không thể bắt đầu ghi âm.");
        }
    };

    const stopRecording = async () => {
        const recording = recordingRef.current;
        if (!recording) return;

        // Clear ref immediately so a concurrent call cannot reuse a dead object
        recordingRef.current = null;

        try {
            await recording.stopAndUnloadAsync();

            // Restore normal playback mode on iOS
            // (recording mode routes audio through the earpiece)
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            }).catch(() => {});

            const uri = recording.getURI();
            if (!uri) {
                Alert.alert("Lỗi", "Không thể lấy file ghi âm.");
                return;
            }

            const info = await FileSystem.getInfoAsync(uri);
            if ((info as any).size && (info as any).size > MAX_FILE_SIZE) {
                Alert.alert("Lỗi", "File thoại vượt quá 100MB.");
                return;
            }

            const userId = await chatAuthUtils.getCurrentUserId();
            await mediaApi.sendMediaFile(
                userId,
                conversationId,
                {
                    uri,
                    name: `voice-${Date.now()}.m4a`,
                    type: "audio/m4a",
                },
                "VOICE",
            );

            onSuccess();
        } catch (error: any) {
            console.error("stopRecording error:", error);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại.");
        }
    };

    const cancelRecording = async () => {
        const recording = recordingRef.current;
        if (!recording) return;

        recordingRef.current = null;

        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            }).catch(() => {});

            const uri = recording.getURI();
            if (uri) {
                await FileSystem.deleteAsync(uri, { idempotent: true }).catch(
                    (e) => {
                        console.warn("Failed to delete temp recording:", e);
                    },
                );
            }
        } catch (error: any) {
            console.error("cancelRecording error:", error);
        }
    };

    return {
        handlePickMedia,
        handlePickFile,
        handlePickVoice,
        handleOpenFile,
        startRecording,
        stopRecording,
        cancelRecording,
    };
};
