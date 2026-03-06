// src/state/machine/initial.ts
import type { RootState } from "./types";
import type { ThemeId } from "@/theme";

export function initialState(sessionId = ""): RootState {
    return {
        game: {
            phase: "boot",
            round: 1,
            gameStatus: "waiting",

            // stableId universe fields start unknown
            myPlayerId: null, // ✅ stableId, filled by YOU_ARE
            currentTurn: null, // ✅ stableId, filled by snapshots/turn events
            turnOrder: [], // ✅ stableIds
            currentTurnIndex: -1, // ✅ numeric sentinel is nicer than null


            // transport/debug only
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

            opponentDrawSeq: 0,
            lastOpponentDrawerId: null,
            lastOpponentFromDiscard: false,

            myDrawSeq: 0,
            myLastFromDiscard: false,

            // flavor: "",
            flavorText: "",
            discardPile: []
        },
        ui: {
            screen: "lobby", // ✅ optional: more consistent with boot/waiting
            mode: "idle",
            popup: null,

            selectedIds: [],
            locks: {input: false, draw: false, discard: false},

            tableOverlay: null,
            themeId: "" as ThemeId,

            eventLog: [],
            lastEvent: undefined,
            endFlow: null,
            flightQueue: [],
            flightSeq: 0,
            stagedCards: [],

            // ✨ NEW: Unified discard pile state
            discardPile: {
                floatingCard: null,
                underCard: null,
                offset: { x: 0, y: 0, rot: 0 },
                offsetSeq: 0,
            },

            // 🗑️ DEPRECATED: Old state (keep for backwards compatibility during migration)
            discardHold: false,
            discardHoldTop: undefined,
            discardHoldCount: undefined,
            pendingTopDiscard: undefined,
            pendingDiscardCount: undefined,
            stageCommitArmed: false,
            animTx: null,
            discardDrawHideTop: false,
            claimPending: false
        },
    };
}