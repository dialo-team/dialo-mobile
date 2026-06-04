import { authenticationApi } from "@/src/api/auth/authenticationApi";
import { friendApi } from "@/src/api/friend/friendApi";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DIM = "rgba(0,0,0,0.55)";
const CORNER_LEN = 28;
const CORNER_THICK = 4;

function QRFrameOverlay() {
    const { width: W, height: H } = useWindowDimensions();
    const frameSize = Math.min(W, H) * 0.68;
    const insetX = (W - frameSize) / 2;
    const insetY = (H - frameSize) / 2 - 28;
    const bottomBarH = Math.max(0, H - insetY - frameSize);

    return (
        <View
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            pointerEvents="none"
        >
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: insetY,
                    backgroundColor: DIM,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: bottomBarH,
                    backgroundColor: DIM,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: 0,
                    width: insetX,
                    height: frameSize,
                    backgroundColor: DIM,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: insetX + frameSize,
                    right: 0,
                    height: frameSize,
                    backgroundColor: DIM,
                }}
            />

            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: insetX,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderTopWidth: CORNER_THICK,
                    borderLeftWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY,
                    left: insetX + frameSize - CORNER_LEN,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderTopWidth: CORNER_THICK,
                    borderRightWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY + frameSize - CORNER_LEN,
                    left: insetX,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderBottomWidth: CORNER_THICK,
                    borderLeftWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: insetY + frameSize - CORNER_LEN,
                    left: insetX + frameSize - CORNER_LEN,
                    width: CORNER_LEN,
                    height: CORNER_LEN,
                    borderBottomWidth: CORNER_THICK,
                    borderRightWidth: CORNER_THICK,
                    borderColor: "#fff",
                }}
            />

            <Text
                style={{
                    position: "absolute",
                    top: insetY + frameSize + 18,
                    left: 24,
                    right: 24,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 15,
                }}
            >
                Đưa mã QR vào khung để quét
            </Text>
        </View>
    );
}

function parseScannedQrData(data: string) {
    const trimmed = data?.trim();
    if (!trimmed) {
        return { type: "unknown" as const };
    }

    // ✅ 1. Detect LOGIN bằng pattern CHẮC CHẮN
    const match = trimmed.match(/auth\/qr\/challenges\/([^\/?#]+)/i);
    if (match?.[1]) {
        return {
            type: "login" as const,
            challengeId: match[1],
        };
    }

    try {
        const url = new URL(trimmed);

        const pathMatch = url.pathname.match(
            /auth\/qr\/challenges\/([^\/?#]+)/i,
        );

        if (pathMatch?.[1]) {
            return {
                type: "login" as const,
                challengeId: pathMatch[1],
            };
        }
    } catch {
        // ignore
    }

    // ❌ KHÔNG còn UUID CHECK nữa

    // 🟢 2. Còn lại coi là FRIEND
    return {
        type: "friend" as const,
        qrToken: trimmed,
    };
}

export default function QRScanner() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    if (!permission) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Đang tải...</Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <Text className="text-white mb-4">Cần cấp quyền camera</Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-blue-600 px-6 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Cấp quyền</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1">
                <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={
                        scanned
                            ? undefined
                            : async ({ data }: { data: string }) => {
                                  setScanned(true);
                                  console.log("QR Data:", data);

                                  const parsed = parseScannedQrData(data);

                                  // 🟢 1. LUÔN check FRIEND trước
                                  try {
                                      const res =
                                          await friendApi.getUserByQrToken(
                                              parsed.qrToken || data,
                                          );
                                      const userData = res?.data || res;

                                      router.push({
                                          pathname:
                                              "/contact/friend/new" as any,
                                          params: {
                                              id: userData?.id,
                                              name:
                                                  userData?.userName ||
                                                  userData?.username ||
                                                  userData?.name,
                                              avatar:
                                                  userData?.avatarUrl ||
                                                  userData?.avatar,
                                              cover:
                                                  userData?.backgroundUrl ||
                                                  userData?.background,
                                              qrToken: parsed.qrToken || data,
                                          },
                                      });
                                      return;
                                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                  } catch (err) {
                                      // ❌ không phải friend
                                  }

                                  // 🔵 2. CHỈ login khi chắc chắn là challengeId hợp lệ
                                  if (parsed.type === "login") {
                                      try {
                                          // Trạng thái 2: Xác nhận Đã quét (Exchange)
                                          const exchangeRes =
                                              await authenticationApi.qrExchange(
                                                  parsed.challengeId,
                                              );

                                          // Bóc tách thông tin thiết bị (nếu Server có trả về trong response)
                                          const deviceStr = [
                                              exchangeRes?.browser ||
                                                  exchangeRes?.clientInfo
                                                      ?.browser,
                                              exchangeRes?.os ||
                                                  exchangeRes?.platform ||
                                                  exchangeRes?.clientInfo?.os,
                                              exchangeRes?.deviceName ||
                                                  exchangeRes?.device,
                                          ]
                                              .filter(Boolean)
                                              .join(" - ");

                                          const deviceDisplay = deviceStr
                                              ? `thiết bị: ${deviceStr}`
                                              : "một thiết bị khác";

                                          // Trạng thái 3: Hiển thị UI Ủy quyền trên Mobile
                                          Alert.alert(
                                              "Xác nhận đăng nhập",
                                              `Bạn đang yêu cầu đăng nhập Dialo trên ${deviceDisplay}. Có phải là bạn không?`,
                                              [
                                                  {
                                                      text: "Từ chối",
                                                      style: "cancel",
                                                      onPress: () =>
                                                          setScanned(false),
                                                  },
                                                  {
                                                      text: "Đăng nhập",
                                                      onPress: async () => {
                                                          try {
                                                              // Trạng thái 4: Chốt Ủy quyền (Approve)
                                                              await authenticationApi.qrApprove(
                                                                  parsed.challengeId,
                                                              );

                                                              if (
                                                                  Platform.OS ===
                                                                  "android"
                                                              ) {
                                                                  ToastAndroid.show(
                                                                      "Đăng nhập thành công",
                                                                      ToastAndroid.SHORT,
                                                                  );
                                                              } else {
                                                                  alert(
                                                                      "Đăng nhập thành công",
                                                                  );
                                                              }
                                                              router.back();
                                                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                          } catch (err) {
                                                              alert(
                                                                  "Ủy quyền thất bại. Vui lòng thử lại.",
                                                              );
                                                              setScanned(false);
                                                          }
                                                      },
                                                  },
                                              ],
                                              { cancelable: false },
                                          );
                                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                      } catch (err) {
                                          alert(
                                              "Mã QR đã hết hạn hoặc không hợp lệ",
                                          );
                                          setScanned(false);
                                      }
                                      return;
                                  }

                                  // 🔴 3. Không phải gì cả
                                  alert("QR không hợp lệ");
                                  setScanned(false);
                              }
                    }
                />

                <QRFrameOverlay />

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg z-10"
                >
                    <Text className="text-white font-semibold">✕ Đóng</Text>
                </TouchableOpacity>

                {scanned && (
                    <TouchableOpacity
                        onPress={() => setScanned(false)}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-3 rounded-lg z-10"
                    >
                        <Text className="text-white font-semibold">
                            Quét lại
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
