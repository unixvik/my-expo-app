// src/types/game.ts

export type FlightType = "discard" | "draw";

export interface FaceCard {
    id: string;
    suit: string;
    rank: string;
    value: number;
}

export interface HandCard extends FaceCard {
    [key: string]: unknown;
}

export interface Flight {
    origin: DOMRect;
    target: { x: number; y: number };
    id: string;
    card: HandCard;
    type: FlightType;
    rotate?: number;
}

export interface Opponent {
    id: string;
    name: string;
    cardCount: number;

    // Optional because we usually don't know opponents' cards until reveal
    cards?: HandCard[];
    handValue?: number;

    // --- Bot metadata ---
    isBot?: boolean;

    botTargetRank?: string;
    botTargetTTL?: number;

    botLastDecision?: string;
    botLastAction?: "claim" | "discard" | "draw";

    botLastFromDiscard?: boolean;
    botThinkMs?: number;
    botTurnSeq?: number;
}
