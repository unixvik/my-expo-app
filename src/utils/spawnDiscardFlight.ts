import {convertServerCardToUICard, parseStringCardToUI} from '@/utils/suitHelper';
import {DISCARD_OFFSET} from "@/state/constants";

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
// console.log(isFacedown);
    selectedDiscardIds.forEach(cardId => {
        const pos = handPositions[cardId];
        // console.log(cardId);
        if (pos) {
            spawnFlyingCard({
                id: `${cardId}_fly`,
                card: cardId,
                startX: pos.x,
                startY: pos.y,
                endX,
                endY,
                isFacedown,
                type: 'discard',
            });
        }
    });
}
