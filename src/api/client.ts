import { Client } from '@colyseus/sdk';
import { Platform } from 'react-native';

/**
 * Determine the correct WebSocket endpoint based on the environment.
 */
const getEndpoint = (): string => {
    // 1. Production / Staging Environment
    if (process.env.EXPO_PUBLIC_GAME_SERVER_URL) {
        return process.env.EXPO_PUBLIC_GAME_SERVER_URL;
    }

    // 2. Local Development (React Native specific mapping)
    // If testing on a physical device, replace this with your computer's local IP (e.g., 'ws://192.168.1.15:2567')
    const port = 2567;

    if (Platform.OS === 'android') {
        // Android Emulator loopback IP
        return `ws://10.0.2.2:${port}`;
    }

    // iOS Simulator or Web
    return `ws://192.168.2.67:${port}`;
};

export const ENDPOINT = getEndpoint();

// Export the single, global client instance
export const client = new Client(ENDPOINT);