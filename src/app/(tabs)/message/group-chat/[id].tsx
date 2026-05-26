import { chatApi, chatAuthUtils } from "@/src/api/chat/chatApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { groupApi } from "@/src/api/group/groupApi";
import { Message } from "@/src/api/group/types";
import ChatInputBar from "@/src/components/ChatInputBar";
import { PinnedMessageBar } from "@/src/components/PinnedMessageBar";
import { useChatAttachments } from "@/src/hooks/useChatAttchment";
import { useChatRealtime } from "@/src/hooks/useChatRealtime";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { Video as AVVideo, ResizeMode } from "expo-av";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
    MoreHorizontal,
    MoveLeft,
    Paperclip,
    Pin,
    Search,
    Trash2,
    Undo,
    UserPlus,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
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

const resolveFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    // API Gateway (9000) handles served file routing
    return `http://14.225.192.37:8085${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

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

const getUniqueVotersCount = (options: any[]) => {
    const uniqueIds = new Set<string>();
    options.forEach((opt) => {
        const optionVoters = Array.isArray(opt.voters) ? opt.voters : [];
        optionVoters.forEach((voter) => {
            const voterId = extractValidId(voter);
            if (voterId) {
                uniqueIds.add(voterId);
            }
        });
    });
    return uniqueIds.size;
};

type UserProfileDict = Record<
    string,
    { displayName: string; avatarUrl: string | null }
>;

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
    }>();

    const conversationId = paramToString(params.id);
    const initialName = paramToString(params.name);
    const initialAvatar = paramToString(params.avatar);

    const [messages, setMessages] = useState<UiMessage[]>([]);
    const [message, setMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [groupName, setGroupName] = useState(initialName);
    const [groupAvatar, setGroupAvatar] = useState(initialAvatar);

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

    const scrollViewRef = useRef<ScrollView>(null);
    const messageYOffsets = useRef<Record<string, number>>({});

    const scrollToMessage = (msgId: string) => {
        const yOffset = messageYOffsets.current[msgId];
        if (yOffset !== undefined) {
            setHighlightedMessageId(msgId);
            scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });

            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
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
            const hasAttachment =
                !!item?.attachment?.fileUrl || !!item?.attachment?.fileName;
            const profile = sId ? profiles[sId] : null;

            // FIX: Lấy fileUrl từ attachment hoặc từ item trực tiếp
            const fileUrl = item?.attachment?.fileUrl || item?.fileUrl;

            return {
                id: String(item?.id || item?.messageId || `msg-${Date.now()}`),
                text: item?.content || "",
                position: isMe ? "right" : "left",
                time: item?.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "",
                imageUri: ["IMAGE", "GIF"].includes(String(item?.type || ""))
                    ? resolveFileUrl(fileUrl)
                    : null,
                videoUri:
                    item?.type === "VIDEO" ? resolveFileUrl(fileUrl) : null,
                voiceUri:
                    item?.type === "VOICE" ? resolveFileUrl(fileUrl) : null,
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
                    hasAttachment && !["IMAGE", "VIDEO"].includes(item?.type),
                fileName:
                    item?.attachment?.fileName || item?.content || "Tài liệu",
                fileUrl: resolveFileUrl(fileUrl),
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
                        console.log(
                            "[GroupChat] Lỗi getGroupMembers, vẫn tiếp tục:",
                            err?.message,
                        );
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

                    console.log("[GroupChat] fetched user:", userId, userData);

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
                } catch (e) {
                    console.log("[GroupChat] fallback user:", userId);

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
                console.log(
                    `[GroupChat] Cần fetch bổ sung ${missingUserIds.size} người...`,
                );
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
        } catch (error) {
            console.log("[GroupChat] load error", error);
            Alert.alert("Lỗi", "Không thể tải cuộc trò chuyện.");
        }
    }, [
        conversationId,
        currentUserId,
        initialAvatar,
        initialName,
        mapApiMessageToUi,
    ]);

    const { handlePickMedia, handlePickFile, handlePickVoice, handleOpenFile } =
        useChatAttachments(conversationId, loadGroupConversation);

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

            setForwardTargets(targets);
        } catch (error) {
            console.error(
                "[GroupChatScreen] Error fetching forward targets:",
                error,
            );
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

    const handleSearchMessages = async () => {
        if (!conversationId || !searchKeyword.trim()) return;
        setSearchLoading(true);
        try {
            const result = await chatApi.searchInConversation(
                conversationId,
                searchKeyword.trim(),
            );
            setSearchResults(Array.isArray(result) ? result : []);
        } catch {
            Alert.alert("Lỗi", "Không thể tìm kiếm tin nhắn.");
        } finally {
            setSearchLoading(false);
        }
    };

    // FIX: Hàm pin - không reload ngay, chờ realtime event
    const handlePinMessage = async () => {
        if (!selectedMessage?.id || !conversationId) return;

        try {
            await chatApi.pinMessage(conversationId, selectedMessage.id);
            setSelectedMessage(null);
            await loadGroupConversation();
        } catch (error) {
            console.error("[GroupChat] Pin error:", error);
            Alert.alert("Lỗi", "Không thể ghim tin nhắn này.");
        }
    };

    const handleUnpinMessage = async (msgId: string) => {
        if (!conversationId) return;
        try {
            await chatApi.unpinMessage(conversationId, msgId);
            await loadGroupConversation();
        } catch (error) {
            console.error("[GroupChat] Unpin error:", error);
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
                        <TouchableOpacity onPress={() => router.back()}>
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
                        <TouchableOpacity
                            onPress={() => {
                                router.push({
                                    pathname: "/contact/group/add-member",
                                    params: { conversationId },
                                });
                            }}
                        >
                            <UserPlus size={22} color="white" />
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

                <PinnedMessageBar
                    pinnedMessages={pinnedMessages}
                    onUnpin={handleUnpinMessage}
                    onPress={(msgId: string) => {
                        scrollToMessage(msgId);
                    }}
                />

                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-3 pt-4"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => {
                        const isMe = msg.position === "right";

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
                                        className={`bg-white p-4 rounded-2xl ${highlightedMessageId === msg.id ? "border-2 border-cyan-800" : ""}`}
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
                                                    msg.fileName,
                                                );
                                            }
                                        }}
                                        onLongPress={() =>
                                            !msg.isUnsent &&
                                            !msg.pending &&
                                            handleSelectMessage(msg)
                                        }
                                        className={`${isMe ? "bg-[#cde7f4]" : "bg-white"} px-4 py-2 rounded-2xl max-w-[74%] ${highlightedMessageId === msg.id ? "border-2 border-cyan-800" : ""}`}
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
                                            <View
                                                className={`mb-1 p-2 rounded-lg ${isMe ? "bg-blue-100" : "bg-gray-100"}`}
                                            >
                                                <Text className="text-[13px] text-gray-700">
                                                    Tin nhắn thoại
                                                </Text>
                                            </View>
                                        ) : null}

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

                                        {msg.text !== "" && (
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
                                            msg.reactions.length > 0 && (
                                                <Text className="text-[11px] mt-1 text-gray-500">
                                                    {msg.reactions
                                                        .map(
                                                            (r: any) =>
                                                                r?.reaction ||
                                                                r?.emoji,
                                                        )
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                </Text>
                                            )}
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
                                <TouchableOpacity
                                    className="py-3 flex-row items-center border-b border-gray-100"
                                    onPress={handlePinMessage}
                                >
                                    <Pin size={20} color="#2563eb" />
                                    <Text className="ml-3 text-[15px] text-blue-600">
                                        Ghim tin nhắn
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
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={showSearchSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSearchSheet(false)}
            >
                <View className="flex-1 bg-black/30 justify-end">
                    <View className="bg-white rounded-t-3xl px-4 pt-4 pb-7 max-h-[70%]">
                        <Text className="text-base font-semibold mb-3">
                            Tìm trong nhóm
                        </Text>
                        <View className="flex-row mb-3">
                            <TextInput
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
                                placeholder="Nhập từ khóa"
                                value={searchKeyword}
                                onChangeText={setSearchKeyword}
                            />
                            <TouchableOpacity
                                className="ml-2 px-4 py-2 bg-blue-600 rounded-xl"
                                onPress={handleSearchMessages}
                                disabled={searchLoading}
                            >
                                <Text className="text-white">
                                    {searchLoading ? "..." : "Tìm"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {searchResults.map((item: any) => (
                                <View
                                    key={String(item?.id || Math.random())}
                                    className="py-2 border-b border-gray-100"
                                >
                                    <Text className="text-sm">
                                        {item?.content || item?.text || ""}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowSearchSheet(false)}
                            className="mt-4 items-center"
                        >
                            <Text className="text-blue-600">Đóng</Text>
                        </TouchableOpacity>
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
