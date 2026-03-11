// src/utils/playerKey.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PLAYER_KEY_STORAGE = "claim_player_uuid";

/**
 * Generates a simple, random 9-character string
 */
const generateSimpleId = () => {
    return `player_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Fetches the persistent unique ID for this device.
 * Works flawlessly across iOS, Android, and Web Emulators.
 */
export async function getOrCreatePlayerKey(): Promise<string> {
    try {
        let key: string | null = null;

        // 1. If testing on Web, use standard browser localStorage
        if (Platform.OS === 'web') {
            key = localStorage.getItem(PLAYER_KEY_STORAGE);
            if (!key) {
                key = generateSimpleId();
                localStorage.setItem(PLAYER_KEY_STORAGE, key);
            }
            return key;
        }

        // 2. If on iOS/Android, use SecureStore
        key = await SecureStore.getItemAsync(PLAYER_KEY_STORAGE);

        if (!key) {
            key = generateSimpleId();
            await SecureStore.setItemAsync(PLAYER_KEY_STORAGE, key);
        }

        return key;

    } catch (error) {
        console.warn("Storage failed, using temporary session key:", error);
        // Absolute fallback: Just generate a new one for this session
        return generateSimpleId();
    }

}
const PLAYER_NAME_STORAGE = "claim_player_name";

export async function getStoredName(): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(PLAYER_NAME_STORAGE);
    return await SecureStore.getItemAsync(PLAYER_NAME_STORAGE);
}

export async function saveStoredName(name: string): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.setItem(PLAYER_NAME_STORAGE, name);
    } else {
        await SecureStore.setItemAsync(PLAYER_NAME_STORAGE, name);
    }
}