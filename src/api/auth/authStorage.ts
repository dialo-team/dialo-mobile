// api/auth/authStorage.ts
import * as SecureStore from "expo-secure-store";

export const saveAuthData = async (
    accessToken: string,
    refreshToken: string,
) => {
    try {
        await SecureStore.setItemAsync("accessToken", accessToken);
        await SecureStore.setItemAsync("refreshToken", refreshToken);
        // Xoá dòng lưu userId đi
    } catch (error) {
        console.error("Lỗi lưu SecureStore:", error);
    }
};

export const getAccessToken = () => SecureStore.getItemAsync("accessToken");
export const getRefreshToken = () => SecureStore.getItemAsync("refreshToken");

export const clearAuthData = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
};
