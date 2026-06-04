// api/auth/authStorage.ts
import storage from "./storage";

export const saveAuthData = async (
    accessToken: string,
    refreshToken: string,
) => {
    try {
        await storage.setItem("accessToken", accessToken);
        await storage.setItem("refreshToken", refreshToken);
    } catch (error) {
        throw error;
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    try {
        const token = await storage.getItem("accessToken");
        return token;
    } catch (error) {
        console.error("[AuthStorage] Error getting access token:", error);
        return null;
    }
};

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        const token = await storage.getItem("refreshToken");
        return token;
    } catch (error) {
        console.error("[AuthStorage] Error getting refresh token:", error);
        return null;
    }
};

export const clearAuthData = async () => {
    try {
        await storage.removeItem("accessToken");
        await storage.removeItem("refreshToken");
        await storage.removeItem("loginPhone");
    } catch (error) {
        throw error;
    }
};

export const savePhone = async (phone: string) => {
    try {
        await storage.setItem("loginPhone", phone);
    } catch (error) {
        throw error;
    }
};

export const getPhone = async (): Promise<string | null> => {
    try {
        return await storage.getItem("loginPhone");
    } catch (error) {
        return null;
    }
};
