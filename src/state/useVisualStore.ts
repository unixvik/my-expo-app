import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import type {CardData} from "@/types/game";

type ElementLayout = {
    x: number;
    y: number;
    width: number;
    height: number;
};




interface VisualStore {
    // The cards physically visible in the player's hand on screen
    visualHand: CardData[];
    isClosingFan: boolean;
    // Ghost cards are temporary clones used strictly for flying animations
    flyingCards: { id: string; card: CardData; startX: number; startY: number; endX: number; endY: number }[];

    // Anchors
    layouts: {
        deck: ElementLayout | null;
        discard: ElementLayout | null;
        opponents: Record<string, ElementLayout>;
        player: Record<string, ElementLayout>;
    },


    // --- Actions ---

    setLayout: (type: 'deck' | 'discard' | 'opponents' | 'player', layout: ElementLayout, playerId?:string) => void;
    syncInitialHand: (serverHand: CardData[]) => void;
    addCardToVisualHand: (card: CardData) => void;
    removeCardFromVisualHand: (cardId: string) => void;

    spawnFlyingCard: (ghost: any) => void;
    removeFlyingCard: (id: string) => void;

    triggerFanUp(): void;
}

export const useVisualStore = create<VisualStore>()(
    immer((set) => ({
        visualHand: [],
        flyingCards: [],
        isClosingFan: false,

        // Layouts
        layouts: {
            deck: null,
            discard: null,
            opponents: {},
            player: {},
        },


        setLayout: (type: 'deck' | 'discard' | 'opponents'| 'player', layout: ElementLayout, key?: string) =>
            set((state) => {
                if (type === 'opponents' || type === 'player') {
                    if (key) {
                        state.layouts[type][key] = layout;
                    }
                } else {
                    // Pentru deck și discard (care nu au key)
                    state.layouts[type] = layout;
                }
            }),

        ///
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

        // The "Fan Up" Choreographer
        triggerFanUp: async () => {
            set({isClosingFan: true});

            // Wait for the animation duration (matches your FannedCardItem)
            await new Promise(resolve => setTimeout(resolve, 350));

            set({isClosingFan: false});
        }

    }))
);