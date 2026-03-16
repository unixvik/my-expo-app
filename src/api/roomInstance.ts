import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "@/colyseus/state";

export let globalRoom: Room<ClaimRoomState> | null = null;

export const setGlobalRoom = (room: Room<ClaimRoomState> | null) => {
    globalRoom = room;
};