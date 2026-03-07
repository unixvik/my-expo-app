// src/state/machine/types.ts

import type {HandCard, FaceCard, Opponent} from "@/types/game";
import type {ThemeId} from "@/theme";
import type {ServerCard} from "@/helpers/suitHelpers";
import type {PredictionState} from "@/state/prediction/types";

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

    // For discard batches: k/N fraction (1/N for first card, 1.0 for last).
    // Drives landing position and pile offset so each card arrives at its final fan spot.
    discardFraction?: number;
};
export type Rect = { x: number; y: number; w: number; h: number };

export type DiscardOrigin = {
    id: string;
    rect: Rect;
    card: HandCard;
};

// -----------------------------
// animTx (transaction) - planned, not yet active
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

    stagedCards: HandCard[];

    // Unified discard pile state (state-driven)
    discardPile: {
        floatingCard: HandCard | null;
        underCard: HandCard | null;
        offset: { x: number; y: number; rot: number };
        offsetSeq: number;
        discardedBatchCount: number; // number of cards in the current discard batch (fan display)
    };

    // Discard hold: freezes topDiscard/discardPile display during flight animations
    discardHold: boolean;
    discardHoldTop?: HandCard;
    discardHoldCount?: number;
    pendingTopDiscard?: HandCard;
    pendingDiscardCount?: number;
    pendingDiscardPile?: FaceCard[];
    // The drawable card (original top before this discard batch) — shown as under card and used for draw flights
    discardDrawableCard?: FaceCard;
    // True while the drawable card is mid-flight to a hand; hides the under card in the pile
    discardPileDrawing: boolean;
    // Number of cards in the current discard batch — set at flight-creation time (reliable count)
    discardedBatchSize?: number;

    claimPending: boolean;

    // Round-start dealing animation
    dealSeq: number;       // increments each new round → triggers DealingCinematicOverlay
    dealingActive: boolean; // true while the dealing animation is playing (hides PlayerCards)
}

export interface RootState {
    game: GameState;
    ui: UiState;
    prediction: PredictionState;
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
    | { type: "PREDICT_OPPONENT_DRAW"; opponentId: string; fromDiscard: boolean }
    | { type: "PREDICT_OPPONENT_DISCARD"; opponentId: string; count: number }
    | { type: "PREDICTION_CONFIRMED"; id: number }
    | { type: "CLEAR_PREDICTIONS" }
    | { type: "UI_SELECT_TOGGLE"; id: string }
    | { type: "UI_CLEAR_SELECTION" }
    | { type: "UI_SET_MODE"; mode: UiMode }
    | { type: "SET_THEME"; themeId: ThemeId }
    | { type: "UI_OPEN_POPUP"; popup: Exclude<Popup, null> }
    | { type: "UI_CLOSE_POPUP" }
    | { type: "UI_LOCK"; key: keyof UiState["locks"]; value: boolean }
    | { type: "UI_SET_SELECTION"; ids: string[] }
    | { type: "INTENT_DRAW_FROM_DECK" }
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
    | { type: "INTENT_SHOUT_CLAIM" }
    | { type: "CLAIM_RESULT"; ok: boolean; reason?: string }
    | { type: "CLAIM_REVEAL_DONE" }
    | { type: "ACK_ENDFLOW" }
    | { type: "ROUND_ENDED"; payload: RoundEndedPayload }
    | { type: "ROUND_ENDED_CLOSED" }
    | { type: "GAME_ENDED"; payload: GameEndedPayload }
    | { type: "ANIM_FLIGHT_DONE"; id: number }
    | { type: "ANIM_CLEAR_QUEUE" }
    | { type: "ANIM_DEAL_DONE" };
