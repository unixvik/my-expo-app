import { useGameStore } from './useGameStore';
import type { PlayerData } from '@/types/game';

/**
 * 🌟 Selector to get the current player's data safely
 */
export const useSelf = (): PlayerData | null => {
    return useGameStore((s) => {
        const myId = s.conn.status === 'connected' ? s.conn.sessionId : null;
        if (!myId) return null;
        return s.server.players[myId] || null;
    });
};

/**
 * 🌟 Selector for the mandatory draw flag
 */
export const useAwaitingDraw = (): boolean => {
    return useGameStore((s) => {
        const myId = s.conn.status === 'connected' ? s.conn.sessionId : null;
        if (!myId) return false;
        return s.server.players[myId]?.awaitingMandatoryDraw ?? false;
    });
};