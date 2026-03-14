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

/**
 * Parses a server-side string identifier into a UICard.
 * Format expected: "suit-rank-id" (e.g., "hearts-5-0")
 * Handles both the raw string or an array containing the string.
 */
export function parseStringCardsToUI(cardStrings: string[]): CardData[] {
    if (!cardStrings || !Array.isArray(cardStrings)) return [];

    return cardStrings.map(cardStr => parseStringCardToUI(cardStr));
}
export function parseStringCardToUI(cardInput: string | string[]): CardData {
    // 1. Handle array input if necessary
    const rawString = Array.isArray(cardInput) ? cardInput[0] : cardInput;

    if (!rawString || typeof rawString !== 'string') {
        return { suit: '?', rank: '?', value: 0, id: 'unknown' };
    }

    // 2. Split the string (hearts-5-0 -> ["hearts", "5", "0"])
    const [suit, rank, id] = rawString.split('-');

    // 3. Return the mapped object using your existing conversion logic
    return {
        id: id || `gen-${Math.random().toString(36).substr(2, 9)}`,
        suit: convertSuitToSymbol(suit),
        rank: rank || "?",
        // Logic for value: you can parse rank to int, or default to 0 if not provided in string
        value: !isNaN(parseInt(rank)) ? parseInt(rank) : 0,
    };


}