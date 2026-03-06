import { Client } from "@colyseus/sdk";

// In Expo/Metro, we use process.env instead of import.meta.env
export const ENDPOINT =
    process.env.EXPO_PUBLIC_COLYSEUS_ENDPOINT ?? "ws://192.168.2.56:2567";

export const client = new Client(ENDPOINT);