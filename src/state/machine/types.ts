// src/state/machine/types.ts

import type {HandCard, FaceCard, Opponent} from "@/types/game";
import type {ThemeId} from "@/theme";
import type {ServerCard} from "@/helpers/suitHelpers";

export type GamePhase = "boot" | "lobby" | "playing" | "roundEnded" | "waitingNextRound" | "gameOver";
export type UiMode = "idle" | "selecting" | "dragging" | "animating" | "blocked";

export type ServerGameStatus = "waiting" | "starting" | "playing" | "roundEnded" | "gameEnded";

export type TableOverlay = null | "claimReveal";

export type Popup =
    | null
    | "roundEnded"
    | "settings"
    | "help"
    | "claimAnnounce"
    | "roundScores";

export type EndFlow =
    | null
    | {
    kind: "round" | "game";
    step: "claimAnnounce" | "roundScores";
};

export interface GameState {
    phase: GamePhase;
    round: number;
    gameStatus: ServerGameStatus;

    currentTurn: string | null;
    currentTurnIndex: number | null;
    turnOrder: string[];

    sessionId: string;
    myPlayerId: string | null; // stableId

    cardsRemaining: number;
    cardsDiscarded: number;

    mandatoryDraw: boolean;

    playerCards: HandCard[];
    opponents: Opponent[];

    atuCards: FaceCard[];
    deckReady: boolean;

    topDiscard?: HandCard;

    lastRound: RoundEndedPayload | null;
    leaderboard: LeaderboardEntry[];

    flavorText: string;

    opponentDrawSeq: number;
    lastOpponentDrawerId: string | null;
    lastOpponentFromDiscard: boolean;

    myDrawSeq: number;
    myLastFromDiscard: boolean;
    discardPile: FaceCard[];
    readyList: ReadyRow[];
}

export type AnchorKey = "deck" | "discard" | "hand" | "stage" | { seat: string };

export type FlightKind = "draw" | "discard";

export type FlightRequest = {
    id: number;
    kind: FlightKind;
    from: AnchorKey;
    to: AnchorKey;

    // optional payloads
    card?: HandCard;
    fromRect?: { x: number; y: number; w: number; h: number } | null;
    stageIndex?: number;
};
export type Rect = { x: number; y: number; w: number; h: number };

export type DiscardOrigin = {
    id: string;
    rect: Rect;
    card: HandCard;
};

// -----------------------------
// ✅ animTx (transaction)
// -----------------------------
export type AnimTxKind = "turnAction";

export type AnimTxPhase =
    | "idle"
    | "discardToStage"
    | "waitDiscardConfirm"
    | "waitDrawIntent"
    | "waitDrawConfirm"
    | "commitStageToDiscard";

export type AnimTx = {
    id: number;
    kind: AnimTxKind;
    phase: AnimTxPhase;
    createdAt: number;

    discardIds?: string[];
    drawFrom?: "deck" | "discard";
};

export interface UiState {
    screen: "play" | "lobby";
    mode: UiMode;

    popup: Popup;
    endFlow: EndFlow;
    navIntent?: null | "lobby";

    selectedIds: string[];
    tableOverlay: TableOverlay;

    flightQueue: FlightRequest[];
    flightSeq: number;

    locks: {
        input: boolean;
        draw: boolean;
        discard: boolean;
    };

    themeId: ThemeId;

    eventLog: { type: string; at: number }[];
    lastEvent?: { type: string; at: number };

    animTx: AnimTx | null;

    stagedCards: HandCard[];
    stageCommitArmed: boolean;

    // ✨ NEW: Unified discard pile state (state-driven)
    discardPile: {
        floatingCard: HandCard | null;    // The offset card
        underCard: HandCard | null;        // What shows underneath
        offset: { x: number; y: number; rot: number };  // Position
        offsetSeq: number;                 // Animation trigger
    };

