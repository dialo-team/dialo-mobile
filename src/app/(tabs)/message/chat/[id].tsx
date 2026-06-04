import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
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
    MoreHorizontal,
    MoveLeft,
    Paperclip,
    Phone,
    Search,
    Trash2,
    Undo2,
    X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    BackHandler,
    Easing,
    FlatList,
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

const resolveFileUrl = (fileUrl?: string | null) =>
    fileUrl ? getFullUrl(fileUrl) : "";

// Types whose item.content is NOT a file URL — don't use as fileUrlRaw fallback
const NON_MEDIA_CONTENT_TYPES = new Set(["TEXT", "SYSTEM", "POLL", "REVOKED"]);

function paramStr(v: string | string[] | undefined): string | undefined {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v[0] != null) return v[0];
    return undefined;
}

function formatRelativeActivity(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return date.toLocaleString("vi-VN");
}

function getMessageStatusLabel(message: any) {
    if (message?.pending) return "đang gửi...";

    const rawStatus = String(
        message?.raw?.status || message?.messageStatus || "",
    ).toUpperCase();

    if (
        message?.readAt ||
        message?.raw?.readAt ||
        message?.raw?.seenAt ||
        message?.raw?.isRead === true ||
        message?.raw?.is_read === true
    ) {
        return "đã xem";
    }

    if (rawStatus === "READ" || rawStatus === "SEEN") {
        return "đã xem";
    }

    if (
        rawStatus === "DELIVERED" ||
        message?.deliveredAt ||
        message?.raw?.deliveredAt
    ) {
        return "đã gửi";
    }

    return message?.time || "";
}

function getMessageKey(item: any, index: number) {
    return item?.id || item?.raw?.id || `message-${index}`;
}

