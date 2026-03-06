// src/utils/playerKey.ts
import { Platform } from "react-native";

const STORAGE_KEY = "claim:v1:playerKey";

let cached: string | null = null;
let inflight: Promise<string> | null = null;

function genKey() {
    return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export async function getOrCreatePlayerKey(): Promise<string> {
    if (cached) return cached;
    if (inflight) return inflight;

    inflight = (async () => {
        // Web
        if (Platform.OS === "web") {
            const k = window?.localStorage?.getItem(STORAGE_KEY);
            if (k) return (cached = k);

            const nk = genKey();
            window?.localStorage?.setItem(STORAGE_KEY, nk);
            return (cached = nk);
        }

        // Native
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const k = await AsyncStorage.getItem(STORAGE_KEY);
        if (k) return (cached = k);

        const nk = genKey();
        await AsyncStorage.setItem(STORAGE_KEY, nk);
        return (cached = nk);
    })();

    try {
        return await inflight;
    } finally {
        inflight = null;
    }
}