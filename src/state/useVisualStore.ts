import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CardData } from "@/types/game";

interface VisualStore {
    // The cards physically visible in the player's hand on screen
    visualHand: CardData[];

    // Ghost cards are temporary clones used strictly for flying animations
    flyingCards: { id: string; card: CardData; startX: number; startY: number; endX: number; endY: number }[];

    // --- Actions ---
    syncInitialHand: (serverHand: CardData[]) => void;
    addCardToVisualHand: (card: CardData) => void;
    removeCardFromVisualHand: (cardId: string) => void;

    spawnFlyingCard: (ghost: any) => void;
    removeFlyingCard: (id: string) => void;
}

export const useVisualStore = create<VisualStore>()(
    immer((set) => ({
        visualHand: [],
        flyingCards: [],

        // Called once when joining the room to set up the initial board
        syncInitialHand: (serverHand) => set((state) => {
            state.visualHand = serverHand;
        }),

        // Called ONLY after an animation finishes
        addCardToVisualHand: (card) => set((state) => {
            state.visualHand.push(card);
        }),

        // Called the millisecond a player plays a card
        removeCardFromVisualHand: (cardId) => set((state) => {
            const index = state.visualHand.findIndex(c => c.id === cardId);
            if (index > -1) state.visualHand.splice(index, 1);
        }),

        spawnFlyingCard: (ghost) => set((state) => {
            state.flyingCards.push(ghost);
        }),

        removeFlyingCard: (id) => set((state) => {
            state.flyingCards = state.flyingCards.filter(c => c.id !== id);
        }),


    }))
);