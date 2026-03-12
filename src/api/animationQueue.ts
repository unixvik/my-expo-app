import { Mutex } from 'async-mutex';
import { useVisualStore } from '@/state/useVisualStore';
import type { Room } from 'colyseus.js';

// The global lock. Only one animation can hold this lock at a time.
const animationLock = new Mutex();

// A helper to pause JS execution (sleep)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const attachAnimationQueue = (room: Room) => {

    room.onMessage("CARD_DRAWN", async (message) => {
        // 1. Wait in line until previous animations finish
        await animationLock.runExclusive(async () => {
            const { cardData, sourceX, sourceY } = message;

            // 2. Spawn a Ghost Card on top of the deck
            useVisualStore.getState().spawnFlyingCard({
                id: `ghost-${cardData.id}`,
                card: cardData,
                startX: sourceX, // Usually the absolute coordinates of your 3D deck
                startY: sourceY,
                target: 'hand',
            });

            // 3. Wait for the flight animation duration (e.g., 600ms)
            await delay(600);

            // 4. Destroy the Ghost Card
            useVisualStore.getState().removeFlyingCard(`ghost-${cardData.id}`);

            // 5. Commit the real card to the visual hand
            // (This triggers your Reactive Engine, and the fan recalculates!)
            useVisualStore.getState().addCardToVisualHand(cardData);

            // 6. Optional: Add a tiny buffer between multiple draws
            await delay(100);
        });
    });

    // You will add "CARD_PLAYED", "CLAIM_TRIGGERED", etc. here.
};