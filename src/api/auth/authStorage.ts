import * as SecureStore from "expo-secure-store";

export const saveAuthTokens = async (
    accessToken: string,
    refreshToken: string,
) => {
    try {
        await SecureStore.setItemAsync("accessToken", accessToken);
        await SecureStore.setItemAsync("refreshToken", refreshToken);
        console.log("Đã lưu token an toàn!");
    } catch (error) {
        console.error("Lỗi khi lưu token:", error);
    }
};

export const getAccessToken = async () => {
    return await SecureStore.getItemAsync("accessToken");
};

export const getRefreshToken = async () => {
    return await SecureStore.getItemAsync("refreshToken");
};

export const clearAuthTokens = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
};
