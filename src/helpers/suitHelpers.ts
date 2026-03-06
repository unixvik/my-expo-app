// src/helpers/suitHelpers.ts
import type { HandCard } from "@/types/game";

export type ServerCard = {
    id: string;
    suit: string;              // "hearts" | "♦" | etc
    rank: string | number;     // server may send number
    value: number;
};

export const SUIT_MAP: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
    heart: "♥",
    diamond: "♦",
    club: "♣",
    spade: "♠",
    "♥": "♥",
    "♦": "♦",
    "♣": "♣",
    "♠": "♠",
};

export function convertSuitToSymbol(suitName: string): string {
    if (!suitName) return "?";
    const normalized = suitName.toLowerCase().trim();
    return SUIT_MAP[normalized] || suitName;
}

export function convertServerCardToUICard(serverCard: ServerCard): HandCard {
    return {
        id: serverCard.id,
        suit: convertSuitToSymbol(serverCard.suit),
        rank: serverCard.rank ?? "?",
        value: serverCard.value ?? 0,
    };
}

export function convertServerCardsToUICards(serverCards: readonly ServerCard[] = []): HandCard[] {
    return serverCards.map(convertServerCardToUICard);
}
