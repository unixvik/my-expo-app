// src/api/messageQueue.ts
import type {Room} from "@colyseus/sdk";
import {Mutex} from "async-mutex";
import type {ClaimRoomState} from "@/colyseus/state";
import {useGameStore} from "@/state/useGameStore";
import {useVisualStore} from "@/state/useVisualStore";
import {spawnDiscardFlight} from "@/utils/spawnDiscardFlight";

// The single, global lock that ensures physical animations play sequentially
const animationLock = new Mutex();

export interface MessageQueue {
    playerId: string;
    cardIds: string[];
}

/**
 * Attaches message listeners wrapped in a Mutex queue.
 */
export const attachMessageQueue = (room: Room<ClaimRoomState>) => {
    room.onMessage("playerDiscarded", async (message: { playerId: string; cardIds: string[] }) => {
        const { playerId, cardIds } = message;

        // Get layouts
        const discardLayout = useVisualStore.getState()?.layouts.discard;
        const myId = useGameStore.getState().playerKey;
        console.log("My id: ",myId);

        if (!discardLayout) {
            console.warn("Discard layout not ready for flight animation");
            return;
        }

        // Determine which hand positions to use
        const isMe = playerId === myId;
        const handPositions = isMe
            ? useVisualStore.getState().layouts.player
            : useVisualStore.getState().layouts.opponents[playerId];
//
        console.log("Spoawwwwwwn from", useVisualStore.getState().layouts.opponents);
        if (!handPositions) {
            console.warn("Hand positions not ready for flight animation");
            return;
        }

        // Get the hand from game state to pass card data
        const hand = isMe
            ? useGameStore.getState().server.players[myId]?.hand
            : useGameStore.getState().server.players[playerId]?.hand;

        if (!hand) {
            console.warn("Hand not found for player", playerId);
            return;
        }
;
        // Spawn flight for each card
        spawnDiscardFlight({
            selectedDiscardIds: cardIds,
            hand,
            handPositions: handPositions,
            discardLayout,
            spawnFlyingCard: useVisualStore.getState().spawnFlyingCard
        });
    });

    // Add SWAP, PEEK, and other Claim actions here following the same pattern
};