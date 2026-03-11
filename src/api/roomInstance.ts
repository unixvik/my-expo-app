import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "@/colyseus/state";

// The globally accessible room instance
export let globalRoom: Room<ClaimRoomState> | null = null;

// Setter function to update the global room from your connection hook
export const setGlobalRoom = (room: Room<ClaimRoomState> | null) => {
    globalRoom = room;
};