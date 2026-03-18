// src/api/messageQueue.ts
import type {Room} from "@colyseus/sdk";
import {Mutex} from "async-mutex";
import type {ClaimRoomState} from "@/colyseus/state";
import {useGameStore} from "@/state/useGameStore";
import {useVisualStore} from "@/state/useVisualStore";
import {spawnDiscardFlight} from "@/utils/spawnDiscardFlight";
import {measureOpponent} from "@/utils/opponentRefs";

// The single, global lock that ensures physical animations play sequentially
const animationLock = new Mutex();




/**
 * Attaches message listeners wrapped in a Mutex queue.
 */
export const attachMessageQueue = (room: Room<ClaimRoomState>) => {

    // --- DISCARD ---
    room.onMessage("playerDiscarded", (message: { playerId: string; cardIds: string[] }) => {
        const {playerId, cardIds} = message;

        const myId = useGameStore.getState().playerKey;

        // Server may send CardData objects instead of plain string IDs — normalize to strings
        const normalizeId = (id: any): string => typeof id === 'string' ? id : id?.id ?? String(id);
        const normalizedCardIds = cardIds.map(normalizeId);

        // For my own discard: DiscardButton already spawned the flight and set discardedCards.
        if (playerId === myId) return;

        const discardLayout = useVisualStore.getState()?.layouts.discard;
        if (!discardLayout) {
            console.warn("Discard layout not ready for flight animation");
            return;
        }
        // console.log(normalizedCardIds);
        // Mirror discardCards() local state — snapshot top of pile, set fanned cards
        useGameStore.setState((s) => {
            const pile = s.server.discardPile;
            return {
                local: {
                    ...s.local,
                    heldTopDiscard: pile.length > 0 ? pile[pile.length - 1] : null,
                    discardedCards: normalizedCardIds,
                },
            };
        });

        // Spawn face-down flight from opponent avatar → discard pile
        measureOpponent(playerId, (avatarLayout) => {
            const hand = useGameStore.getState().server.players[playerId]?.hand;
            if (!hand) return;

            const handPositions = Object.fromEntries(normalizedCardIds.map(id => [id, avatarLayout]));

            spawnDiscardFlight({
                selectedDiscardIds: normalizedCardIds,
                hand,
                handPositions,
                discardLayout,
                spawnFlyingCard: useVisualStore.getState().spawnFlyingCard,
                isFacedown: false,
            });
        });
    });

    // --- DRAW ---
    // Mirrors CARD_DRAWN (player draw) but for opponents: face-down card flies
    // from deck or discard pile to the opponent's avatar.
    room.onMessage("playerDrew", (message: { playerId: string; fromDiscard: boolean; cardId?: string }) => {
        const {playerId, fromDiscard, cardId} = message;

        // console.log("playerId", playerId, "drew. FROM DISCARD? - ", fromDiscard, " cardID: ", cardId);
        // const myId = useGameStore.getState().playerKey;
        // if (playerId === myId) return; // player's own draw is handled by CARD_DRAWN
        //
        const layouts = useVisualStore.getState().layouts;
        const sourceLayout = fromDiscard ? layouts.discard : layouts.deck;
        //
        if (!sourceLayout) {
            console.warn("Source layout not ready for opponent draw animation");
            return;
        }
        //
        const sourceX = sourceLayout.x + sourceLayout.width / 2;
        const sourceY = sourceLayout.y + sourceLayout.height / 2;
        //

        useVisualStore.getState().triggerFanUp().then(() => {
            useGameStore.setState((state: any) => {
                state.local.discardedCards = [];
                state.local.heldTopDiscard = null;
            });
        });


        //
        measureOpponent(playerId, (avatarLayout) => {
            const flyId = `opponent-draw-${playerId}-${Date.now()}`;

            // const card = drawnCard ? parseStringCardToUI(cardId) : [];
            // console.log("drawnCard", cardId);
            useVisualStore.getState().spawnFlyingCard({
                id: flyId,
                card: cardId,
                startX: sourceX,
                startY: sourceY,
                endX: avatarLayout.x + avatarLayout.width / 2,
                endY: avatarLayout.y + avatarLayout.height / 2,
                isFacedown: !fromDiscard,
                type: 'draw',
            });

            setTimeout(() => {
                useVisualStore.getState().removeFlyingCard(flyId);
            }, 700);
        });
    });

    // Add SWAP, PEEK, and other Claim actions here following the same pattern
};
