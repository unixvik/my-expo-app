// src/state/useGameStore.ts

import {create, ExtractState, StoreApi} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import type {CardData, ClaimServerState, PlayerData} from "@/types/game";
import {GameTheme} from '@/theme/themeTokens';
import {Room} from "@colyseus/sdk";
import {globalRoom} from "@/api/roomInstance";
import {useVisualStore} from "@/state/useVisualStore";
import {useRoomConnection} from "@/hooks/useRoomConnection";
import {convertServerCardToUICard} from "@/utils/suitHelper";

export type ConnState =
    | { status: "idle" }
    | { status: "connecting" }
    | { status: "reconnecting"; roomId: string; sessionId: string }
    | { status: "connected"; roomId: string; sessionId: string }
    | { status: "error"; message: string };

export interface GameStore {
    // 1. Connection & Metadata


    conn: ConnState;
    isInitialStateSynced: boolean; // Vital: prevent rendering UI before data arrives
    playerKey: string;
    awaitingMandatoryDraw: boolean;
    // 2. The Raw Server Data
    server: ClaimServerState;

    // 3. Local UI State
    local: {
        discardedCards: string[];
        isClaimOpen: boolean;
        selectedDiscardIds: string[];
        themeId: GameTheme['id'];
        selectedCardId: string | null;
        isMyTurn: boolean;

        // The snapshots
        heldTopDiscard: any | null;
    };

    // --- ACTIONS ---
    setConn: (status: ConnState) => void;
    setPlayerKey: (newPlayerKey: string) => void;
    setInitialSync: (synced: boolean) => void;
    syncServerState: (newState: ClaimServerState) => void;

    selectCard: (cardId: string | null) => void;
    checkIfMyTurn: (mySessionId: string) => void;
    checkIfClaimOpen: (mySessionId: string) => void;
    setTheme: (id: GameTheme['id']) => void;

    toggleCardSelection: (card: string) => void;
    clearSelection: () => void; // 🌟 Add this line
    clearDiscardedCards: () => void;
    discardCards: (selectedDiscardIds: string[]) => void;
    drawCards: (fromDiscard: boolean) => void;
    claimGame: () => void;
    requestAddBot: (room: Room | null) => void;
    setPlayerReady: (room: Room | null) => void;


    //DEBUG
    debugPath: {
        from: { x: number; y: number };
        to: { x: number; y: number };
    } | null;
    setDebugPath: (path: { from: { x: number; y: number }; to: { x: number; y: number } } | null) => void;
    //
    // handPositions: Record<string, { x: number; y: number }>;
    // setHandPosition: (id: string, pos: { x: number; y: number }) => void;

    resetStore: () => void; // For intentional disconnects
}

const initialServerState: ClaimServerState = {
    players: {},
    cardsRemaining: 0,
    cardsDiscarded: 0,

    gameStatus: 'WAITING',
    minPlayers: 2,
    countdown: 0,
    round: 0,
    claimRoundOpen: 0,
    currentTurn: '',
    atuRank: '',
    discardPile: [],
    atuCard: [],
    turnOrder: [],
    currentTurnIndex: 0,
    roundStarterIndex: 0,


};

