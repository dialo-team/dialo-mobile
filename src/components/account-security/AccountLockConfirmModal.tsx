import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type AccountLockConfirmModalProps = {
    visible: boolean;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function AccountLockConfirmModal({
    visible,
    loading = false,
    onClose,
    onConfirm,
}: AccountLockConfirmModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 items-center justify-center bg-black/35 px-6">
                <View className="w-full rounded-2xl bg-white p-5">
                    <Text className="text-center text-lg font-semibold text-black">
                        Khóa tài khoản
                    </Text>
                    <Text className="mt-2 text-center text-gray-500">
                        Bạn có chắc muốn khóa tài khoản trên thiết bị này không?
                    </Text>

                    <View className="mt-5 flex-row">
                        <TouchableOpacity
                            className="mr-2 flex-1 items-center rounded-full bg-gray-100 py-3"
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text className="font-medium text-gray-700">
                                Hủy
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="ml-2 flex-1 items-center rounded-full bg-red-500 py-3"
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            <Text className="font-medium text-white">
                                {loading ? "Đang xử lý..." : "Khóa"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