function dedupeMessages(items: any[]) {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of items) {
        const key = item?.id || item?.raw?.id;
        if (key) {
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
        }
        result.push(item);
    }

    return result;
}

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

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
        targetUserId?: string | string[];
        name?: string | string[];
        avatar?: string | string[];
        from?: string | string[];
        openSearch?: string | string[];
    }>();

    const id = paramStr(params.id);
    const targetUserId = paramStr(params.targetUserId);
    const name = paramStr(params.name);
    const avatar = paramStr(params.avatar);
    const from = paramStr(params.from);
    const openSearch = paramStr(params.openSearch);

    const [resolvedConversationId, setResolvedConversationId] =
        useState<string>("");
    const normalizedConversationId = id || resolvedConversationId;

    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [forwardTargets, setForwardTargets] = useState<any[]>([]);
    const [counterpartId, setCounterpartId] = useState("");
    const [counterpartName, setCounterpartName] = useState("");
    const [counterpartAvatar, setCounterpartAvatar] = useState("");
    const [counterpartOnline, setCounterpartOnline] = useState(false);
    const [counterpartLastActiveAt, setCounterpartLastActiveAt] = useState("");
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [showSearchSheet, setShowSearchSheet] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [viewingMediaMessage, setViewingMediaMessage] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingContent, setEditingContent] = useState("");
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entranceAnim = useRef(new Animated.Value(0)).current;

    const flatListRef = useRef<FlatList>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const messageYOffsets = useRef<Record<string, number>>({});
    const realNameRef = useRef<string>("");

    const [highlightedMessageId, setHighlightedMessageId] = useState<
        string | null
    >(null);

    const highlightAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { startActiveCall } = useCall();

    const handleVideoCall = async () => {
        if (!normalizedConversationId || !currentUserId || !counterpartId)
            return;
        try {
            const profile = await userApi.getProfile();
            const callerName =
                profile?.userName || profile?.fullName || "Thành viên";
            const callerAvatar = profile?.avatarUrl || "";

            // 1. Gửi lời mời gọi
            await videoApi.inviteCall({
                conversationId: normalizedConversationId,
                callerId: currentUserId,
                callerName,
                callerAvatar,
                recipientIds: [counterpartId],
            });

            // 2. Lấy token và URL để join LiveKit
            const tokenResponse = await videoApi.generateToken({
                roomId: normalizedConversationId,
                participantName: callerName,
            });

            // 3. Chuyển sang màn hình gọi
            startActiveCall(
                normalizedConversationId,
                tokenResponse.token,
                tokenResponse.url,
            );
        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi video:", error);
            Alert.alert("Lỗi", "Không thể bắt đầu cuộc gọi video.");
        }
    };

    const scrollToMessage = (msgId: string) => {
        // For FlatList (inverted), we find the index and scroll to it
        const index = messages.findIndex(
            (m: any) => (m?.id || m?.raw?.id) === msgId,
        );
        if (index !== -1) {
            // In an inverted list, index 0 is the last message.
            // messages array is newest-last, so we invert the index.
            const invertedIndex = messages.length - 1 - index;
            flatListRef.current?.scrollToIndex({
                index: invertedIndex,
                animated: true,
                viewPosition: 0.5,
            });
        }

        // Cancel any in-progress highlight
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

    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [isBlockedByThem, setIsBlockedByThem] = useState(false);
    const [showEmojiMenu, setShowEmojiMenu] = useState(false);

    // ✅ FIX 1: Helper function để load block status (có thể gọi từ nhiều nơi)
    const loadBlockStatusForUser = useCallback(
        async (
            userId: string,
        ): Promise<{
            blockedByMe: boolean;
            blockedByThem: boolean;
        }> => {
            if (!userId) {
                return { blockedByMe: false, blockedByThem: false };
            }

            let blockedByMe = false;
            let blockedByThem = false;

            try {
                // 1. Kiểm tra xem TÔI có đang chặn HỌ không
                blockedByMe = await friendApi.isUserBlocked(userId);

                // 2. CHỦ ĐỘNG KIỂM TRA xem TÔI CÓ BỊ HỌ CHẶN KHÔNG
                const relation = await friendApi.checkStatus(userId);
                const relData = relation?.data || relation;

                if (
                    relData?.status === "BLOCKED" ||
                    relData?.isBlockedByThem === true ||
                    relData?.blockedBy === userId
                ) {
                    blockedByThem = true;
                } else {
                    blockedByThem = false;
                }
            } catch (error: any) {
                console.log(
                    "[ChatScreen] loadBlockStatusForUser error:",
                    error,
                );
                // Nếu BE quăng lỗi 403 khi cố check status -> khả năng cao là bị chặn
                if (error?.response?.status === 403) {
                    blockedByThem = true;
                }
            }

            return { blockedByMe, blockedByThem };
        },
        [],
    );

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const loadBlockStatus = async () => {
                if (!counterpartId) {
                    if (mounted) {
                        setIsBlockedByMe(false);
                        setIsBlockedByThem(false);
                    }
                    return;
                }

                const { blockedByMe, blockedByThem } =
                    await loadBlockStatusForUser(counterpartId);

                if (mounted) {
                    setIsBlockedByMe(blockedByMe);
                    setIsBlockedByThem(blockedByThem);
                }
            };

            loadBlockStatus();

            return () => {
                mounted = false;
            };
        }, [counterpartId, loadBlockStatusForUser]),
    );

    // ✅ FIX 2: Re-filter messages khi isBlockedByMe thay đổi
    useEffect(() => {
        if (counterpartId && isBlockedByMe) {
            setMessages((prev) =>
                prev.filter((msg: any) => {
                    const msgCounterpartId =
                        msg?.raw?.senderId || msg?.senderId;
                    // Lọc bỏ message từ user bị chặn
                    if (msgCounterpartId === counterpartId) {
                        return false;
                    }
                    return true;
                }),
            );
        }
    }, [isBlockedByMe, counterpartId]);

    const handleUnblock = async () => {
        if (!counterpartId) return;
        try {
            await friendApi.unblockUser(counterpartId);
            setIsBlockedByMe(false);
            Alert.alert("Thành công", "Đã bỏ chặn người dùng.");
            loadConversationDetail(); // Tải lại cuộc trò chuyện để có Tên/Avatar
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể bỏ chặn.");
        }
    };

    const avatarUrl =
        counterpartAvatar ||
        (typeof avatar === "string" &&
        (avatar.startsWith("http://") || avatar.startsWith("https://"))
            ? avatar
            : "");

    const displayName = pickBestDisplayName(
        [counterpartName, name],
        "Tro chuyen",
    );

    useEffect(() => {
        entranceAnim.setValue(0);
        Animated.timing(entranceAnim, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [entranceAnim, normalizedConversationId]);

    const mapApiMessageToUi = useCallback(
        (item: any) => {
            const mineBySender =
                !!item?.senderId &&
                !!currentUserId &&
                item.senderId === currentUserId;
            const rawPosition = String(
                item?.displayPosition || item?.position || "",
            ).toUpperCase();

            const isCenter = rawPosition === "CENTER" || !!item?.system;
            const isMe = !isCenter && mineBySender;

            const type = String(item?.type || "TEXT").toUpperCase();
            const fileUrlRaw =
                item?.attachment?.fileUrl ||
                item?.fileUrl ||
                (!NON_MEDIA_CONTENT_TYPES.has(type) ? item?.content : null);
            const isFile =
                !!fileUrlRaw &&
                !NON_MEDIA_CONTENT_TYPES.has(type) &&
                !["IMAGE", "GIF", "VIDEO", "VOICE"].includes(type);
            const rawFileName =
                item?.attachment?.fileName || item?.fileName || "";
            const fileName = rawFileName
                ? rawFileName
                : fileUrlRaw
                  ? fileUrlRaw.split("?")[0].split("/").pop() || "Tài liệu"
                  : "Tài liệu";

            const rawSenderName = item?.senderName || "";
            const isSenderPhone = /^\+?\d{8,15}$/.test(
                rawSenderName.replace(/[\s.-]/g, ""),
            );
            const finalSenderName =
                !isMe && !isCenter && isSenderPhone && realNameRef.current
                    ? realNameRef.current
                    : rawSenderName;

            return {
                id: item?.id,
                text:
                    type === "TEXT" || type === "SYSTEM"
                        ? item?.content || ""
                        : "",
                type: isMe ? "right" : "left",
                time: item?.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "",
                senderName: finalSenderName,
                // 💎 FIX: Gọi hàm toàn cục getFullUrl thông minh để tự handle Port 8085 và thư mục /uploads/
                imageUri:
                    (type === "IMAGE" || type === "GIF") && fileUrlRaw
                        ? getFullUrl(fileUrlRaw)
                        : null,
                videoUri:
                    type === "VIDEO" && fileUrlRaw
                        ? getFullUrl(fileUrlRaw)
                        : null,
                voiceUri:
                    type === "VOICE" && fileUrlRaw
                        ? (() => {
                              const base = getFullUrl(fileUrlRaw);
                              // Check if there is an extension after the last slash
                              const lastPart = base.split("/").pop() || "";
                              return lastPart.includes(".")
                                  ? base
                                  : `${base}#.m4a`;
                          })()
                        : null,
                isFile,
                fileName,
                fileUrl: fileUrlRaw ? getFullUrl(fileUrlRaw) : "",
                system: !!item?.system,
                position: isCenter ? "center" : isMe ? "right" : "left",
                readAt: item?.readAt || item?.seenAt || null,
                deliveredAt: item?.deliveredAt || null,
                messageStatus: item?.status || item?.messageStatus || null,
                reactions: Array.isArray(item?.reactions) ? item.reactions : [],
                pending: false,
                raw: item,
            };
        },
        [currentUserId],
    );

    const runSearchMessages = useCallback(
        async (keyword: string) => {
            const trimmedKeyword = keyword.trim();

            if (!normalizedConversationId || !trimmedKeyword) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            try {
                const result = await chatApi.searchInConversation(
                    normalizedConversationId,
                    trimmedKeyword,
                );
                setSearchResults(Array.isArray(result) ? result : []);
            } catch {
                Alert.alert("Lỗi", "Không thể tìm kiếm tin nhắn.");
            } finally {
                setSearchLoading(false);
            }
        },
        [normalizedConversationId],
    );

    const getMessageSide = (msg: any) => msg?.position || msg?.type || "left";

    const mergeIncomingMessage = useCallback(
        (incomingMessage: any) => {
            try {
                if (!incomingMessage?.id) {
                    return;
                }

                const mapped = mapApiMessageToUi(incomingMessage);
                const mappedId = mapped?.id || mapped?.raw?.id;

                if (!mappedId) return;

                setMessages((prev) => {
                    const index = prev.findIndex(
                        (item) => (item?.id || item?.raw?.id) === mappedId,
                    );
                    if (index === -1) {
                        return [...prev, mapped];
                    }

                    const next = [...prev];
                    next[index] = {
                        ...next[index],
                        ...mapped,
                        pending: false,
                    };
                    return next;
                });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {}
        },
        [mapApiMessageToUi],
    );

    const loadConversationDetail = useCallback(async () => {
        if (!normalizedConversationId && !targetUserId) {
            return;
        }

        const conversationKey = normalizedConversationId || targetUserId || "";
        if (!conversationKey) {
            return;
        }

        setLoading(true);

        const updateConversationState = async (
            detail: any,
            blockStatus: { blockedByMe: boolean; blockedByThem: boolean },
        ) => {
            const rawCounterpartName = detail?.counterpartName || "";

            const isPhoneNumber = /^\+?\d{8,15}$/.test(
                rawCounterpartName.replace(/[\s.-]/g, ""),
            );

            const needsLookup =
                isGenericDisplayName(rawCounterpartName) ||
                isPhoneNumber ||
                !(
                    detail?.counterpartAvatarUrl ||
                    detail?.counterpartAvatar ||
                    detail?.profilePicture ||
                    detail?.avatar
                );

            // FIX: Đảo thứ tự ưu tiên lấy tên:
            // 1. remarkName (nếu API BE có trả về)
            // 2. name (truyền từ param của màn hình Option về khi vừa đổi xong)
            // 3. Tên người dùng / SDT gốc
            let counterpartDisplayName = pickBestDisplayName(
                [
                    detail?.remarkName,
                    name,
                    isGenericDisplayName(rawCounterpartName)
                        ? ""
                        : rawCounterpartName,
                    detail?.counterpartUserName,
                    detail?.counterpartDisplayName,
                    detail?.displayName,
                    detail?.userName,
                    detail?.username,
                    detail?.name,
                ],
                "Tro chuyen",
            );

            let counterpartDisplayAvatar =
                detail?.counterpartAvatarUrl ||
                detail?.counterpartAvatar ||
                detail?.avatar ||
                "";

            const counterpartId =
                detail?.counterpartId || detail?.targetUserId || "";

            if (needsLookup && counterpartId) {
                try {
                    const userRes = await friendApi.getUserById(counterpartId);
                    const profile = userRes?.data || userRes;

                    const combinedName =
                        `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();

                    // FIX Tương tự trong phần lookup
                    counterpartDisplayName = pickBestDisplayName(
                        [
                            detail?.remarkName,
                            name,
                            profile?.displayName,
                            profile?.fullName,
                            combinedName,
                            profile?.name,
                            profile?.userName,
                            profile?.username,
                            isGenericDisplayName(rawCounterpartName)
                                ? ""
                                : rawCounterpartName,
                        ],
                        "Tro chuyen",
                    );

                    counterpartDisplayAvatar =
                        counterpartDisplayAvatar ||
                        profile?.avatarUrl ||
                        profile?.avatar ||
                        "";
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {}
            }

            realNameRef.current = counterpartDisplayName;

            // ✅ FIX 3: Sử dụng blockStatus từ parameter (đã được load trước)
            const mapped = dedupeMessages(
                Array.isArray(detail?.messages)
                    ? detail.messages
                          .filter((msg: any) => {
                              // ✅ NẾU TÔI ĐÃ CHẶN USER → BỎ MESSAGE CỦA HỌ
                              if (
                                  blockStatus.blockedByMe &&
                                  msg.senderId === counterpartId
                              ) {
                                  return false;
                              }
                              return true;
                          })
                          .map(mapApiMessageToUi)
                    : [],
            );

            setMessages(mapped);
            setCounterpartId(
                detail?.counterpartId || detail?.targetUserId || "",
            );
            setCounterpartName(counterpartDisplayName); // Sẽ trigger re-render biến displayName
            setCounterpartAvatar(counterpartDisplayAvatar);
            setCounterpartLastActiveAt(
                detail?.counterpartLastActiveAt ||
                    detail?.lastActiveAt ||
                    detail?.lastMessageAt ||
                    detail?.updatedAt ||
                    "",
            );

            setCounterpartOnline(
                Boolean(
                    detail?.counterpartOnline ||
                    detail?.online ||
                    detail?.isOnline,
                ),
            );

            // ✅ FIX 4: Cập nhật block status từ kết quả
            setIsBlockedByMe(blockStatus.blockedByMe);
            setIsBlockedByThem(blockStatus.blockedByThem);
        };

        try {
            const detail = await chatApi.getConversationDetail(conversationKey);
            if (!normalizedConversationId && targetUserId) {
                setResolvedConversationId(conversationKey);
            }

            // ✅ FIX 5: LOAD BLOCK STATUS TRƯỚC KHI LOAD MESSAGES
            const counterpartId =
                detail?.counterpartId || detail?.targetUserId || "";
            const blockStatus = await loadBlockStatusForUser(counterpartId);

            // Cập nhật state với block status
            if (counterpartId) {
                setIsBlockedByMe(blockStatus.blockedByMe);
                setIsBlockedByThem(blockStatus.blockedByThem);
            }

            updateConversationState(detail, blockStatus);
            chatApi.markRead(conversationKey);
        } catch (error: any) {
            if (targetUserId && conversationKey === targetUserId) {
                try {
                    const resolvedId =
                        await chatApi.findConversationIdByUserId(targetUserId);
                    if (resolvedId) {
                        setResolvedConversationId(resolvedId);
                        const detail =
                            await chatApi.getConversationDetail(resolvedId);
                        // ✅ FIX 6: Load block status cũng trong catch block
                        const blockStatus =
                            await loadBlockStatusForUser(targetUserId);
                        await updateConversationState(detail, blockStatus);
                        await chatApi.markRead(resolvedId);
                        return;
                    }
                } catch (resolveError) {
                    console.warn(
                        "resolveConversationIdByUserId failed:",
                        resolveError,
                    );
                }
            }

            Alert.alert(
                "Lỗi",
                error?.message || "Không thể tải cuộc trò chuyện.",
            );
        } finally {
            setLoading(false);
        }
    }, [
        mapApiMessageToUi,
        name,
        normalizedConversationId,
        targetUserId,
        loadBlockStatusForUser,
    ]);

    const {
        handlePickMedia,
        handlePickFile,
        handlePickVoice,
        handleOpenFile,
        startRecording,
        stopRecording,
        cancelRecording,
    } = useChatAttachments(
        normalizedConversationId || undefined,
        targetUserId || undefined,
        loadConversationDetail,
    );

    // Recording UI state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );
    const recordingStopTimeoutRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
    const isRecordingRef = useRef(false); // synchronous guard — prevents double-start race
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
        // Use ref (not state) to avoid race when called twice before a re-render
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
            // Inline stop to avoid stale closure — handleVoiceRecordStop captures
            // isRecording=false from the render before setIsRecording(true) committed.
            recordingStopTimeoutRef.current = setTimeout(() => {
                stopRecordingUI();
                void stopRecording?.().catch((e: any) =>
                    console.error("auto-stop recording failed:", e),
                );
            }, MAX_RECORD_SECONDS * 1000);
        } catch (e) {
            console.error("startRecording failed:", e);
            stopRecordingUI();
        }
    };

    const handleVoiceRecordStop = async () => {
        if (!isRecordingRef.current || voiceFinalizeRef.current) return; // use ref, not stale state
        voiceFinalizeRef.current = "stop";
        stopRecordingUI();
        try {
            await stopRecording?.();
        } catch (e) {
            console.error("stopRecording failed:", e);
        } finally {
            voiceFinalizeRef.current = null;
        }
    };

    // Called by VoiceRecordControl on cancel or short-tap.
    // Must reset UI state AND stop the native recording.
    const handleVoiceRecordCancel = async () => {
        if (voiceFinalizeRef.current) return;
        voiceFinalizeRef.current = "cancel";
        stopRecordingUI();
        try {
            await cancelRecording?.();
        } catch (e) {
            console.error("cancelRecording failed:", e);
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

    useEffect(() => {
        (async () => {
            try {
                const sub = await chatAuthUtils.getCurrentUserId();
                if (sub) {
                    setCurrentUserId(sub);
                }
            } catch (error) {
                setCurrentUserId("");
            }
        })();
    }, []);

    useEffect(() => {
        loadConversationDetail();
    }, [loadConversationDetail, name]);

    // When the conversation changes: clear cached forward targets and close search sheet
    // to prevent stale data from a previous conversation leaking into the new one.
    useEffect(() => {
        forwardTargetsRef.current = [];
        setShowSearchSheet(false);
        setSearchKeyword("");
        setSearchResults([]);
    }, [normalizedConversationId]);

    // Open search sheet when navigated back from account-option with openSearch param
    useEffect(() => {
        if (openSearch === "1") {
            setShowSearchSheet(true);
            router.setParams({ openSearch: "" });
        }
    }, [openSearch]);

    const handleIncomingRealtimeMessage = useCallback(
        (payload: any) => {
            if (Array.isArray(payload)) {
                const currentConv = payload.find(
                    (conv) => conv?.conversationId === normalizedConversationId,
                );

                if (currentConv) {
                    loadConversationDetail();
                }
                return;
            }

            const incoming = payload?.data || payload?.message || payload;
            const incomingConversationId =
                incoming?.conversationId || payload?.conversationId;
            const incomingType = String(
                incoming?.type ||
                    payload?.type ||
                    incoming?.action ||
                    payload?.action ||
                    "",
            ).toUpperCase();

            if (
                incomingConversationId &&
                incomingConversationId !== normalizedConversationId
            ) {
                return;
            }

            if (incomingType === "TYPING") {
                setRemoteTyping(true);
                if (typingTimerRef.current)
                    clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(
                    () => setRemoteTyping(false),
                    2000,
                );
                return;
            }

            const isReadEvent =
                incomingType === "READ" ||
                incomingType === "SEEN" ||
                incomingType === "MARK_READ" ||
                incoming?.status === "READ" ||
                incoming?.isRead === true;

            if (isReadEvent) {
                loadConversationDetail();
                return;
            }

            if (incoming?.id) {
                // ✅ NẾU TÔI ĐÃ CHẶN NGƯỜI GỬI → BỎ MESSAGE
                if (isBlockedByMe && incoming.senderId === counterpartId) {
                    console.log("[ChatScreen] Drop message from blocked user");
                    return;
                }

                mergeIncomingMessage(incoming);

                if (normalizedConversationId) {
                    chatApi.markRead(normalizedConversationId).catch(() => {});
                }
                return;
            }
            loadConversationDetail();
        },
        [
            counterpartId,
            isBlockedByMe,
            loadConversationDetail,
            mergeIncomingMessage,
            normalizedConversationId,
        ],
    );

    const { connected } = useChatRealtime({
        currentUserId,
        conversationId: normalizedConversationId,
        onConversationMessage: handleIncomingRealtimeMessage,
    });

    const handleSend = async () => {
        if (isBlockedByMe) {
            Alert.alert("Bạn đã chặn người này");
            return;
        }

        if (isBlockedByThem) {
            Alert.alert("Bạn không thể gửi tin nhắn");
            return;
        }
        const content = message.trim();
        if (!normalizedConversationId || !content) return;

        const payload = {
            conversationId: normalizedConversationId,
            senderId: currentUserId,
            type: "TEXT",
            content,
        };

        const optimisticId = `tmp-${Date.now()}`;
        const now = new Date();

        const optimisticMessage = {
            id: optimisticId,
            text: content,
            type: "right",
            time: now.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            pending: true,
            raw: {
                id: optimisticId,
                content,
                type: "TEXT",
                senderId: currentUserId,
                displayPosition: "RIGHT",
                createdAt: now.toISOString(),
            },
        };

        setMessages((prev) => dedupeMessages([...prev, optimisticMessage]));
        setMessage("");

        try {
            const sent = await chatApi.sendMessage(payload);
            if (sent && typeof sent === "object" && "id" in sent) {
                const serverMessage = mapApiMessageToUi(sent);
                setMessages((prev) =>
                    dedupeMessages(
                        prev.map((item) =>
                            item.id === optimisticId
                                ? { ...serverMessage, pending: false }
                                : item,
                        ),
                    ),
                );
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const msg = String(
                error?.response?.data?.message || "",
            ).toLowerCase();

            // ✅ FIX 7: Cải thiện error handling khi bị chặn
            // Mở rộng điều kiện: 403 hoặc có chứa chữ block/chặn
            if (
                status === 403 ||
                msg.includes("block") ||
                msg.includes("chặn")
            ) {
                setIsBlockedByThem(true);
                setMessages((prev) =>
                    prev.filter((item) => item.id !== optimisticId),
                );
                // ✅ Thêm alert để B biết mình bị chặn
                Alert.alert(
                    "Không thể gửi",
                    "Bạn không thể gửi tin nhắn vì đã bị chặn hoặc người này đã chặn bạn.",
                );
                return;
            }

            // Nếu là lỗi mạng/lỗi khác thông thường
            setMessages((prev) =>
                prev.filter((item) => item.id !== optimisticId),
            );
            setMessage(content);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
        }
    };

    const handleUnsendMessage = async () => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.revokeMessage(selectedMessage.id);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể thu hồi tin nhắn");
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.deleteMessage(selectedMessage.id);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể xóa tin nhắn");
        }
    };

    const handleReactMessage = async (reaction: string) => {
        if (!selectedMessage?.id) return;
        try {
            await chatApi.reactToMessage(selectedMessage.id, reaction);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch {
            Alert.alert("Lỗi", "Không thể thả cảm xúc lúc này.");
        }
    };

    const openEditModal = () => {
        const isOwner = selectedMessage?.senderId === currentUserId;
        const canEdit =
            isOwner &&
            String(selectedMessage?.type || "").toUpperCase() === "TEXT";
        if (!canEdit) return;
        setEditingContent(selectedMessage?.content || "");
        setShowEditModal(true);
    };

    const handleEditMessage = async () => {
        if (!selectedMessage?.id || !editingContent.trim()) return;
        try {
            await chatApi.editMessage(
                selectedMessage.id,
                editingContent.trim(),
            );
            setShowEditModal(false);
            setSelectedMessage(null);
            await loadConversationDetail();
        } catch {
            Alert.alert("Lỗi", "Không thể chỉnh sửa tin nhắn.");
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

    const forwardTargetsRef = useRef<any[]>([]);

    const handleSelectMessage = async (msg: any) => {
        setSelectedMessage(msg.raw || msg);

        // Use cached targets if already loaded
        if (forwardTargetsRef.current.length > 0) {
            setForwardTargets(forwardTargetsRef.current);
            return;
        }

        try {
            const conversations = await chatApi.getConversations();
            let targets = Array.isArray(conversations)
                ? conversations.filter(
                      (conv) =>
                          conv.conversationId !== normalizedConversationId,
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
                        } catch (error) {
                            console.log(
                                "[handleSelectMessage] User lookup failed for",
                                targetUserId,
                            );
                        }
                    }

                    return {
                        ...target,
                        _displayName: displayName,
                        _displayAvatar: displayAvatar,
                    };
                }),
            );

            forwardTargetsRef.current = targets;
            setForwardTargets(targets);
        } catch (error) {
            console.error(
                "[ChatScreen] Error fetching forward targets:",
                error,
            );
            setForwardTargets([]);
        }
    };

    const handleHeaderBack = () => {
        if (from === "contact") {
            router.replace("/(tabs)/contact" as any);
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/(tabs)/message" as any);
    };

    // Handle Android hardware back button — same safe fallback as header button
    useEffect(() => {
        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                handleHeaderBack();
                return true;
            },
        );
        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, router]);

    // Reverse messages for FlatList inverted mode (newest at bottom = index 0)

    const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

    return (
        <SafeAreaView className="flex-1 bg-[#e9edf2]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
            >
                {/* Header */}
                <View className="bg-blue-600 flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={handleHeaderBack}>
                            <MoveLeft size={26} color="white" />
                        </TouchableOpacity>

                        <View className="ml-3">
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname:
                                            "/(tabs)/message/option/account-option" as any,
                                        params: {
                                            conversationId:
                                                normalizedConversationId,
                                            targetUserId: counterpartId,
                                            name: displayName,
                                            avatar: avatar || "",
                                        },
                                    })
                                }
                            >
                                <Text className="text-white font-semibold text-[16px]">
                                    {displayName}
                                </Text>
                                <View className="flex-row items-center flex-wrap">
                                    <Text className="text-white text-[12px] opacity-80">
                                        {counterpartLastActiveAt
                                            ? `Hoạt động ${formatRelativeActivity(counterpartLastActiveAt)}`
                                            : "Hoạt động gần đây"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View className="flex-row items-center ml-9">
                        <TouchableOpacity
                            onPress={() => setShowSearchSheet(true)}
                        >
                            <Search size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={handleVideoCall}
                        >
                            <Phone size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 10 }}
                            onPress={() =>
                                router.push({
                                    pathname:
                                        "/(tabs)/message/option/account-option" as any,
                                    params: {
                                        conversationId:
                                            normalizedConversationId,
                                        targetUserId: counterpartId,
                                        name: displayName,
                                        avatar: avatar || "",
                                    },
                                })
                            }
                        >
                            <MoreHorizontal size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages List — FlatList (inverted) for virtualized rendering */}
                {/* Inverted list: newest messages are at the bottom (index 0 is bottom) */}
                <FlatList
                    ref={flatListRef}
                    data={reversedMessages}
                    keyExtractor={(item: any, index: number) =>
                        getMessageKey(item, index)
                    }
                    inverted
                    style={{ flex: 1, paddingHorizontal: 12 }}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    initialNumToRender={20}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    keyboardShouldPersistTaps="handled"
                    onScrollToIndexFailed={() => {}}
                    ListHeaderComponent={
                        remoteTyping ? (
                            <View className="flex-row items-center mb-3 ml-1">
                                <View
                                    className="bg-white px-4 py-2 rounded-2xl shadow-sm flex-row items-center"
                                    style={{ gap: 4 }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <View
                                            key={i}
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: 3,
                                                backgroundColor: "#9ca3af",
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loading ? (
                            <View className="py-8 items-center">
                                <ActivityIndicator
                                    size="small"
                                    color="#2563eb"
                                />
                            </View>
                        ) : null
                    }
                    renderItem={({ item: msg, index }) => {
                        const messageSide = getMessageSide(msg);

                        // SYSTEM CALL MESSAGE
                        if (
                            msg.raw?.type === "SYSTEM" &&
                            (msg.text?.includes("cuộc gọi") ||
                                msg.text?.includes("không phản hồi"))
                        ) {
                            return (
                                <View className="flex-row justify-center mb-3">
                                    <View className="bg-gray-200 px-4 py-2 rounded-full flex-row items-center max-w-[85%]">
                                        <Phone size={14} color="#4b5563" />
                                        <Text className="text-[12px] text-gray-700 ml-2 font-medium">
                                            {msg.text}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }

                        // CENTER MESSAGE
                        if (messageSide === "center") {
                            return (
                                <View className="flex-row justify-center mb-3">
                                    <View className="bg-gray-200 px-3 py-2 rounded-full max-w-[85%]">
                                        <Text className="text-[13px] text-gray-700 text-center">
                                            {msg.text}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }

                        // LEFT & RIGHT MESSAGE
                        const isMe = messageSide === "right";
                        return (
                            <View
                                className={`flex-row mb-3 ${isMe ? "justify-end" : ""}`}
                            >
                                {!isMe &&
                                    (avatarUrl ? (
                                        <RNImage
                                            source={{ uri: avatarUrl }}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                    ) : (
                                        <View className="w-8 h-8 rounded-full bg-blue-500 mr-2 items-center justify-center">
                                            <Text className="text-white text-xs font-semibold">
                                                {getInitials(displayName)}
                                            </Text>
                                        </View>
                                    ))}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onLongPress={() =>
                                        !msg.system && handleSelectMessage(msg)
                                    }
                                    onPress={() => {
                                        if (msg.imageUri || msg.videoUri) {
                                            setViewingMediaMessage(msg);
                                        } else if (
                                            msg.isFile ||
                                            msg.raw?.type === "FILE" ||
                                            msg.raw?.attachment
                                        ) {
                                            const url = resolveFileUrl(
                                                msg.fileUrl ||
                                                    msg.raw?.attachment
                                                        ?.fileUrl,
                                            );
                                            handleOpenFile(
                                                url,
                                                msg.fileName ||
                                                    msg.text ||
                                                    "Tài liệu",
                                            );
                                        }
                                    }}
                                    className={`${
                                        highlightedMessageId === msg.id
                                            ? "bg-[#FFF9C4] border border-[#FBC02D]"
                                            : isMe
                                              ? "bg-blue-500"
                                              : "bg-white"
                                    } px-4 py-2 rounded-2xl max-w-[70%] ${msg.pending ? "opacity-70" : ""}`}
                                >
                                    {!isMe && msg.senderName && (
                                        <Text className="mb-1 text-[11px] font-medium text-gray-400">
                                            {msg.senderName}
                                        </Text>
                                    )}

                                    {/* FILE BLOCK */}
                                    {msg.isFile && (
                                        <View
                                            className={`flex-row items-center mb-1 p-2 rounded-lg ${isMe ? "bg-blue-700" : "bg-gray-100"}`}
                                        >
                                            <Paperclip
                                                size={16}
                                                color={
                                                    isMe ? "white" : "#4b5563"
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

                                    {/* MEDIA BLOCK */}
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
                                                source={{ uri: msg.videoUri }}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                                resizeMode={ResizeMode.COVER}
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

                                    {/* TEXT */}
                                    {msg.text !== "" &&
                                        !(msg.raw?.type === "FILE") && (
                                            <Text
                                                className={`text-[15px] ${isMe ? "text-white" : "text-black"}`}
                                            >
                                                {msg.text}
                                            </Text>
                                        )}
                                    <Text
                                        className={`text-[11px] mt-1 ${isMe ? "text-blue-100 text-right" : "text-gray-500"}`}
                                    >
                                        {isMe
                                            ? getMessageStatusLabel(msg)
                                            : msg.time}
                                    </Text>
                                    {Array.isArray(msg.reactions) &&
                                        msg.reactions.length > 0 &&
                                        (() => {
                                            const counts: Record<
                                                string,
                                                number
                                            > = {};
                                            msg.reactions.forEach((r: any) => {
                                                const e =
                                                    r?.reaction || r?.emoji;
                                                if (e)
                                                    counts[e] =
                                                        (counts[e] || 0) + 1;
                                            });
                                            return (
                                                <View
                                                    className="flex-row mt-1"
                                                    style={{ gap: 4 }}
                                                >
                                                    {Object.entries(counts).map(
                                                        ([emoji, count]) => (
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
                                                                {count > 1 && (
                                                                    <Text className="text-[10px] text-gray-500">
                                                                        {count}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                        ),
                                                    )}
                                                </View>
                                            );
                                        })()}
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />

                {/* --- HIỂN THỊ CẢNH BÁO KHI BỊ CHẶN (ẢNH 1) --- */}
                {isBlockedByThem && !isBlockedByMe && (
                    <View className="items-center pb-2 z-10 -mt-8">
                        <View className="bg-white border border-gray-200 px-4 py-2 flex-row items-center rounded-full shadow-sm">
                            <X size={16} color="#6b7280" />
                            <Text className="text-gray-700 text-[13px] ml-2 font-medium">
                                {displayName} đã chặn tin nhắn.
                            </Text>
                        </View>
                    </View>
                )}

                {isBlockedByMe ? (
                    // Nếu TÔI chặn người kia
                    <View className="bg-white px-4 pt-4 pb-8 border-t border-gray-100 items-center">
                        <Text className="text-gray-800 text-sm mb-4 font-medium">
                            Bạn đã chặn tin nhắn
                        </Text>
                        <TouchableOpacity
                            className="bg-[#e9f2ff] py-3 rounded-full w-full items-center"
                            onPress={handleUnblock}
                        >
                            <Text className="text-blue-600 font-semibold text-[16px]">
                                Bỏ chặn
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : isBlockedByThem ? (
                    // ✅ THÊM: Nếu BỊ CHẶN bởi người kia
                    <View className="bg-white px-4 pt-4 pb-8 border-t border-gray-100 items-center">
                        <Text className="text-gray-800 text-sm mb-4 font-medium">
                            {displayName} đã chặn tin nhắn của bạn
                        </Text>
                        <Text className="text-gray-600 text-xs text-center">
                            Bạn không thể gửi tin nhắn đến họ
                        </Text>
                    </View>
                ) : (
                    // Normal input bar
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
                        isBlockedByMe={isBlockedByMe}
                        isBlockedByThem={isBlockedByThem}
                        onUnblock={handleUnblock}
                        displayName={displayName}
                        isGroupChat={false}
                        showEmojiButton={true}
                        showMoreButton={true}
                        onEmojiPress={() => setShowEmojiMenu((prev) => !prev)}
                        showEmojiMenu={showEmojiMenu}
                        onEmojiSelect={(emoji) => {
                            setMessage((prev) => `${prev}${emoji}`);
                            setShowEmojiMenu(false);
                        }}
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
                    <View className="flex-1 bg-black/40 justify-end px-4 pb-10">
                        <View className="bg-white rounded-2xl p-4">
                            <View className="py-2 flex-row items-center">
                                {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => (
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
                                ))}
                            </View>
                            {selectedMessage?.senderId === currentUserId &&
                                String(
                                    selectedMessage?.type || "",
                                ).toUpperCase() === "TEXT" && (
                                    <TouchableOpacity
                                        className="py-3 flex-row items-center"
                                        onPress={openEditModal}
                                    >
                                        <Text className="text-sm text-gray-700">
                                            Chỉnh sửa tin nhắn
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            <TouchableOpacity
                                className="py-3 flex-row items-center"
                                onPress={handleUnsendMessage}
                            >
                                <Undo2 size={18} color="#f97316" />
                                <Text className="ml-2 text-sm text-gray-700">
                                    Thu hồi
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="py-3 flex-row items-center"
                                onPress={handleDeleteMessage}
                            >
                                <Trash2 size={18} color="#ef4444" />
                                <Text className="ml-2 text-sm text-red-500">
                                    Xóa phía mình
                                </Text>
                            </TouchableOpacity>
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
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-center px-5">
                    <View className="bg-white rounded-2xl p-5">
                        <Text className="text-base font-semibold text-gray-900 mb-3">
                            Chỉnh sửa tin nhắn
                        </Text>
                        <TextInput
                            className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                            value={editingContent}
                            onChangeText={setEditingContent}
                            multiline
                            autoFocus
                            maxLength={2000}
                            placeholder="Nội dung tin nhắn..."
                            placeholderTextColor="#9ca3af"
                            style={{ minHeight: 64, maxHeight: 160 }}
                        />
                        <View
                            className="flex-row justify-end"
                            style={{ gap: 12 }}
                        >
                            <TouchableOpacity
                                className="px-4 py-2 rounded-xl"
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text className="text-gray-500 font-medium">
                                    Hủy
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-blue-600 px-5 py-2 rounded-xl"
                                onPress={handleEditMessage}
                                disabled={!editingContent.trim()}
                            >
                                <Text className="text-white font-semibold">
                                    Lưu
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
                <View style={{ flex: 1, backgroundColor: "black" }}>
                    {/* Close button */}
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            top: 48,
                            right: 16,
                            zIndex: 20,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            borderRadius: 20,
                            padding: 8,
                        }}
                        onPress={() => setViewingMediaMessage(null)}
                        hitSlop={12}
                    >
                        <X size={22} color="white" />
                    </TouchableOpacity>

                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {viewingMediaMessage?.videoUri ? (
                            <AVVideo
                                source={{ uri: viewingMediaMessage.videoUri }}
                                style={{ width: "95%", height: "60%" }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                            />
                        ) : viewingMediaMessage?.imageUri ? (
                            <RNImage
                                source={{ uri: viewingMediaMessage.imageUri }}
                                style={{
                                    width: "95%",
                                    height: "70%",
                                    resizeMode: "contain",
                                }}
                            />
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* Search Modal */}
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
                        {/* Handle bar */}
                        <View className="items-center mb-3">
                            <View className="w-10 h-1 rounded-full bg-gray-300" />
                        </View>

                        <View className="px-4">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Tìm tin nhắn
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
                            {searchResults.map((item: any) => (
                                <TouchableOpacity
                                    key={item.id}
                                    className="py-3 border-b border-gray-100 active:bg-blue-50"
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
                                        {item.content}
                                    </Text>
                                    <Text className="text-[11px] text-gray-400 mt-1">
                                        {new Date(
                                            item.createdAt,
                                        ).toLocaleString("vi-VN")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <View className="h-4" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
