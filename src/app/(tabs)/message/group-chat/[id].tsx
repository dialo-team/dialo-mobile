import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { groupApi } from "@/src/api/group/groupApi";
import { Message } from "@/src/api/group/types";
import { userApi } from "@/src/api/user/userApi";
import { videoApi } from "@/src/api/video/videoApi";
import ChatInputBar from "@/src/components/ChatInputBar";
import VoicePlayer from "@/src/components/VoicePlayer";
import { useChatAttachments } from "@/src/hooks/useChatAttchment";
import { useChatRealtime } from "@/src/hooks/useChatRealtime";
import { useCall } from "@/src/providers/CallProvider";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { getFullUrl } from "@/src/utils/url";
import { Video as AVVideo, ResizeMode } from "expo-av";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    MoveLeft,
    Paperclip,
    Phone,
    Pin,
    PinOff,
    Search,
    Trash2,
    Undo,
    Video,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Image as RNImage,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UiMessage = {
    id: string;
    text: string;
    position: "left" | "right";
    time: string;
    imageUri?: string | null;
    videoUri?: string | null;
    voiceUri?: string | null;
    senderId?: string;
    senderName?: string;
    senderAvatarUrl?: string;
    isUnsent?: boolean;
    pending?: boolean;
    raw?: Message;
    isFile?: boolean;
    fileName?: string;
    fileUrl?: string;
    reactions?: any[];
};

const paramToString = (value: string | string[] | undefined) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value[0] != null) return value[0];
    return "";
};

// resolveFileUrl — dùng getFullUrl từ utils để xử lý đúng:
// - URL tuyệt đối (https://...) → giữ nguyên
// - Path /uploads/... → thêm host CHAT
// - Bare filename (e.g. uuid.m4a) → thêm host + /uploads/
// Trước đây group-chat chỉ ghép host + path nên URL ghi âm bị sai → không phát được.
const resolveFileUrl = (fileUrl?: string | null) =>
    fileUrl ? getFullUrl(fileUrl) : "";

const NON_MEDIA_CONTENT_TYPES = new Set(["TEXT", "SYSTEM", "POLL", "REVOKED"]);

const dedupeMessages = (items: UiMessage[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (!item.id) return true;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

function isGenericDisplayName(value?: string) {
    const normalized = (value || "").trim().toLowerCase();
    if (!normalized) return true;

    return (
        normalized === "nguoi dung" ||
        normalized === "người dùng" ||
        normalized === "tro chuyen" ||
        normalized === "trò chuyện" ||
        normalized === "user" ||
        normalized === "unknown"
    );
}

const getCleanPinnedContent = (content: string) => {
    if (!content) return "Nội dung đính kèm";
    const lower = content.toLowerCase();

    // Check if it is an image path or extension
    const isImage =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp") ||
        lower.includes("image") ||
        lower.includes("/uploads/upload-") ||
        (lower.includes("/uploads/") &&
            (lower.includes(".jpg") ||
                lower.includes(".png") ||
                lower.includes(".jpeg") ||
                lower.includes(".gif")));

    if (isImage) {
        return "[Hình ảnh]";
    }

    const isVideo =
        lower.endsWith(".mp4") ||
        lower.endsWith(".mov") ||
        lower.endsWith(".avi") ||
        lower.endsWith(".mkv") ||
        lower.includes("video") ||
        (lower.includes("/uploads/") && lower.includes(".mp4"));

    if (isVideo) {
        return "[Video]";
    }

    const isVoice =
        lower.endsWith(".mp3") ||
        lower.endsWith(".m4a") ||
        lower.endsWith(".wav") ||
        lower.endsWith(".aac") ||
        lower.includes("voice") ||
        (lower.includes("/uploads/") &&
            (lower.includes(".m4a") || lower.includes(".mp3")));

    if (isVoice) {
        return "[Tin nhắn thoại]";
    }

    return content;
};

const getUniqueVotersCount = (options: any[]) => {
    const uniqueIds = new Set<string>();
    options.forEach((opt) => {
        const optionVoters = Array.isArray(opt.voters) ? opt.voters : [];
        optionVoters.forEach((voter: any) => {
            const voterId = extractValidId(voter);
            if (voterId) {
                uniqueIds.add(voterId);
            }
        });
    });
    return uniqueIds.size;
};

const extractValidId = (item: any) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    return String(
        item?.userId ||
            item?.id ||
            item?.targetId ||
            item?.senderId ||
            item?.user?.id ||
            "",
    ).trim();
};

const extractNameCandidates = (item: any) => {
    if (!item) return [];
    return [
        item?.remarkName,
        item?.displayName,
        item?.fullName,
        item?.userName,
        item?.name,
        item?.user?.displayName,
        item?.user?.fullName,
        item?.user?.name,
        item?.friend?.displayName,
    ];
};

const extractAvatar = (profile: any) => {
    if (!profile) return null;
    return (
        profile?.avatarUrl ||
        profile?.avatar ||
        profile?.profilePictureUrl ||
        profile?.profilePicture ||
        profile?.photoUrl ||
        profile?.imageUrl ||
        profile?.user?.avatarUrl ||
        profile?.user?.profilePictureUrl ||
        null
    );
};

const normalizeMembers = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.members)) return data.members;
    if (Array.isArray(data.participants)) return data.participants;
    if (data.data && Array.isArray(data.data.members)) return data.data.members;
    if (data.data && Array.isArray(data.data.participants))
        return data.data.participants;
    return [];
};

