// api/auth/storage.ts - Platform-aware storage (works on web and native)
import { Platform } from "react-native";

type SecureStoreModule = typeof import("expo-secure-store");

let secureStorePromise: Promise<SecureStoreModule | null> | null = null;

const loadSecureStore = async (): Promise<SecureStoreModule | null> => {
    if (Platform.OS === "web") {
        return null;
    }

    if (!secureStorePromise) {
        secureStorePromise = import("expo-secure-store").catch((error) => {
            console.warn(
                "SecureStore not available, using localStorage fallback",
                error,
            );
            return null;
        });
    }

    return secureStorePromise;
};

// Platform-specific storage implementation
const storage = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === "web") {
                // Use localStorage on web
                if (typeof window !== "undefined" && window.localStorage) {
                    window.localStorage.setItem(key, value);
                }
            } else {
                const secureStore = await loadSecureStore();
                if (secureStore?.setItemAsync) {
                    // Use SecureStore on native
                    await secureStore.setItemAsync(key, value);
                }
            }
        } catch (error) {
            console.error(`[Storage] Error setting ${key}:`, error);
            throw error;
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === "web") {
                // Use localStorage on web
                if (typeof window !== "undefined" && window.localStorage) {
                    return window.localStorage.getItem(key) || null;
                }
                return null;
            } else {
                const secureStore = await loadSecureStore();
                if (secureStore?.getItemAsync) {
                    // Use SecureStore on native
                    return await secureStore.getItemAsync(key);
                }
            }
            return null;
        } catch (error) {
            console.error(`[Storage] Error getting ${key}:`, error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === "web") {
                // Use localStorage on web
                if (typeof window !== "undefined" && window.localStorage) {
                    window.localStorage.removeItem(key);
                }
            } else {
                const secureStore = await loadSecureStore();
                if (secureStore?.deleteItemAsync) {
                    // Use SecureStore on native
                    await secureStore.deleteItemAsync(key);
                }
            }
        } catch (error) {
            console.error(`[Storage] Error removing ${key}:`, error);
            throw error;
        }
    },

    async clear(): Promise<void> {
        try {
            if (Platform.OS === "web") {
                // Clear localStorage on web
                if (typeof window !== "undefined" && window.localStorage) {
                    window.localStorage.clear();
                }
            }
        } catch (error) {
            console.error("[Storage] Error clearing storage:", error);
            throw error;
        }
    },
};

export default storage;
