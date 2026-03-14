import { Platform } from 'react-native';
import { convertServerCardToUICard } from '@/utils/suitHelper';
import {useGameStore} from "@/state/useGameStore";
import {DISCARD_OFFSET} from "@/state/constants";

export function spawnDiscardFlight({
    selectedDiscardIds,
    hand,
    handPositions,
    discardLayout,
    spawnFlyingCard,
}: {
    selectedDiscardIds: string[];
    hand: any[];
    handPositions: Record<string, { x: number; y: number }>;
    discardLayout: { x: number; y: number; width: number; height: number };
    spawnFlyingCard: (ghost: any) => void;
}) {
    if (Platform.OS !== 'web') return;

    const endX = discardLayout.x + (discardLayout.width / 2) + DISCARD_OFFSET.x;
    const endY = discardLayout.y + (discardLayout.height / 2) + DISCARD_OFFSET.y;


    selectedDiscardIds.forEach(cardId => {
        const pos = handPositions[cardId];
        const rawCard = hand.find(c => c.id === cardId);

        if (pos && rawCard) {
            spawnFlyingCard({
                id: `${cardId}_fly`,
                card: convertServerCardToUICard(rawCard),
                startX: pos.x,
                startY: pos.y,
                endX,
                endY,
            });
        }
    });
}
