import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { getAccessToken, getRefreshToken } from "@/src/api/auth/authStorage";
import { securityApi } from "@/src/api/auth/securityApi";
import { SessionDeviceItem } from "@/src/api/auth/types";
import { userApi } from "@/src/api/user/userApi";
import { AccountLockConfirmModal } from "@/src/components/account-security/AccountLockConfirmModal";
import { DeviceSessionsList } from "@/src/components/account-security/DeviceSessionsList";
import { useQrLoginFlow } from "@/src/hooks/useQrLoginFlow";
import { getInitials, pickBestDisplayName } from "@/src/utils/displayUser";
import { useRouter } from "expo-router";
import {
    ChevronRight,
    KeyRound,
    Lock,
    MoveLeft,
    ScanQrCode,
    ShieldHalf,
    TriangleAlert,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSecurityScreen() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [activeSessions, setActiveSessions] = useState<SessionDeviceItem[]>(
        [],
    );
    const [inactiveSessions, setInactiveSessions] = useState<
        SessionDeviceItem[]
    >([]);
    const [userName, setUserName] = useState("Đang tải...");
    const [phoneNumber, setPhoneNumber] = useState("-");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const router = useRouter();
    const qrFlow = useQrLoginFlow();

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                const profile = await userApi.getProfile();
                if (!mounted) return;

                setUserName(
                    pickBestDisplayName(
                        [
                            profile?.userName,
                            profile?.username,
                            profile?.name,
                            profile?.displayName,
                            profile?.nickName,
                            profile?.nickname,
                            profile?.fullName,
                        ],
                        "Nguoi dung",
                    ),
                );
                setPhoneNumber(profile?.phone || "-");
                setAvatarUrl(
                    profile?.avatarUrl ||
                        profile?.avatar ||
                        profile?.profilePictureUrl ||
                        profile?.profilePicture ||
                        profile?.photoUrl ||
                        profile?.imageUrl ||
                        null,
                );
            } catch (error) {
                console.error("[account-security] loadProfile error:", error);
            }
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const [active, inactive] = await Promise.all([
                securityApi.getActiveSessions(),
                securityApi.getInactiveSessions(),
            ]);
            setActiveSessions(active);
            setInactiveSessions(inactive);
        } catch {
            Alert.alert("Lỗi", "Không thể tải danh sách thiết bị.");
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleLogoutSession = async (sessId?: string) => {
        if (!sessId) return;

        try {
            const accessToken = await getAccessToken();
            await authenticationApi.signoutBySession(
                sessId,
                accessToken || undefined,
            );
            Alert.alert("Thành công", "Đã đăng xuất thiết bị.");
            await fetchSessions();
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.message || "Không thể đăng xuất thiết bị.",
            );
        }
    };

    const handleLogoutAllDevices = async () => {
        try {
            const [accessToken, refreshToken] = await Promise.all([
                getAccessToken(),
                getRefreshToken(),
            ]);

            if (!refreshToken) {
                Alert.alert("Lỗi", "Không tìm thấy refresh token.");
                return;
            }

            await authenticationApi.signoutAll(
                { refreshToken },
                accessToken || undefined,
            );
            Alert.alert("Thành công", "Đã đăng xuất tất cả thiết bị.");
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.message || "Không thể đăng xuất tất cả thiết bị.",
            );
        }
    };

    const handleConfirmLock = async () => {
        try {
            setIsLocking(true);
            await securityApi.lockAccount();
            setShowLockModal(false);
            Alert.alert("Thành công", "Đã gửi yêu cầu khóa tài khoản.");
        } catch {
            Alert.alert("Lỗi", "Khóa tài khoản thất bại. Vui lòng thử lại.");
        } finally {
            setIsLocking(false);
        }
    };

    const handleQrLoginChallenge = async () => {
        try {
            const result = await qrFlow.startLogin({
                pollIntervalMs: 2000,
                maxAttempts: 30,
            });

            if (result.status === "authenticated") {
                Alert.alert("QR Login", "Thiết bị đã xác thực thành công.");
                return;
            }

            if (result.status === "approved") {
                Alert.alert(
                    "QR Login",
                    "Challenge đã được duyệt, đang chờ token đăng nhập.",
                );
                return;
            }

            Alert.alert(
                "QR Login",
                "Challenge đã hết hạn hoặc chưa được duyệt.",
            );
        } catch {
            Alert.alert("Lỗi", "Không thể khởi tạo QR login challenge.");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-5 bg-blue-600">
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                            return;
                        }
                        router.replace("/profile" as any);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MoveLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-[18px] font-medium ml-4">
                    Tài khoản và bảo mật
                </Text>
            </View>

            {/* Body */}
            <ScrollView
                className="flex-1 bg-slate-50"
                showsVerticalScrollIndicator={false}
            >
                {/* Section 1: Thông tin cá nhân */}
                <View className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden">
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                className="w-[46px] h-[46px] rounded-full mr-3"
                            />
                        ) : (
                            <View className="w-[46px] h-[46px] rounded-full mr-3 bg-blue-500 items-center justify-center">
                                <Text className="text-white font-semibold">
                                    {getInitials(userName)}
                                </Text>
                            </View>
                        )}
                        <View className="flex-1">
                            <Text className="text-[13px] text-gray-500 mb-[2px]">
                                Thông tin cá nhân
                            </Text>
                            <Text className="text-base font-normal text-black">
                                {userName}
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Số điện thoại */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="flex-1">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Số điện thoại
                            </Text>
                            <Text className="text-[14px] text-gray-500">
                                {phoneNumber}
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Email */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="flex-1">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Email
                            </Text>
                            <Text className="text-[14px] text-gray-500">
                                Chưa liên kết
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Mã QR */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4"
                        onPress={handleQrLoginChallenge}
                        activeOpacity={0.8}
                    >
                        <Text className="flex-1 text-base font-normal text-black">
                            Mã QR của tôi
                        </Text>
                        <Text className="mr-2 text-[12px] text-gray-500">
                            {qrFlow.status === "pending_approval"
                                ? "Đang chờ duyệt"
                                : qrFlow.status === "authenticated"
                                  ? "Đã xác thực"
                                  : "Sẵn sàng"}
                        </Text>
                        <ScanQrCode size={24} color="#888" />
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>

                {/* Tiêu đề mục: Bảo mật */}
                <View className="px-4 py-2 mt-1 bg-slate-50">
                    <Text className="text-[13px] font-medium text-[#0091FF]">
                        Bảo mật
                    </Text>
                </View>

                {/* Section 2: Bảo mật */}
                <View className="bg-white mx-3 rounded-2xl overflow-hidden">
                    {/* Kiểm tra bảo mật */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <ShieldHalf size={24} color="#666" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Kiểm tra bảo mật
                            </Text>
                            <Text className="text-[13px] text-[#E58A00]">
                                3 vấn đề bảo mật cần xử lý
                            </Text>
                        </View>
                        <TriangleAlert size={24} color="#E58A00" />
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Khóa Zalo */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4"
                        onPress={() => setShowLockModal(true)}
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <Lock size={24} color="#666" />
                        </View>
                        <Text className="flex-1 text-base font-normal text-black">
                            Khóa Zalo
                        </Text>
                        <Text className="text-[14px] text-gray-500 mr-1">
                            Đang tắt
                        </Text>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>

                {/* Tiêu đề mục: Đăng nhập */}
                <View className="px-4 py-2 mt-1 bg-slate-50">
                    <Text className="text-[13px] font-medium text-[#0091FF]">
                        Đăng nhập
                    </Text>
                </View>

                {/* Section 3: Đăng nhập */}
                <View className="bg-white mx-3 rounded-2xl overflow-hidden mb-6">
                    {/* Bảo mật 2 lớp */}
                    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Bảo mật 2 lớp
                            </Text>
                            <Text className="text-[13px] text-gray-500">
                                Thêm hình thức xác nhận để bảo vệ...
                            </Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#D1D5DB", true: "#0091FF" }}
                            thumbColor={"#FFFFFF"}
                            ios_backgroundColor="#D1D5DB"
                            onValueChange={() => setIs2FAEnabled(!is2FAEnabled)}
                            value={is2FAEnabled}
                        />
                    </View>

                    {/* Thiết bị đăng nhập */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                        onPress={async () => {
                            const next = !showSessions;
                            setShowSessions(next);
                            if (next) {
                                await fetchSessions();
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-normal text-black mb-[2px]">
                                Thiết bị đăng nhập
                            </Text>
                            <Text className="text-[13px] text-gray-500">
                                Quản lý các thiết bị bạn sử dụng...
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    {/* Mật khẩu */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4"
                        onPress={() =>
                            router.push(
                                "/profile/account-security/change-password" as any,
                            )
                        }
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <KeyRound size={24} color="#666" />
                        </View>
                        <Text className="flex-1 text-base font-normal text-black">
                            Mật khẩu
                        </Text>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4 border-t border-gray-100"
                        onPress={handleLogoutAllDevices}
                        activeOpacity={0.8}
                    >
                        <View className="w-8">
                            <TriangleAlert size={24} color="#dc2626" />
                        </View>
                        <Text className="flex-1 text-base font-normal text-black">
                            Đăng xuất tất cả thiết bị
                        </Text>
                        <ChevronRight size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>

                {showSessions && (
                    <>
                        <DeviceSessionsList
                            title="Thiết bị đang hoạt động"
                            sessions={activeSessions}
                            isLoading={isLoadingSessions}
                            emptyText="Không có thiết bị đang hoạt động"
                            actionLabel="Đăng xuất"
                            onActionPress={handleLogoutSession}
                        />
                        <DeviceSessionsList
                            title="Lịch sử thiết bị"
                            sessions={inactiveSessions}
                            isLoading={isLoadingSessions}
                            emptyText="Không có lịch sử thiết bị"
                        />
                    </>
                )}
            </ScrollView>

            <AccountLockConfirmModal
                visible={showLockModal}
                loading={isLocking}
                onClose={() => setShowLockModal(false)}
                onConfirm={handleConfirmLock}
            />
        </SafeAreaView>
    );
}
