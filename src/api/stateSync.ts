import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "@/colyseus/state"; // Your auto-generated file
import { useGameStore } from "@/state/useGameStore";
import type { ClaimServerState } from "@/types/game";   // The pure TS file

export const attachStateSync = (room: Room<ClaimRoomState>) => {
    room.onStateChange((state) => {
        // 🌟 .toJSON() recursively strips all Schema, MapSchema, and ArraySchema proxies
        // We then cast it to our pure interface so Zustand knows exactly what it is.
        const cleanState = state.toJSON() as unknown as ClaimServerState;

        // Now it is perfectly safe for Immer to draft!
        useGameStore.getState().syncServerState(cleanState);
    });
};