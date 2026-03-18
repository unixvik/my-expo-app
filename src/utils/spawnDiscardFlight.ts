import {convertServerCardToUICard, parseStringCardToUI} from '@/utils/suitHelper';
import {DISCARD_OFFSET} from "@/state/constants";
import {useVisualStore} from "@/state/useVisualStore";

export function spawnDiscardFlight({
                                       selectedDiscardIds,
                                       hand,
                                       handPositions,
                                       discardLayout,
                                       spawnFlyingCard,
                                       isFacedown = false,
                                   }: {
    selectedDiscardIds: string[];
    hand: any[];
    handPositions: Record<string, { x: number; y: number }>;
    discardLayout: { x: number; y: number; width: number; height: number };
    spawnFlyingCard: (ghost: any) => void;
    isFacedown?: boolean;
}) {
    const endX = discardLayout.x + (discardLayout.width / 2) + DISCARD_OFFSET.x;
    const endY = discardLayout.y + (discardLayout.height / 2) + DISCARD_OFFSET.y;

    // ✅ Get current discard pile count to calculate final fan indices
    const currentDiscardCount =selectedDiscardIds.length || 0;

    selectedDiscardIds.forEach((cardId, localIndex) => {
        const pos = handPositions[cardId];

        if (pos) {
            // ✅ Calculate the final index this card will have in the fan
            const finalFanIndex = currentDiscardCount + localIndex;

            spawnFlyingCard({
                id: `${cardId}_fly`,
                card: cardId,
                startX: pos.x,
                startY: pos.y,
                endX,
                endY,
                isFacedown,
                type: 'discard',
                fanIndex: finalFanIndex, // ✅ Add fan index
            });
        }
    });
}