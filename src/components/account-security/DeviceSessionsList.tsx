import { SessionDeviceItem } from "@/src/api/auth/types";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type DeviceSessionsListProps = {
    title: string;
    sessions: SessionDeviceItem[];
    isLoading?: boolean;
    emptyText?: string;
    actionLabel?: string;
    onActionPress?: (sessId?: string) => void | Promise<void>;
};

const formatTime = (raw?: string) => {
    if (!raw) return "-";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    return dt.toLocaleString("vi-VN");
};

export function DeviceSessionsList({
    title,
    sessions,
    isLoading = false,
    emptyText = "Không có dữ liệu",
    actionLabel,
    onActionPress,
}: DeviceSessionsListProps) {
    return (
        <View className="mx-3 mt-3 rounded-2xl bg-white p-4">
            <Text className="mb-3 text-base font-semibold text-black">
                {title}
            </Text>

            {isLoading ? (
                <View className="py-6">
                    <ActivityIndicator size="small" color="#0091FF" />
                </View>
            ) : sessions.length === 0 ? (
                <Text className="text-sm text-gray-500">{emptyText}</Text>
            ) : (
                sessions.map((item, index) => {
                    const key = item.sessId || item.id || `${title}-${index}`;
                    const deviceName =
                        item.deviceName || item.platform || "Thiết bị không rõ";
                    const subLine = item.ip || item.userAgent || "-";
                    const activeAt = formatTime(
                        item.lastActiveAt || item.createdAt,
                    );

                    return (
                        <View
                            key={key}
                            className="mb-3 rounded-xl border border-gray-200 px-3 py-2"
                        >
                            <Text className="text-[15px] font-medium text-black">
                                {deviceName}
                            </Text>
                            <Text className="mt-1 text-xs text-gray-500">
                                {subLine}
                            </Text>
                            <Text className="mt-1 text-xs text-gray-400">
                                Hoạt động: {activeAt}
                            </Text>
                            {actionLabel && onActionPress ? (
                                <TouchableOpacity
                                    className="mt-2 self-start rounded-full bg-blue-50 px-3 py-1"
                                    onPress={() =>
                                        onActionPress(item.sessId || item.id)
                                    }
                                >
                                    <Text className="text-xs font-medium text-blue-600">
                                        {actionLabel}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    );
                })
            )}
        </View>
    );
}