export default function GroupChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        scrollToMessageId?: string;
    }>();

    const conversationId = paramToString(params.id);
    const initialName = paramToString(params.name);
    const initialAvatar = paramToString(params.avatar);

    const [messages, setMessages] = useState<UiMessage[]>([]);
    const [message, setMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [groupName, setGroupName] = useState(initialName);
    const [groupAvatar, setGroupAvatar] = useState(initialAvatar);
    const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);

    const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>(
        {},
    );

    const [showEmojiMenu, setShowEmojiMenu] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<UiMessage | null>(
        null,
    );
    const [viewingMediaMessage, setViewingMediaMessage] =
        useState<UiMessage | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingContent, setEditingContent] = useState("");
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [showSearchSheet, setShowSearchSheet] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [forwardTargets, setForwardTargets] = useState<any[]>([]);
    const [showHeader, setShowHeader] = useState(true);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);
    const messageYOffsets = useRef<Record<string, number>>({});
    const highlightAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { startActiveCall } = useCall();

    const handleVideoCall = async () => {
        if (!conversationId || !currentUserId) return;
        try {
            const profile = await userApi.getProfile();
            const callerName =
                profile?.userName || profile?.fullName || "Thành viên";
            const callerAvatar = profile?.avatarUrl || "";
            const recipientIds = Object.keys(memberProfiles).filter(
                (id) => id !== currentUserId,
            );

            // 1. Gửi lời mời gọi
            await videoApi.inviteCall({
                conversationId,
                callerId: currentUserId,
                callerName,
                callerAvatar,
                recipientIds,
            });

            // 2. Lấy token và URL để join LiveKit
            const tokenResponse = await videoApi.generateToken({
                roomId: conversationId,
                participantName: callerName,
            });

            // 3. Chuyển sang màn hình gọi
            startActiveCall(
                conversationId,
                tokenResponse.token,
                tokenResponse.url,
            );
        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi video:", error);
            Alert.alert("Lỗi", "Không thể bắt đầu cuộc gọi video.");
        }
    };

    const scrollToMessage = (msgId: string) => {
        const yOffset = messageYOffsets.current[msgId];
        if (yOffset === undefined) return;

        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });

        if (highlightAnimRef.current) clearTimeout(highlightAnimRef.current);

        setHighlightedMessageId(msgId);
        highlightAnimRef.current = setTimeout(() => {
            setHighlightedMessageId(null);
            highlightAnimRef.current = setTimeout(() => {
                setHighlightedMessageId(msgId);
                highlightAnimRef.current = setTimeout(() => {
                    setHighlightedMessageId(null);
                    highlightAnimRef.current = null;
                }, 700);
            }, 120);
        }, 400);
    };

    const [isDissolved, setIsDissolved] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<
        string | null
    >(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const mapApiMessageToUi = useCallback(
        (
            item: Message | any,
            cId: string,
            profiles: Record<string, any>,
        ): UiMessage => {
            const sId = extractValidId({ senderId: item?.senderId });
            const isMe =
                sId !== "" && sId !== "null" && sId === String(cId).trim();
            const msgType = String(item?.type || "TEXT").toUpperCase();
            const fileUrlRaw =
                item?.attachment?.fileUrl ||
                item?.fileUrl ||
                (!NON_MEDIA_CONTENT_TYPES.has(msgType) ? item?.content : null);
            const hasAttachment = !!fileUrlRaw;
            const profile = sId ? profiles[sId] : null;

            return {
                id: String(item?.id || item?.messageId || `msg-${Date.now()}`),
                text: ![
                    "FILE",
                    "IMAGE",
                    "GIF",
                    "VIDEO",
                    "VOICE",
                    "REVOKED",
                ].includes(msgType)
                    ? item?.content || ""
                    : "",
                position: isMe ? "right" : "left",
                time: item?.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "",
                imageUri: ["IMAGE", "GIF"].includes(String(item?.type || ""))
                    ? resolveFileUrl(fileUrlRaw)
                    : null,
                videoUri:
                    item?.type === "VIDEO" ? resolveFileUrl(fileUrlRaw) : null,
                voiceUri:
                    item?.type === "VOICE" ? resolveFileUrl(fileUrlRaw) : null,
                senderId: sId,
                senderName: item?.system
                    ? "Hệ thống"
                    : isMe
                      ? "Bạn"
                      : profile?.displayName ||
                        item?.senderName ||
                        "Thành viên",
                senderAvatarUrl: isMe
                    ? ""
                    : profile?.avatarUrl ||
                      resolveFileUrl(item?.senderAvatarUrl) ||
                      "",
                isUnsent:
                    item?.system === true ||
                    ["REVOKED", "SYSTEM"].includes(
                        String(item?.type || "").toUpperCase(),
                    ),
                pending: false,
                raw: item,
                isFile:
                    hasAttachment &&
                    !NON_MEDIA_CONTENT_TYPES.has(msgType) &&
                    !["IMAGE", "GIF", "VIDEO", "VOICE"].includes(msgType),
                fileName: (() => {
                    const raw =
                        item?.attachment?.fileName || item?.fileName || "";
                    if (raw) return raw;
                    return fileUrlRaw
                        ? fileUrlRaw.split("?")[0].split("/").pop() ||
                              "Tài liệu"
                        : "Tài liệu";
                })(),
                fileUrl: fileUrlRaw ? resolveFileUrl(fileUrlRaw) : "",
                reactions: Array.isArray(item?.reactions) ? item.reactions : [],
            };
        },
        [],
    );

    const loadGroupConversation = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            const [detailRes, membersRes] = await Promise.all([
                chatApi.getConversationDetail(conversationId),
                groupApi
                    .getGroupMembers(conversationId, currentUserId)
                    .catch((err) => {
                        return [];
                    }),
            ]);

            const detail = (detailRes?.data || detailRes) as any;

            setPinnedMessages(detail?.pinnedMessages || []);
            setIsDissolved(detail?.dissolved === true);

            const nextMemberProfiles: Record<string, any> = {};

            const membersData = [
                ...normalizeMembers(detail?.participants),
                ...normalizeMembers(detail?.members),
            ];

            const enrichedProfiles: Record<string, any> = {};

            for (const member of membersData) {
                const userId = extractValidId(member);
                if (!userId) continue;

                if (userId === currentUserId) {
                    enrichedProfiles[userId] = {
                        displayName: "Bạn",
                        avatarUrl: null,
                    };
                    continue;
                }

                try {
                    const userRes = await friendApi.getUserById(userId);
                    const userData = userRes?.data || userRes;

                    enrichedProfiles[userId] = {
                        displayName:
                            userData?.userName ||
                            userData?.fullName ||
                            userData?.displayName ||
                            "Thành viên",

                        avatarUrl: resolveFileUrl(
                            userData?.avatar ||
                                userData?.avatarUrl ||
                                userData?.profilePictureUrl,
                        ),
                    };
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                    enrichedProfiles[userId] = {
                        displayName: member.displayName || "Thành viên",
                        avatarUrl: resolveFileUrl(member.avatarUrl),
                    };
                }
            }

            const messagesList = Array.isArray(detail?.messages)
                ? detail.messages
                : [];

            const missingUserIds = new Set<string>();
            messagesList.forEach((msg: any) => {
                const sId = extractValidId({ senderId: msg.senderId });
                if (
                    sId &&
                    sId !== "null" &&
                    sId !== currentUserId &&
                    !msg.system &&
                    !nextMemberProfiles[sId]
                ) {
                    missingUserIds.add(sId);
                }
            });

            if (missingUserIds.size > 0) {
                for (const userId of Array.from(missingUserIds)) {
                    try {
                        const userRes = await friendApi.getUserById(userId);
                        const userData = userRes?.data || userRes;
                        if (userData) {
                            nextMemberProfiles[userId] = {
                                displayName: pickBestDisplayName(
                                    extractNameCandidates(userData),
                                    "",
                                ),
                                avatarUrl: extractAvatar(userData)
                                    ? resolveFileUrl(extractAvatar(userData))
                                    : null,
                            };
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        console.log(
                            `[GroupChat] Bỏ qua user ${userId} do lỗi API`,
                        );
                        nextMemberProfiles[userId] = {
                            displayName: "",
                            avatarUrl: null,
                        };
                    }
                }
            }

            setMemberProfiles(enrichedProfiles);

            const nextName = detail?.counterpartName || initialName || "Nhóm";
            setGroupName(nextName);
            setGroupAvatar(detail?.counterpartAvatarUrl || initialAvatar || "");

            const mapped = messagesList.map((item: Message) =>
                mapApiMessageToUi(item, currentUserId, nextMemberProfiles),
            );

            setMessages(dedupeMessages(mapped));
            await chatApi.markRead(conversationId);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải cuộc trò chuyện.");
        }
    }, [
        conversationId,
        currentUserId,
        initialAvatar,
        initialName,
        mapApiMessageToUi,
    ]);

    const {
        handlePickMedia,
        handlePickFile,
        handlePickVoice,
        handleOpenFile,
        startRecording,
        stopRecording,
        cancelRecording,
    } = useChatAttachments(conversationId, undefined, loadGroupConversation);

    // Recording UI state for group chat
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );
    const recordingStopTimeoutRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
    const isRecordingRef = useRef(false);
    const voiceFinalizeRef = useRef<"stop" | "cancel" | null>(null);
    const MAX_RECORD_SECONDS = 120;

    const stopRecordingUI = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current as any);
            recordingTimerRef.current = null;
        }
        if (recordingStopTimeoutRef.current) {
            clearTimeout(recordingStopTimeoutRef.current as any);
            recordingStopTimeoutRef.current = null;
        }
        isRecordingRef.current = false;
        setIsRecording(false);
        setRecordingSeconds(0);
    };

    const handleVoiceRecordStart = async () => {
        if (isRecordingRef.current || voiceFinalizeRef.current) return;
        isRecordingRef.current = true;
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
            setRecordingSeconds((s) => s + 1);
        }, 1000);
        try {
            await startRecording?.();
            if (voiceFinalizeRef.current) return;
            recordingStopTimeoutRef.current = setTimeout(() => {
                stopRecordingUI();
                void stopRecording?.().catch((e: any) =>
                    console.error("group auto-stop recording failed:", e),
                );
            }, MAX_RECORD_SECONDS * 1000);
        } catch (e) {
            console.error("group startRecording failed:", e);
            stopRecordingUI();
        }
    };

    const handleVoiceRecordStop = async () => {
        if (!isRecordingRef.current || voiceFinalizeRef.current) return;
        voiceFinalizeRef.current = "stop";
        stopRecordingUI();
        try {
            await stopRecording?.();
        } catch (e) {
            console.error("group stopRecording failed:", e);
        } finally {
            voiceFinalizeRef.current = null;
        }
    };

    const handleVoiceRecordCancel = async () => {
        if (voiceFinalizeRef.current) return;
        voiceFinalizeRef.current = "cancel";
        stopRecordingUI();
        try {
            await cancelRecording?.();
        } catch (e) {
            console.error("group cancelRecording failed:", e);
        } finally {
            voiceFinalizeRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current)
                clearInterval(recordingTimerRef.current as any);
            if (recordingStopTimeoutRef.current)
                clearTimeout(recordingStopTimeoutRef.current as any);
            if (highlightAnimRef.current)
                clearTimeout(highlightAnimRef.current);
        };
    }, []);

    const refreshMessagesAndPins = useCallback(async () => {
        if (!conversationId) return;
        try {
            const detailRes =
                await chatApi.getConversationDetail(conversationId);
            const detail = (detailRes?.data || detailRes) as any;

            setPinnedMessages(detail?.pinnedMessages || []);
            const mapped = detail.messages.map((item: Message) =>
                mapApiMessageToUi(item, currentUserId, memberProfiles),
            );
            setMessages(dedupeMessages(mapped));
        } catch (e) {
            console.log("Quick refresh error", e);
        }
    }, [conversationId, currentUserId, memberProfiles, mapApiMessageToUi]);

    const scheduleRefreshMessagesAndPins = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        refreshTimerRef.current = setTimeout(() => {
            refreshMessagesAndPins();
        }, 120);
    }, [refreshMessagesAndPins]);

    useEffect(() => {
        (async () => {
            try {
                const sub = await chatAuthUtils.getCurrentUserId();
                setCurrentUserId(sub || "");
            } catch {
                setCurrentUserId("");
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (conversationId && currentUserId) {
                loadGroupConversation();
            }
        }, [conversationId, currentUserId, loadGroupConversation]),
    );

    // Reset search + forward-targets when conversation changes (same as chat/[id].tsx)
    useEffect(() => {
        setShowSearchSheet(false);
        setSearchKeyword("");
        setSearchResults([]);
    }, [conversationId]);

    // Tự động cuộn đến tin nhắn đã ghim khi điều hướng từ màn hình PinMessageScreen
    const scrollToMessageIdParam = paramToString(params.scrollToMessageId);
    useEffect(() => {
        if (scrollToMessageIdParam && messages.length > 0) {
            const timer = setTimeout(() => {
                scrollToMessage(scrollToMessageIdParam);
                router.setParams({ scrollToMessageId: "" });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [scrollToMessageIdParam, messages.length]);

    useEffect(() => {
        if (!messages.length) return;
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
        return () => clearTimeout(timer);
    }, [messages]);

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, []);

    // ── Safe back navigation ─────────────────────────────────────────────────
    // router.back() throws "GO_BACK was not handled" when the stack is empty
    // (e.g. opened from a push notification or deep link).
    const handleHeaderBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/message" as any);
        }
    }, [router]);

    // Handle Android hardware back button
    useEffect(() => {
        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                handleHeaderBack();
                return true; // prevent default behaviour
            },
        );
        return () => subscription.remove();
    }, [handleHeaderBack]);

    const handleRealtimePayload = useCallback(
        (payload: any) => {
            if (!conversationId || !payload) return;

            if (Array.isArray(payload)) {
                const hasCurrentConversation = payload.some((item) => {
                    const candidateId = String(item?.conversationId || "");
                    return candidateId === conversationId;
                });

                if (hasCurrentConversation) {
                    scheduleRefreshMessagesAndPins();
                }
                return;
            }

            const incoming = payload?.data || payload?.message || payload;
            const incomingConversationId = String(
                incoming?.conversationId || payload?.conversationId || "",
            );

            if (
                incomingConversationId &&
                incomingConversationId !== conversationId
            ) {
                return;
            }

            const incomingType = String(
                incoming?.type ||
                    payload?.type ||
                    incoming?.action ||
                    payload?.action ||
                    incoming?.event ||
                    payload?.event ||
                    "",
            ).toUpperCase();

            const isPinEvent =
                incomingType.includes("PIN") ||
                incomingType.includes("UNPIN") ||
                incoming?.pinnedMessages != null;

            if (isPinEvent) {
                console.log("[GroupChat] Realtime pin update:", incomingType);
            }

            scheduleRefreshMessagesAndPins();
        },
        [conversationId, scheduleRefreshMessagesAndPins],
    );

    useChatRealtime({
        currentUserId,
        conversationId,
        onConversationMessage: handleRealtimePayload,
        onInboxPayload: handleRealtimePayload,
    });

    // FIX: Hàm send hoàn chỉnh - xử lý TEXT, IMAGE, VIDEO, FILE
    const handleSend = async () => {
        const content = message.trim();
        if (!content || !conversationId) return;

        const optimisticId = `tmp-${Date.now()}`;
        const optimistic: UiMessage = {
            id: optimisticId,
            text: content,
            position: "right",
            time: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            senderId: currentUserId,
            senderName: "Bạn",
            isUnsent: false,
            pending: true,
            raw: {
                id: optimisticId,
                content,
                senderId: currentUserId,
                type: "TEXT",
                conversationId: conversationId,
                system: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Message,
        };

        setMessages((prev) => dedupeMessages([...prev, optimistic]));
        setMessage("");
        setShowEmojiMenu(false);

        try {
            const sent = await chatApi.sendMessage({
                conversationId,
                type: "TEXT",
                content,
            });

            if (sent && typeof sent === "object" && "id" in sent) {
                const mapped = mapApiMessageToUi(
                    sent as Message,
                    currentUserId,
                    memberProfiles,
                );
                setMessages((prev) =>
                    dedupeMessages(
                        prev.map((item) =>
                            item.id === optimisticId ? mapped : item,
                        ),
                    ),
                );
                return;
            }

            await loadGroupConversation();
        } catch (error) {
            console.error("[GroupChat] Send error:", error);
            setMessages((prev) =>
                prev.filter((item) => item.id !== optimisticId),
            );
            setMessage(content);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
        }
    };

    const handleUnsendMessage = async () => {
        if (!selectedMessage?.raw?.id) return;
        try {
            await chatApi.revokeMessage(String(selectedMessage.raw.id));
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể thu hồi tin nhắn.");
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage?.raw?.id) return;
        try {
            await chatApi.deleteMessage(String(selectedMessage.raw.id));
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa tin nhắn.");
        }
    };

    const handleReactMessage = async (reaction: string) => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.reactToMessage(selectedMessage.id, reaction);
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch {
            Alert.alert("Lỗi", "Không thể thả cảm xúc.");
        }
    };

    const openEditModal = () => {
        if (
            !selectedMessage?.raw?.id ||
            selectedMessage?.senderId !== currentUserId ||
            String(selectedMessage?.raw?.type || "").toUpperCase() !== "TEXT"
        ) {
            return;
        }
        setEditingContent(selectedMessage?.raw?.content || "");
        setShowEditModal(true);
    };

    const handleEditMessage = async () => {
        if (!selectedMessage?.raw?.id || !editingContent.trim()) return;
        try {
            await chatApi.editMessage(
                String(selectedMessage.raw.id),
                editingContent.trim(),
            );
            setShowEditModal(false);
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch {
            Alert.alert("Lỗi", "Không thể chỉnh sửa tin nhắn.");
        }
    };

    const extractPollData = (raw: any) =>
        raw?.poll || raw?.payload?.poll || (raw?.type === "POLL" ? raw : null);

    const handleCreatePoll = async () => {
        const question = pollQuestion.trim();
        const options = pollOptions.map((o) => o.trim()).filter(Boolean);
        if (!conversationId || !question || options.length < 2) {
            Alert.alert("Thiếu dữ liệu", "Nhập câu hỏi và ít nhất 2 lựa chọn.");
            return;
        }
        try {
            await chatApi.createPoll(conversationId, question, options);
            setShowPollModal(false);
            setPollQuestion("");
            setPollOptions(["", ""]);
            await loadGroupConversation();
        } catch {
            Alert.alert("Lỗi", "Không thể tạo bình chọn.");
        }
    };

    const handleVotePoll = async (messageId: string, optionId: string) => {
        try {
            await chatApi.votePoll(messageId, [optionId]);
            await loadGroupConversation();
        } catch {
            Alert.alert("Lỗi", "Không thể gửi bình chọn.");
        }
    };

    const handleClosePoll = async (messageId: string) => {
        try {
            await chatApi.closePoll(messageId);
            await loadGroupConversation();
        } catch {
            Alert.alert("Lỗi", "Không thể đóng bình chọn.");
        }
    };

    const handleSelectMessage = async (msg: any) => {
        setSelectedMessage(msg.raw || msg);

        try {
            const conversations = await chatApi.getConversations();
            let targets = Array.isArray(conversations)
                ? conversations.filter(
                      (conv) => conv.conversationId !== conversationId,
                  )
                : [];

            targets = await Promise.all(
                targets.map(async (target) => {
                    const rawCounterpartName = target?.counterpartName || "";

                    const isPhoneNumber = /^\+?\d{8,15}$/.test(
                        rawCounterpartName.replace(/[\s.-]/g, ""),
                    );

                    const needsLookup =
                        isGenericDisplayName(rawCounterpartName) ||
                        isPhoneNumber ||
                        !(
                            target?.counterpartAvatarUrl ||
                            target?.counterpartAvatar ||
                            target?.profilePicture ||
                            target?.avatar
                        );

                    let displayName = pickBestDisplayName(
                        [
                            isGenericDisplayName(rawCounterpartName)
                                ? ""
                                : rawCounterpartName,
                            target?.counterpartUserName,
                            target?.counterpartDisplayName,
                            target?.displayName,
                            target?.userName,
                            target?.username,
                            target?.name,
                        ],
                        "Trò chuyện",
                    );

                    let displayAvatar =
                        target?.counterpartAvatarUrl ||
                        target?.counterpartAvatar ||
                        target?.avatar ||
                        "";

                    const targetUserId =
                        target?.counterpartId || target?.targetUserId || "";

                    if (needsLookup && targetUserId) {
                        try {
                            const userRes =
                                await friendApi.getUserById(targetUserId);
                            const profile = userRes?.data || userRes;

                            const combinedName =
                                `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();

                            displayName = pickBestDisplayName(
                                [
                                    profile?.fullName,
                                    combinedName,
                                    profile?.displayName,
                                    profile?.name,
                                    profile?.userName,
                                    profile?.username,
                                    isGenericDisplayName(rawCounterpartName)
                                        ? ""
                                        : rawCounterpartName,
                                ],
                                "Trò chuyện",
                            );

                            displayAvatar =
                                displayAvatar ||
                                profile?.avatarUrl ||
                                profile?.avatar ||
                                "";
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (error) {}
                    }

                    return {
                        ...target,
                        _displayName: displayName,
                        _displayAvatar: displayAvatar,
                    };
                }),
            );

            setForwardTargets(targets);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setForwardTargets([]);
        }
    };

    const handleForwardMessage = async (targetId: string) => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.forwardMessage({
                sourceMessageId: selectedMessage.id,
                targetConversationId: targetId,
            });
            Alert.alert("Thành công", "Đã chuyển tiếp");
            setSelectedMessage(null);
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể chuyển tiếp");
        }
    };

    const handleNavigateToPollDetail = (msg: any) => {
        const pollData = extractPollData(msg.raw);
        router.push({
            pathname: "/message/group-chat/poll",
            params: {
                messageId: String(msg.raw?.id || msg.id),
                conversationId: conversationId,
                pollData: JSON.stringify(pollData),
                senderId: msg.senderId || msg.raw?.senderId || "",
            },
        });
    };

    const runSearchMessages = useCallback(
        async (keyword: string) => {
            const trimmedKeyword = keyword.trim();

            if (!conversationId || !trimmedKeyword) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            try {
                const result = await chatApi.searchInConversation(
                    conversationId,
                    trimmedKeyword,
                );
                setSearchResults(Array.isArray(result) ? result : []);
            } catch {
                Alert.alert("Lỗi", "Không thể tìm kiếm tin nhắn.");
            } finally {
                setSearchLoading(false);
            }
        },
        [conversationId],
    );

    const handleSearchMessages = async () => {
        await runSearchMessages(searchKeyword);
    };

    useEffect(() => {
        if (!showSearchSheet) {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
                searchTimerRef.current = null;
            }
            return;
        }

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        const keyword = searchKeyword.trim();
        if (!keyword) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        searchTimerRef.current = setTimeout(() => {
            void runSearchMessages(keyword);
        }, 350);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
                searchTimerRef.current = null;
            }
        };
    }, [runSearchMessages, searchKeyword, showSearchSheet]);

    const handlePinMessage = async () => {
        if (!selectedMessage?.id || !conversationId) return;

        // Giới hạn ghim tối đa 3 tin nhắn
        if (pinnedMessages.length >= 3) {
            Alert.alert("Giới hạn ghim", "Chỉ được ghim tối đa 3 tin nhắn.");
            setSelectedMessage(null);
            return;
        }

        try {
            await chatApi.pinMessage(conversationId, selectedMessage.id);
            setSelectedMessage(null);
            await loadGroupConversation();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            Alert.alert("Lỗi", "Không thể ghim tin nhắn này.");
        }
    };

    const handleUnpinMessage = async (msgId: string) => {
        if (!conversationId) return;
        try {
            await chatApi.unpinMessage(conversationId, msgId);
            setSelectedMessage(null);
            await loadGroupConversation();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            Alert.alert("Lỗi", "Không thể bỏ ghim.");
        }
    };

    const groupInitials = getInitials(groupName || "Nhom", "G");

    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
            >
                <View className="bg-blue-600 flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={handleHeaderBack}>
                            <MoveLeft size={26} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="ml-3"
                            onPress={() =>
                                router.push({
                                    pathname: "/message/option/group-option",
                                    params: {
                                        id: conversationId,
                                        name: groupName,
                                        avatar: groupAvatar,
                                    },
                                })
                            }
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                {groupName || "Nhóm"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center ml-9">
                        <TouchableOpacity onPress={handleVideoCall}>
                            <Video size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() => setShowPollModal(true)}
                        >
                            <Paperclip size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() => setShowSearchSheet(true)}
                        >
                            <Search size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() =>
                                router.push({
                                    pathname: "/message/option/group-option",
                                    params: {
                                        id: conversationId,
                                        name: groupName,
                                        avatar: groupAvatar,
                                    },
                                })
                            }
                        >
                            <MoreHorizontal size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Thanh ghim tin nhắn mở rộng kiểu Zalo */}
                {pinnedMessages.length > 0 && (
                    <View className="z-50 bg-white/95 mx-3 mt-2 rounded-xl border-l-4 border-blue-500 shadow-sm overflow-hidden">
                        {/* Thanh chính */}
                        <View className="px-3 py-2 flex-row items-center">
                            <TouchableOpacity
                                className="flex-row items-center flex-1"
                                onPress={() =>
                                    setShowPinnedDropdown((prev) => !prev)
                                }
                                activeOpacity={0.7}
                            >
                                <Pin size={16} color="#2563eb" />
                                <View className="ml-2 flex-1">
                                    <Text className="text-blue-600 font-bold text-[11px] uppercase">
                                        Tin nhắn đã ghim (
                                        {pinnedMessages.length}/3)
                                    </Text>
                                    <Text
                                        numberOfLines={1}
                                        className="text-gray-600 text-[13px]"
                                    >
                                        {getCleanPinnedContent(
                                            pinnedMessages[
                                                pinnedMessages.length - 1
                                            ].content,
                                        )}
                                    </Text>
                                </View>
                                {showPinnedDropdown ? (
                                    <ChevronUp size={18} color="#9ca3af" />
                                ) : (
                                    <ChevronDown size={18} color="#9ca3af" />
                                )}
                            </TouchableOpacity>

                            <View className="w-[1px] h-6 bg-gray-200 mx-2" />

                            <TouchableOpacity
                                onPress={() =>
                                    handleUnpinMessage(
                                        pinnedMessages[
                                            pinnedMessages.length - 1
                                        ].messageId,
                                    )
                                }
                                className="p-1"
                            >
                                <Trash2 size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Danh sách xổ xuống hiển thị toàn bộ tin nhắn ghim */}
                        {showPinnedDropdown && (
                            <View className="border-t border-gray-100 bg-gray-50/50 px-3 py-2">
                                <ScrollView
                                    style={{ maxHeight: 150 }}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {pinnedMessages.map((item, index) => (
                                        <View
                                            key={item.messageId}
                                            className={`flex-row items-center py-2 ${
                                                index !==
                                                pinnedMessages.length - 1
                                                    ? "border-b border-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            <TouchableOpacity
                                                className="flex-row items-center flex-1 mr-2"
                                                onPress={() => {
                                                    scrollToMessage(
                                                        item.messageId,
                                                    );
                                                    setShowPinnedDropdown(
                                                        false,
                                                    );
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                                                <Text
                                                    numberOfLines={1}
                                                    className="text-gray-700 text-[13px] flex-1"
                                                >
                                                    {getCleanPinnedContent(
                                                        item.content,
                                                    )}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    handleUnpinMessage(
                                                        item.messageId,
                                                    );
                                                }}
                                                className="p-1"
                                            >
                                                <Trash2
                                                    size={14}
                                                    color="#dc2626"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-3 pt-4"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => {
                        const isMe = msg.position === "right";

                        if (
                            msg.raw?.type === "SYSTEM" &&
                            (msg.text?.includes("cuộc gọi") ||
                                msg.text?.includes("không phản hồi"))
                        ) {
                            return (
                                <View
                                    key={msg.id}
                                    className="flex-row justify-center mb-3"
                                >
                                    <View className="bg-gray-200 px-4 py-2 rounded-full flex-row items-center max-w-[85%]">
                                        <Phone size={14} color="#4b5563" />
                                        <Text className="text-[12px] text-gray-700 ml-2 font-medium">
                                            {msg.text}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View
                                key={msg.id}
                                onLayout={(event) => {
                                    messageYOffsets.current[msg.id] =
                                        event.nativeEvent.layout.y;
                                }}
                                className={`mb-3 flex-row ${msg.raw?.type === "POLL" ? "justify-center" : isMe ? "justify-end" : ""}`}
                            >
                                {msg.raw?.type !== "POLL" &&
                                    !isMe &&
                                    !msg.isUnsent &&
                                    (msg.senderAvatarUrl ? (
                                        <RNImage
                                            source={{
                                                uri: msg.senderAvatarUrl,
                                            }}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                    ) : (
                                        <View className="w-8 h-8 rounded-full mr-2 bg-blue-500 items-center justify-center">
                                            <Text className="text-white text-[11px] font-semibold">
                                                {getInitials(
                                                    msg.senderName,
                                                    groupInitials,
                                                )}
                                            </Text>
                                        </View>
                                    ))}

                                {msg.raw?.type === "POLL" ? (
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() =>
                                            handleNavigateToPollDetail(msg)
                                        }
                                        onLongPress={() =>
                                            !msg.isUnsent &&
                                            !msg.pending &&
                                            handleSelectMessage(msg)
                                        }
                                        style={{
                                            width: 260,
                                            shadowColor: "#000",
                                            shadowOffset: {
                                                width: 0,
                                                height: 1,
                                            },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}
                                        className={`p-4 rounded-2xl ${
                                            highlightedMessageId === msg.id
                                                ? "bg-[#FFF9C4] border border-[#FBC02D]"
                                                : "bg-white"
                                        }`}
                                    >
                                        {(() => {
                                            const pollData = extractPollData(
                                                msg.raw,
                                            );
                                            const options = Array.isArray(
                                                pollData?.options,
                                            )
                                                ? pollData.options
                                                : [];
                                            const totalVotes = options.reduce(
                                                (sum: number, opt: any) =>
                                                    sum +
                                                    (Number(opt?.voteCount) ||
                                                        0),
                                                0,
                                            );
                                            const uniqueVotersCount =
                                                getUniqueVotersCount(options);
                                            const displayVotersCount =
                                                uniqueVotersCount > 0
                                                    ? uniqueVotersCount
                                                    : totalVotes;

                                            const hasVoted = options.some(
                                                (opt: any) => {
                                                    const optionVoters =
                                                        Array.isArray(
                                                            opt.voters,
                                                        )
                                                            ? opt.voters
                                                            : [];
                                                    return optionVoters.some(
                                                        (voter: any) => {
                                                            const voterId =
                                                                extractValidId(
                                                                    voter,
                                                                );
                                                            return (
                                                                voterId &&
                                                                currentUserId &&
                                                                voterId ===
                                                                    currentUserId
                                                            );
                                                        },
                                                    );
                                                },
                                            );
                                            const isClosed =
                                                pollData?.closed === true ||
                                                pollData?.status === "CLOSED" ||
                                                pollData?.isClosed === true ||
                                                msg.raw?.closed === true;

                                            return (
                                                <View className="w-full">
                                                    {/* Tiêu đề Poll */}
                                                    <Text className="font-bold text-[16px] text-gray-800 text-left mb-1">
                                                        {pollData?.title ||
                                                            pollData?.question ||
                                                            "Bình chọn"}
                                                    </Text>

                                                    {/* Thanh thống kê */}
                                                    {displayVotersCount > 0 ? (
                                                        <Text className="text-[13px] text-blue-600 mb-3 text-left">
                                                            {`${displayVotersCount} người đã bình chọn`}
                                                        </Text>
                                                    ) : null}

                                                    {/* Danh sách các phương án */}
                                                    {options.map(
                                                        (
                                                            opt: any,
                                                            idx: number,
                                                        ) => {
                                                            const voteCount =
                                                                Number(
                                                                    opt?.voteCount,
                                                                ) || 0;
                                                            const percentage =
                                                                totalVotes > 0
                                                                    ? (voteCount /
                                                                          totalVotes) *
                                                                      100
                                                                    : 0;
                                                            const optionVoters =
                                                                Array.isArray(
                                                                    opt.voters,
                                                                )
                                                                    ? opt.voters
                                                                    : [];
                                                            const displayedVoters =
                                                                optionVoters.slice(
                                                                    0,
                                                                    2,
                                                                );

                                                            return (
                                                                <TouchableOpacity
                                                                    key={
                                                                        opt?.id ||
                                                                        `poll-opt-${idx}`
                                                                    }
                                                                    style={{
                                                                        height: 40,
                                                                        borderRadius: 12,
                                                                        borderWidth: 1,
                                                                        borderColor:
                                                                            "#e5e7eb",
                                                                        backgroundColor:
                                                                            "#f9fafb",
                                                                        overflow:
                                                                            "hidden",
                                                                        flexDirection:
                                                                            "row",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        paddingHorizontal: 12,
                                                                        position:
                                                                            "relative",
                                                                        marginBottom: 8,
                                                                    }}
                                                                    activeOpacity={
                                                                        0.8
                                                                    }
                                                                    onPress={() =>
                                                                        handleNavigateToPollDetail(
                                                                            msg,
                                                                        )
                                                                    }
                                                                >
                                                                    {/* Progress Bar View */}
                                                                    <View
                                                                        style={{
                                                                            position:
                                                                                "absolute",
                                                                            left: 0,
                                                                            top: 0,
                                                                            bottom: 0,
                                                                            width: `${percentage}%`,
                                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                            zIndex: 1,
                                                                        }}
                                                                    />

                                                                    {/* Option label */}
                                                                    <Text
                                                                        style={{
                                                                            zIndex: 2,
                                                                        }}
                                                                        className="text-[14px] text-gray-800 font-medium flex-1 mr-2 text-left"
                                                                        numberOfLines={
                                                                            1
                                                                        }
                                                                    >
                                                                        {opt?.text ||
                                                                            opt?.optionText ||
                                                                            opt?.content ||
                                                                            `Lựa chọn ${idx + 1}`}
                                                                    </Text>

                                                                    {/* Avatar Stack & Vote count */}
                                                                    <View
                                                                        style={{
                                                                            flexDirection:
                                                                                "row",
                                                                            alignItems:
                                                                                "center",
                                                                            zIndex: 2,
                                                                        }}
                                                                    >
                                                                        {displayedVoters.length >
                                                                        0 ? (
                                                                            <View
                                                                                style={{
                                                                                    flexDirection:
                                                                                        "row",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    marginRight: 4,
                                                                                }}
                                                                            >
                                                                                {displayedVoters.map(
                                                                                    (
                                                                                        voter: any,
                                                                                        vIdx: number,
                                                                                    ) => {
                                                                                        const voterId =
                                                                                            extractValidId(
                                                                                                voter,
                                                                                            );
                                                                                        const profile =
                                                                                            voterId
                                                                                                ? memberProfiles[
                                                                                                      voterId
                                                                                                  ]
                                                                                                : null;
                                                                                        const rawAvatar =
                                                                                            extractAvatar(
                                                                                                voter,
                                                                                            ) ||
                                                                                            profile?.avatarUrl ||
                                                                                            "";
                                                                                        const avatarUri =
                                                                                            rawAvatar
                                                                                                ? resolveFileUrl(
                                                                                                      rawAvatar,
                                                                                                  )
                                                                                                : "";
                                                                                        const displayName =
                                                                                            profile?.displayName ||
                                                                                            voter?.displayName ||
                                                                                            voter?.fullName ||
                                                                                            "U";

                                                                                        return (
                                                                                            <View
                                                                                                key={
                                                                                                    voterId ||
                                                                                                    `voter-${vIdx}`
                                                                                                }
                                                                                                style={{
                                                                                                    width: 16,
                                                                                                    height: 16,
                                                                                                    borderRadius: 8,
                                                                                                    borderWidth: 1,
                                                                                                    borderColor:
                                                                                                        "white",
                                                                                                    backgroundColor:
                                                                                                        "#3b82f6",
                                                                                                    justifyContent:
                                                                                                        "center",
                                                                                                    alignItems:
                                                                                                        "center",
                                                                                                    marginLeft:
                                                                                                        vIdx >
                                                                                                        0
                                                                                                            ? -6
                                                                                                            : 0,
                                                                                                    overflow:
                                                                                                        "hidden",
                                                                                                }}
                                                                                            >
                                                                                                {!!avatarUri ? (
                                                                                                    <RNImage
                                                                                                        source={{
                                                                                                            uri: avatarUri,
                                                                                                        }}
                                                                                                        style={{
                                                                                                            width: "100%",
                                                                                                            height: "100%",
                                                                                                        }}
                                                                                                    />
                                                                                                ) : (
                                                                                                    <Text
                                                                                                        style={{
                                                                                                            fontSize: 8,
                                                                                                            color: "white",
                                                                                                            fontWeight:
                                                                                                                "bold",
                                                                                                        }}
                                                                                                    >
                                                                                                        {getInitials(
                                                                                                            displayName,
                                                                                                        ).slice(
                                                                                                            0,
                                                                                                            1,
                                                                                                        )}
                                                                                                    </Text>
                                                                                                )}
                                                                                            </View>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </View>
                                                                        ) : null}

                                                                        {voteCount >
                                                                        0 ? (
                                                                            <Text className="text-[12px] text-gray-500 font-semibold">
                                                                                {String(
                                                                                    voteCount,
                                                                                )}
                                                                            </Text>
                                                                        ) : null}
                                                                    </View>
                                                                </TouchableOpacity>
                                                            );
                                                        },
                                                    )}

                                                    {/* Nút Bình chọn / Đổi bình chọn */}
                                                    {isClosed ? (
                                                        <View className="bg-gray-100 py-2.5 rounded-full w-full items-center mt-2 border border-gray-200">
                                                            <Text className="text-gray-500 font-semibold text-[14px]">
                                                                Bình chọn đã
                                                                khóa
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity
                                                            className="bg-blue-50 py-2.5 rounded-full w-full items-center mt-2 border border-blue-100"
                                                            activeOpacity={0.8}
                                                            onPress={() =>
                                                                handleNavigateToPollDetail(
                                                                    msg,
                                                                )
                                                            }
                                                        >
                                                            <Text className="text-blue-600 font-semibold text-[14px]">
                                                                {hasVoted
                                                                    ? "Đổi bình chọn"
                                                                    : "Bình chọn"}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            );
                                        })()}

                                        <Text className="text-gray-500 text-[10px] mt-2 text-right">
                                            {msg.pending
                                                ? "Đang gửi..."
                                                : msg.time}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            if (msg.imageUri || msg.videoUri) {
                                                setViewingMediaMessage(msg);
                                            } else if (
                                                msg.isFile &&
                                                msg.fileUrl
                                            ) {
                                                handleOpenFile(
                                                    msg.fileUrl,
                                                    msg.fileName || "",
                                                );
                                            }
                                        }}
                                        onLongPress={() =>
                                            !msg.isUnsent &&
                                            !msg.pending &&
                                            handleSelectMessage(msg)
                                        }
                                        className={`${
                                            highlightedMessageId === msg.id
                                                ? "bg-[#FFF9C4] border border-[#FBC02D]"
                                                : isMe
                                                  ? "bg-[#cde7f4]"
                                                  : "bg-white"
                                        } px-4 py-2 rounded-2xl max-w-[74%]`}
                                    >
                                        {!isMe && !msg.isUnsent && (
                                            <Text className="mb-1 text-[11px] text-blue-600 font-bold">
                                                {msg.senderName}
                                            </Text>
                                        )}

                                        {msg.videoUri ? (
                                            <View
                                                style={{
                                                    width: 150,
                                                    height: 150,
                                                    borderRadius: 10,
                                                    marginBottom: 4,
                                                    overflow: "hidden",
                                                    backgroundColor: "black",
                                                }}
                                            >
                                                <AVVideo
                                                    source={{
                                                        uri: msg.videoUri,
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                    }}
                                                    resizeMode={
                                                        ResizeMode.COVER
                                                    }
                                                    shouldPlay={false}
                                                />
                                            </View>
                                        ) : msg.imageUri ? (
                                            <RNImage
                                                source={{ uri: msg.imageUri }}
                                                style={{
                                                    width: 150,
                                                    height: 150,
                                                    borderRadius: 10,
                                                    marginBottom: 4,
                                                }}
                                                resizeMode="cover"
                                            />
                                        ) : msg.voiceUri ? (
                                            <VoicePlayer
                                                uri={msg.voiceUri}
                                                isMe={isMe}
                                            />
                                        ) : null}

                                        {msg.isFile && (
                                            <View
                                                className={`flex-row items-center mb-1 p-2 rounded-lg ${isMe ? "bg-blue-700" : "bg-gray-100"}`}
                                            >
                                                <Paperclip
                                                    size={16}
                                                    color={
                                                        isMe
                                                            ? "white"
                                                            : "#4b5563"
                                                    }
                                                />
                                                <Text
                                                    className={`ml-2 font-medium ${isMe ? "text-white" : "text-blue-600"}`}
                                                    numberOfLines={1}
                                                >
                                                    {msg.fileName ||
                                                        msg.text ||
                                                        "Tài liệu"}
                                                </Text>
                                            </View>
                                        )}

                                        {extractPollData(msg.raw) && (
                                            <View className="mt-2 mb-1 p-2 rounded-lg bg-gray-50 border border-gray-200">
                                                <Text className="font-semibold text-[14px] mb-2">
                                                    {extractPollData(msg.raw)
                                                        ?.question ||
                                                        "Bình chọn"}
                                                </Text>
                                                {(
                                                    extractPollData(msg.raw)
                                                        ?.options || []
                                                ).map(
                                                    (opt: any, idx: number) => (
                                                        <TouchableOpacity
                                                            key={
                                                                opt?.id ||
                                                                `poll-opt-${idx}`
                                                            }
                                                            className="py-2 px-2 rounded-md bg-white border border-gray-200 mb-2"
                                                            onPress={() =>
                                                                handleVotePoll(
                                                                    String(
                                                                        msg.raw
                                                                            ?.id ||
                                                                            msg.id,
                                                                    ),
                                                                    String(
                                                                        opt?.id ||
                                                                            opt?.optionId ||
                                                                            opt?.value ||
                                                                            idx,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <Text className="text-[13px]">
                                                                {opt?.text ||
                                                                    opt?.optionText ||
                                                                    `Lựa chọn ${idx + 1}`}
                                                            </Text>
                                                            {typeof opt?.voteCount ===
                                                                "number" && (
                                                                <Text className="text-[11px] text-gray-500 mt-1">
                                                                    {
                                                                        opt.voteCount
                                                                    }{" "}
                                                                    lượt chọn
                                                                </Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    ),
                                                )}
                                                {msg.senderId ===
                                                    currentUserId && (
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            handleClosePoll(
                                                                String(
                                                                    msg.raw
                                                                        ?.id ||
                                                                        msg.id,
                                                                ),
                                                            )
                                                        }
                                                    ></TouchableOpacity>
                                                )}
                                            </View>
                                        )}

                                        {msg.text !== "" &&
                                            !msg.imageUri &&
                                            !msg.videoUri &&
                                            !msg.voiceUri &&
                                            ![
                                                "IMAGE",
                                                "GIF",
                                                "VIDEO",
                                                "VOICE",
                                            ].includes(
                                                String(
                                                    msg.raw?.type || "",
                                                ).toUpperCase(),
                                            ) && (
                                                <Text
                                                    className={`text-[15px] ${msg.isUnsent ? "text-gray-400 italic" : "text-black"}`}
                                                >
                                                    {msg.text}
                                                </Text>
                                            )}

                                        {!msg.isUnsent && (
                                            <Text
                                                className={`text-gray-500 text-[11px] mt-1 ${isMe ? "text-right" : ""}`}
                                            >
                                                {msg.pending
                                                    ? "Đang gửi..."
                                                    : msg.time}
                                            </Text>
                                        )}
                                        {Array.isArray(msg.reactions) &&
                                            msg.reactions.length > 0 &&
                                            (() => {
                                                const counts: Record<
                                                    string,
                                                    number
                                                > = {};
                                                msg.reactions.forEach(
                                                    (r: any) => {
                                                        const e =
                                                            r?.reaction ||
                                                            r?.emoji;
                                                        if (e)
                                                            counts[e] =
                                                                (counts[e] ||
                                                                    0) + 1;
                                                    },
                                                );
                                                return (
                                                    <View
                                                        className="flex-row mt-1"
                                                        style={{ gap: 4 }}
                                                    >
                                                        {Object.entries(
                                                            counts,
                                                        ).map(
                                                            ([
                                                                emoji,
                                                                count,
                                                            ]) => (
                                                                <View
                                                                    key={emoji}
                                                                    className="bg-gray-100 rounded-full px-2 py-0.5 flex-row items-center"
                                                                    style={{
                                                                        gap: 2,
                                                                    }}
                                                                >
                                                                    <Text className="text-[13px]">
                                                                        {emoji}
                                                                    </Text>
                                                                    {count >
                                                                        1 && (
                                                                        <Text className="text-[10px] text-gray-500">
                                                                            {
                                                                                count
                                                                            }
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            ),
                                                        )}
                                                    </View>
                                                );
                                            })()}
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                    <View className="h-6" />
                </ScrollView>

                {isDissolved ? (
                    <View className="bg-gray-200 py-3 px-4 items-center justify-center border-t border-gray-300">
                        <Text className="text-gray-600 italic text-[14px]">
                            Nhóm này đã giải tán. Bạn không thể gửi tin nhắn
                            mới.
                        </Text>
                    </View>
                ) : (
                    <ChatInputBar
                        message={message}
                        onMessageChange={setMessage}
                        onSend={handleSend}
                        onAttachFile={handlePickFile}
                        onPickMedia={handlePickMedia}
                        onPickVoice={handlePickVoice}
                        onVoiceRecordStart={handleVoiceRecordStart}
                        onVoiceRecordStop={handleVoiceRecordStop}
                        onVoiceRecordCancel={handleVoiceRecordCancel}
                        isRecording={isRecording}
                        recordingSeconds={recordingSeconds}
                        onEmojiPress={() => setShowEmojiMenu(!showEmojiMenu)}
                        showEmojiMenu={showEmojiMenu}
                        onEmojiSelect={(emoji) => {
                            setMessage((prev) => `${prev}${emoji}`);
                            setShowEmojiMenu(false);
                        }}
                        isGroupChat={true}
                        placeholder="Tin nhắn"
                        customEmojis={["👍", "❤️", "😂"]}
                        showMoreButton={true}
                    />
                )}
            </KeyboardAvoidingView>

            {/* Message Options Modal */}
            <Modal
                visible={!!selectedMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setSelectedMessage(null)}
                >
                    <View className="flex-1 bg-black/60 justify-center px-4">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-3xl p-4">
                                <View className="py-2 flex-row items-center">
                                    {["👍", "❤️", "😂", "😮", "😢"].map(
                                        (emoji) => (
                                            <TouchableOpacity
                                                key={emoji}
                                                className="mr-3"
                                                onPress={() =>
                                                    handleReactMessage(emoji)
                                                }
                                            >
                                                <Text className="text-2xl">
                                                    {emoji}
                                                </Text>
                                            </TouchableOpacity>
                                        ),
                                    )}
                                </View>
                                {selectedMessage?.senderId === currentUserId &&
                                    String(
                                        selectedMessage?.raw?.type || "",
                                    ).toUpperCase() === "TEXT" && (
                                        <TouchableOpacity
                                            className="py-3 flex-row items-center"
                                            onPress={openEditModal}
                                        >
                                            <Text className="text-[15px]">
                                                Chỉnh sửa tin nhắn
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                <TouchableOpacity
                                    className="py-3 flex-row items-center"
                                    onPress={handleUnsendMessage}
                                >
                                    <Undo size={20} color="#ef4444" />
                                    <Text className="ml-3 text-[15px]">
                                        Thu hồi
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="py-3 flex-row items-center"
                                    onPress={handleDeleteMessage}
                                >
                                    <Trash2 size={20} color="#ef4444" />
                                    <Text className="ml-3 text-[15px]">
                                        Xóa phía mình
                                    </Text>
                                </TouchableOpacity>
                                {(() => {
                                    const isPinned = pinnedMessages.some(
                                        (pm: any) =>
                                            pm.messageId ===
                                            selectedMessage?.id,
                                    );
                                    return (
                                        <TouchableOpacity
                                            className="py-3 flex-row items-center border-b border-gray-100"
                                            onPress={() =>
                                                isPinned
                                                    ? handleUnpinMessage(
                                                          selectedMessage!.id,
                                                      )
                                                    : handlePinMessage()
                                            }
                                        >
                                            {isPinned ? (
                                                <PinOff
                                                    size={20}
                                                    color="#ef4444"
                                                />
                                            ) : (
                                                <Pin
                                                    size={20}
                                                    color="#2563eb"
                                                />
                                            )}
                                            <Text
                                                className={`ml-3 text-[15px] ${
                                                    isPinned
                                                        ? "text-red-500"
                                                        : "text-blue-600"
                                                }`}
                                            >
                                                {isPinned
                                                    ? "Bỏ ghim"
                                                    : "Ghim tin nhắn"}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })()}
                                <View className="mt-2 border-t border-gray-100 pt-3">
                                    <Text className="text-sm font-semibold mb-2">
                                        Chuyển tiếp tới
                                    </Text>
                                    <ScrollView className="max-h-[200px]">
                                        {forwardTargets.map((item: any) => {
                                            const displayName =
                                                item._displayName ||
                                                item.counterpartName ||
                                                "Trò chuyện";
                                            const displayAvatar =
                                                item._displayAvatar ||
                                                item.counterpartAvatarUrl ||
                                                item.counterpartAvatar ||
                                                "";

                                            return (
                                                <TouchableOpacity
                                                    key={item.conversationId}
                                                    className="flex-row items-center py-3 border-b border-gray-100"
                                                    onPress={() =>
                                                        handleForwardMessage(
                                                            item.conversationId,
                                                        )
                                                    }
                                                >
                                                    {displayAvatar ? (
                                                        <RNImage
                                                            source={{
                                                                uri: displayAvatar,
                                                            }}
                                                            className="w-9 h-9 rounded-full mr-3"
                                                        />
                                                    ) : (
                                                        <View className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center mr-3">
                                                            <Text className="text-white text-xs font-semibold">
                                                                {getInitials(
                                                                    displayName,
                                                                )}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    <Text className="text-sm font-medium text-gray-800 flex-1">
                                                        {displayName}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={showSearchSheet}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowSearchSheet(false);
                    setSearchKeyword("");
                    setSearchResults([]);
                }}
            >
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-3xl pt-3 pb-8 max-h-[75%]">
                        <View className="items-center mb-3">
                            <View className="w-10 h-1 rounded-full bg-gray-300" />
                        </View>

                        <View className="px-4">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Tìm tin nhắn trong nhóm
                            </Text>
                            <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 mb-3">
                                <TextInput
                                    className="flex-1 py-3 text-sm text-gray-900"
                                    placeholder="Nhập từ khóa tìm kiếm..."
                                    placeholderTextColor="#9ca3af"
                                    value={searchKeyword}
                                    onChangeText={setSearchKeyword}
                                    autoFocus
                                    returnKeyType="search"
                                    onSubmitEditing={handleSearchMessages}
                                />
                                {searchLoading && (
                                    <ActivityIndicator
                                        size="small"
                                        color="#2563eb"
                                    />
                                )}
                            </View>
                        </View>

                        <ScrollView
                            className="px-4"
                            keyboardShouldPersistTaps="handled"
                        >
                            {searchResults.length === 0 &&
                                searchKeyword.trim() !== "" &&
                                !searchLoading && (
                                    <Text className="text-center text-gray-400 text-sm py-8">
                                        Không tìm thấy tin nhắn nào
                                    </Text>
                                )}
                            {searchResults.map((item: any, idx: number) => (
                                <TouchableOpacity
                                    key={
                                        item?.id
                                            ? String(item.id)
                                            : `search-${idx}`
                                    }
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        setShowSearchSheet(false);
                                        setSearchKeyword("");
                                        setSearchResults([]);
                                        setTimeout(
                                            () => scrollToMessage(item.id),
                                            320,
                                        );
                                    }}
                                >
                                    <Text
                                        className="text-sm text-gray-800"
                                        numberOfLines={2}
                                    >
                                        {item?.content || item?.text || ""}
                                    </Text>
                                    <Text className="text-[11px] text-gray-400 mt-1">
                                        {item.senderName
                                            ? `${item.senderName} • `
                                            : ""}
                                        {item.createdAt
                                            ? new Date(
                                                  item.createdAt,
                                              ).toLocaleString("vi-VN")
                                            : ""}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <View className="h-4" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-center px-5">
                    <View className="bg-white rounded-2xl p-4">
                        <Text className="text-base font-semibold mb-3">
                            Chỉnh sửa tin nhắn
                        </Text>
                        <TextInput
                            className="border border-gray-200 rounded-xl px-3 py-2"
                            value={editingContent}
                            onChangeText={setEditingContent}
                            multiline
                        />
                        <View className="flex-row justify-end mt-3">
                            <TouchableOpacity
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text className="text-gray-500 mr-4">Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleEditMessage}>
                                <Text className="text-blue-600 font-semibold">
                                    Lưu
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showPollModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPollModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-center px-5">
                    <View className="bg-white rounded-2xl p-4">
                        <Text className="text-base font-semibold mb-3">
                            Tạo bình chọn
                        </Text>
                        <TextInput
                            className="border border-gray-200 rounded-xl px-3 py-2 mb-2"
                            placeholder="Câu hỏi bình chọn"
                            value={pollQuestion}
                            onChangeText={setPollQuestion}
                        />
                        {pollOptions.map((option, idx) => (
                            <TextInput
                                key={`poll-input-${idx}`}
                                className="border border-gray-200 rounded-xl px-3 py-2 mb-2"
                                placeholder={`Lựa chọn ${idx + 1}`}
                                value={option}
                                onChangeText={(text) =>
                                    setPollOptions((prev) =>
                                        prev.map((v, i) =>
                                            i === idx ? text : v,
                                        ),
                                    )
                                }
                            />
                        ))}
                        <TouchableOpacity
                            onPress={() =>
                                setPollOptions((prev) => [...prev, ""])
                            }
                        >
                            <Text className="text-blue-600 text-sm mb-3">
                                + Thêm lựa chọn
                            </Text>
                        </TouchableOpacity>
                        <View className="flex-row justify-end">
                            <TouchableOpacity
                                onPress={() => setShowPollModal(false)}
                            >
                                <Text className="text-gray-500 mr-4">Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreatePoll}>
                                <Text className="text-blue-600 font-semibold">
                                    Tạo
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Media Viewer Modal */}
            <Modal
                visible={!!viewingMediaMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setViewingMediaMessage(null)}
            >
                {viewingMediaMessage && (
                    <View className="flex-1 bg-black justify-center items-center">
                        {showHeader && (
                            <View className="absolute top-0 w-full bg-black/60 z-10 px-5 pt-14 pb-4">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-white text-[17px] font-semibold">
                                            {viewingMediaMessage.position ===
                                            "right"
                                                ? "Bạn"
                                                : viewingMediaMessage.senderName}
                                        </Text>
                                        <Text className="text-white/70 text-[12px] mt-0.5">
                                            Đã gửi {viewingMediaMessage.time}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        className="bg-white/10 p-2 rounded-full px-4"
                                        onPress={() =>
                                            setViewingMediaMessage(null)
                                        }
                                    >
                                        <Text className="text-white text-base font-semibold">
                                            Đóng
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        <TouchableWithoutFeedback
                            onPress={() => setShowHeader((prev) => !prev)}
                        >
                            <View className="w-full h-full">
                                {viewingMediaMessage.videoUri ? (
                                    <AVVideo
                                        source={{
                                            uri: viewingMediaMessage.videoUri,
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        resizeMode={ResizeMode.CONTAIN}
                                        useNativeControls
                                        shouldPlay
                                    />
                                ) : (
                                    <RNImage
                                        source={{
                                            uri:
                                                viewingMediaMessage.imageUri ||
                                                "",
                                        }}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}
