import {CardData} from "@/types/game";

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

export function convertServerCardToUICard(serverCard: CardData): CardData {
    return {
        id: serverCard.id,
        suit: convertSuitToSymbol(serverCard.suit),
        rank: serverCard.rank ?? "?",
        value: serverCard.value ?? 0,
    };
}

export function convertServerCardsToUICards(serverCards: readonly CardData[] = []): CardData[] {
    return serverCards.map(convertServerCardToUICard);
}
