// api/auth/authStorage.ts
import storage from "./storage";

export const saveAuthData = async (
    accessToken: string,
    refreshToken: string,
) => {
    try {
        console.log("[AuthStorage] Saving auth data");
        await storage.setItem("accessToken", accessToken);
        await storage.setItem("refreshToken", refreshToken);
        console.log("[AuthStorage] Auth data saved successfully");
    } catch (error) {
        console.error("[AuthStorage] Error saving auth data:", error);
        throw error;
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    try {
        const token = await storage.getItem("accessToken");
        console.log(
            "[AuthStorage] Access token retrieved:",
            token ? "exists" : "null",
        );
        return token;
    } catch (error) {
        console.error("[AuthStorage] Error getting access token:", error);
        return null;
    }
};

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        const token = await storage.getItem("refreshToken");
        console.log(
            "[AuthStorage] Refresh token retrieved:",
            token ? "exists" : "null",
        );
        return token;
    } catch (error) {
        console.error("[AuthStorage] Error getting refresh token:", error);
        return null;
    }
};

export const clearAuthData = async () => {
    try {
        console.log("[AuthStorage] Clearing auth data");
        await storage.removeItem("accessToken");
        await storage.removeItem("refreshToken");
        console.log("[AuthStorage] Auth data cleared");
    } catch (error) {
        console.error("[AuthStorage] Error clearing auth data:", error);
    }
};
