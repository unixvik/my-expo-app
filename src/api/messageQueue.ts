// src/api/messageQueue.ts
import type { Room } from "@colyseus/sdk";
import { Mutex } from "async-mutex";
import type { ClaimRoomState } from "@/colyseus/state";
import { useGameStore } from "@/state/useGameStore";

// The single, global lock that ensures physical animations play sequentially
const animationLock = new Mutex();

/**
 * Attaches message listeners wrapped in a Mutex queue.
 */
export const attachMessageQueue = (room: Room<ClaimRoomState>) => {

    room.onMessage("CARD_DRAWN", async (message) => {
        await animationLock.runExclusive(async () => {
            // 1. Tell the Card Portal to spawn a Ghost Card and fly it
            await useGameStore.getState().triggerFlight({
                cardId: message.cardId,
                from: message.sourceAnchor, // e.g., 'deck'
                to: message.destAnchor      // e.g., 'hand_slot_3'
            });

            // 2. Only after the flight finishes, commit the change to the Visual Store
            useGameStore.getState().commitVisualState('DRAW', message.cardId);
        });
    });

    room.onMessage("CARD_DISCARDED", async (message) => {
        await animationLock.runExclusive(async () => {
            // 1. Trigger flight to the 3D tilted discard pile
            await useGameStore.getState().triggerFlight({
                cardId: message.cardId,
                from: message.sourceAnchor,
                to: "discard_pile"
            });

            // 2. Commit the change so the UI updates
            useGameStore.getState().commitVisualState('DISCARD', message.cardId);
        });
    });

    // Add SWAP, PEEK, and other Claim actions here following the same pattern
};