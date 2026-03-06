// src/hooks/useClaimRoom/types.ts
import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "../colyseus/state";

export interface PlayerJoinEvent {
    type: 'join' | 'leave' | 'discard';
    sessionId: string;
    name: string;
    timestamp: number;
}

export interface PlayerData {
    name: string;
    ready: boolean;
    connected: boolean;
}

export interface GameEndData {
    winner: string;
    finalScores: Record<string, number>;
}

export interface UseClaimRoomReturn {
    // Connection
    connected: boolean;
    error: string | null;
    room: Room<ClaimRoomState> | null;
    sessionId: string | null;

    // State
    players: Record<string, PlayerData>;
    gameStatus: string;
    countdown: number;
    gameState: ClaimRoomState | null;
    gameEndData: GameEndData | null;

    // UI
    playerJoinEvents: PlayerJoinEvent[];

    // Actions
    setReady: () => void;
    startGame: () => void;
    discardCards: (cardIds: string[]) => void;
    drawCard: (fromDiscard: boolean) => void;
    shoutClaim: () => void;
    kickPlayer: (sessionId: string) => void;
    resetRoom: () => void;
    rematch: () => void;
}