    // 🗑️ DEPRECATED: Old scattered state (will be removed)
    discardFloatingTop?: HandCard;
    discardHold: boolean;
    discardHoldTop?: HandCard;
    discardHoldCount?: number;
    pendingTopDiscard?: HandCard;
    pendingDiscardCount?: number;
    discardPeekX?: number;
    discardPeekY?: number;
    discardPeekSeq?: number;
    discardPeekRot?: number;
    claimPending: boolean;
    discardDrawHideTop?: boolean;
    pendingServerDiscard?: string[];
}
export interface RootState {
    game: GameState;
    ui: UiState;
}

export interface LeaderboardEntry {
    sessionId: string;
    name: string;
    totalPoints: number;
    delta: number;
}

export type ReadyRow = {
    playerId: string;
    name: string;
    ready: boolean;
    connected: boolean;
    isBot: boolean;
};

export interface RevealedHand {
    playerId?: string;
    stableId?: string;
    sessionId?: string;
    name: string;
    handValue: number;
    cards: ServerCard[];
}

export interface RoundEndedPayload {
    round: { index: number; turn: number };
    flavorText: string;
    claim: {
        claimerSessionId: string;
        claimerName: string;
        success: boolean;
        claimerHandValue: number;
        lowestOtherValue: number;
    };
    revealedHands: RevealedHand[];
    leaderboard: LeaderboardEntry[];
    history: any[];
}

export interface GameEndedPayload extends RoundEndedPayload {
    winner: string;
}

export type Event =
    | { type: "BOOT"; sessionId: string }
    | { type: "SERVER_SNAPSHOT"; snapshot: Partial<GameState> }
    | { type: "SERVER_PATCH"; patch: Partial<GameState> }
    | { type: "SERVER_ACTION"; action: any }
    | { type: "YOU_ARE"; stableId: string }
    | { type: "HAND_UPDATED"; cards: HandCard[] }
    | { type: "OPPONENT_UPDATED"; opponent: Opponent }
    | { type: "OPPONENT_REMOVED"; id: string }
    | { type: "ATU_UPDATED"; cards: FaceCard[] }
    | { type: "TOP_DISCARD_UPDATED"; card?: HandCard }
    | { type: "MANDATORY_DRAW"; value: boolean }
    | { type: "TURN_TOPOLOGY_UPDATED"; order: string[]; currentTurn: string; currentTurnIndex: number; round?: number }
    | { type: "MY_DREW"; fromDiscard: boolean }
    | { type: "OPPONENT_DREW"; opponentId: string; fromDiscard: boolean }
    | { type: "UI_SELECT_TOGGLE"; id: string }
    | { type: "UI_CLEAR_SELECTION" }
    | { type: "UI_SET_MODE"; mode: UiMode }
    | { type: "SET_THEME"; themeId: ThemeId }
    | { type: "UI_OPEN_POPUP"; popup: Exclude<Popup, null> }
    | { type: "UI_CLOSE_POPUP" }
    | { type: "UI_LOCK"; key: keyof UiState["locks"]; value: boolean }
    | { type: "UI_SET_SELECTION"; ids: string[] }
    | {
    type: "INTENT_DRAW_FROM_DECK";
}
    | {
    type: "INTENT_DRAW_FROM_DISCARD";
    originRect?: { x: number; y: number; w: number; h: number };
    targetRect?: { x: number; y: number; w: number; h: number };
}
    | {
    type: "INTENT_DISCARD_SELECTED";
    ids: string[];
    origins?: DiscardOrigin[];
}
    | { type: "OPPONENT_DISCARDED"; opponentId: string; count: number }
    | { type: "INTENT_SHOUT_CLAIM" }
    | { type: "CLAIM_RESULT"; ok: boolean; reason?: string }
    | { type: "CLAIM_REVEAL_DONE" }
    | { type: "ACK_ENDFLOW" }
    | { type: "ROUND_ENDED"; payload: RoundEndedPayload }
    | { type: "ROUND_ENDED_CLOSED" }
    | { type: "GAME_ENDED"; payload: GameEndedPayload }
    | { type: "ANIM_FLIGHT_DONE"; id: number }
    | { type: "ANIM_CLEAR_QUEUE" }
    | { type: "CLEAR_FLOATING_DISCARD" }
    | { type: "DISCARD_LANDED"; card?: HandCard }
    | { type: "DRAW_STARTED" }
    | { type: "OFFSET_SLIDE_COMPLETE" };