export const useGameStore = create<GameStore>()(
        immer((set, get) => ({
            conn: {status: "idle"},
            playerKey: "",
            isInitialStateSynced: false,
            awaitingMandatoryDraw: false,
            server: initialServerState,
            local: {
                themeId: 'midnight',
                selectedCardId: null,
                isMyTurn: false,
                selectedDiscardIds: [],
                discardedCards: [],
                isClaimOpen: false,
                heldTopDiscard: null,
            },
            debugPath: null,

            setConn: (newStatus) => set((state) => {
                state.conn = newStatus;
            }),

            setPlayerKey: (newPlayerKey) => set((state) => {
                state.playerKey = newPlayerKey;
            }),


            setInitialSync: (synced) => set((state) => {
                state.isInitialStateSynced = synced;
            }),

            syncServerState: (newState) => set((state) => {
                // @ts-ignore
                const wasMyTurn = state.server.currentTurn === state.conn.sessionId;
                // @ts-ignore
                const isNowMyTurn = newState.currentTurn === state.conn.sessionId;

                // If my turn just ended, clear any lingering highlights
                if (wasMyTurn && !isNowMyTurn) {
                    state.local.selectedDiscardIds = [];
                    state.local.discardedCards = [];
                }
                state.server = newState;
                state.isInitialStateSynced = true;
            }),


            selectCard: (cardId) => set((state) => {
                state.local.selectedCardId = cardId;
            }),

            checkIfMyTurn: (mySessionId) => set((state) => {
                state.local.isMyTurn = state.server.currentTurn === mySessionId;
            }),

            checkIfClaimOpen: (mySessionId) => set((state) => {
                // 1. Check if it's actually their turn
                const isMyTurn = state.server.currentTurn === mySessionId;

                // 2. Check if the game has progressed far enough to allow claiming
                const isRoundEligible = state.server.round >= state.server.claimRoundOpen;

                // 3. Store the result in the local UI state, leaving the server state pure
                state.local.isClaimOpen = isMyTurn && isRoundEligible;
            }),

            setTheme: (id) => set((state) => {
                state.local.themeId = id;
            }),

            discardCards: (cards) => set((state) => {
                // Take snapshot
                const pile = state.server.discardPile;
                state.local.heldTopDiscard = pile.length > 0 ? pile[pile.length - 1] : null;
                state.local.discardedCards = cards;

                globalRoom?.send("discardCards", {cardIds: cards});


            }),


            // Inside your gameStore definition
            drawCards: async (fromDiscard: boolean) => {
                const {discardedCards} = get().local;
                const visualStore = useVisualStore.getState();

                // 1. If cards are out, ask VisualStore to handle the 'physical' cleanup
                if (discardedCards.length > 0) {
                    await visualStore.triggerFanUp();
                }

                // 2. Game logic proceeds
                globalRoom?.send("drawCard", {fromDiscard});

                set((state) => {
                    state.local.heldTopDiscard = null;

                });
            },

            claimGame: () => set((state) => {
                globalRoom?.send("shoutClaim")
            }),

            toggleCardSelection: (cardStr: string) => set((state) => {
                const sessId = state.conn.status === 'connected' ? state.conn.sessionId : null;
                if (!sessId) return;

                const current = state.local.selectedDiscardIds; // This is an array of strings
                const index = current.indexOf(cardStr);

                // 1. Deselect if already in the list
                if (index > -1) {
                    state.local.selectedDiscardIds.splice(index, 1);
                    return;
                }

                // 2. Helper to get rank from string "suit-rank-id"
                const getRank = (str: string) => str.split('-')[1];

                // 3. Selection Logic
                const firstCardStr = current[0];
                const newCardRank = getRank(cardStr);

                if (!firstCardStr || getRank(firstCardStr) === newCardRank) {
                    // Match! Add it to the group
                    state.local.selectedDiscardIds.push(cardStr);
                } else {
                    // Different rank? Pivot to the new rank group
                    state.local.selectedDiscardIds = [cardStr];
                }
            }),

            clearSelection: () => set((state) => {
                // With Immer, we just reassign the array to empty
                state.local.selectedDiscardIds = [];

                // Optional: Log for debugging during development
                console.log("Selection cleared");
            }),

            clearDiscardedCards: () => set((state) => {
                state.local.discardedCards = [];
            }),

            requestAddBot: (room) => {
                if (!room) return;
                // We send a message to the Colyseus Room
                room.send("addBot");
            },


            setPlayerReady: (room) => {
                if (!room) return;
                room.send("playerReady");
            },

            resetStore: () => set((state) => {
                state.server = initialServerState;
                state.isInitialStateSynced = false;
                state.conn = {status: "idle"};
                state.local.selectedCardId = null;
            }),


            setDebugPath: (path) => set((state) => {
                state.debugPath = path;
            }),

            // În implementarea immer
            // handPositions: {},
            // setHandPosition: (id, pos) => set((state) => {
            //     state.handPositions[id] = pos;
            // }),

        }))
    )
;