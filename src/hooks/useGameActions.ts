// hooks/useGameActions.ts
import { useGameStore } from "@/state/useGameStore";

export const useGameActions = () => {
    // Extragem funcțiile direct din store
    // Acestea au referință stabilă, deci nu provoacă re-render
    const toggleCardSelection = useGameStore((s) => s.toggleCardSelection);
    const discardCards = useGameStore((s) => s.discardCards);
    const clearSelection = useGameStore((s) => s.clearSelection);
    const claimGame = useGameStore((s) => s.claimGame);
    const drawCards = useGameStore((s) => s.drawCards);

    return {
        toggleCardSelection,
        discardCards,
        clearSelection,
        claimGame,
        drawCards
    };
};
