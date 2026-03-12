// 🌟 Pure TypeScript types for Zustand/Immer (No Colyseus dependencies)

export interface CardData {
    suit: string;
    rank: string;
    value: number;
    id: string;
}

export interface PlayerData {
    id: string;
    sessionId: string;
    connected: boolean;
    name: string;
    ready: boolean;
    awaitingMandatoryDraw: boolean;
    hand: CardData[];
    handValue: number;
    stagedDiscardIds: string[];
    toDiscardCard: CardData[];
    totalPoints?: number;
    lastDiscardBatchId?: string;
    isHost: boolean;
    isBot: boolean;
    botTargetRank: string;
    botTargetTTL: number;
    botLastDecision: string;
    botLastAction: string;
    botLastFromDiscard: boolean;
    botThinkMs: number;
    botTurnSeq: number;
}

export interface ClaimServerState {
    players: Record<string, PlayerData>;
    cardsRemaining: number;
    cardsDiscarded: number;
    gameStatus: string;
    minPlayers: number;
    countdown: number;
    round: number;
    claimRoundOpen: number;
    currentTurn: string;
    atuRank: string;
    topDiscardCard?: CardData;
    discardPile: CardData[];
    atuCard: CardData[];
    turnOrder: string[];
    currentTurnIndex: number;
    roundStarterIndex: number;
}