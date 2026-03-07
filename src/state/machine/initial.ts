// src/state/machine/initial.ts
import type { RootState } from "./types";
import type { ThemeId } from "@/theme";
import { initialPredictionState } from "@/state/prediction/reducer";

export function initialState(sessionId = ""): RootState {
    return {
        game: {
            phase: "boot",
            round: 1,
            gameStatus: "waiting",

            myPlayerId: null,
            currentTurn: null,
            turnOrder: [],
            currentTurnIndex: -1,

            sessionId,

            cardsRemaining: 0,
            cardsDiscarded: 0,
            mandatoryDraw: false,

            playerCards: [],
            opponents: [],
            readyList: [],

            atuCards: [],
            deckReady: false,
            topDiscard: undefined,

            lastRound: null,
            leaderboard: [],

            flavorText: "",
            discardPile: [],
        },
        ui: {
            screen: "lobby",
            mode: "idle",
            popup: null,

            selectedIds: [],
            locks: { input: false, draw: false, discard: false },

            tableOverlay: null,
            themeId: "" as ThemeId,

            eventLog: [],
            lastEvent: undefined,
            endFlow: null,
            flightQueue: [],
            flightSeq: 0,
            stagedCards: [],

            discardPile: {
                floatingCard: null,
                underCard: null,
                offset: { x: 0, y: 0, rot: 0 },
                offsetSeq: 0,
                discardedBatchCount: 0,
            },

            discardHold: false,
            discardHoldTop: undefined,
            discardHoldCount: undefined,
            pendingTopDiscard: undefined,
            pendingDiscardCount: undefined,

            claimPending: false,
            discardPileDrawing: false,
            dealReveal: {},
        },
        prediction: initialPredictionState,
    };
}
