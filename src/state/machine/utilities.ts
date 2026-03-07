// src/state/machine/utilities.ts

import {FlightRequest, RootState} from "@/state/machine/types";
import {HandCard} from "@/types/game";
import {convertServerCardsToUICards} from "@/helpers/suitHelpers";

type NormalizeTurnOpts = {
    /** If false, do NOT invent currentTurn when missing/invalid (server-authoritative). */
    allowDerive?: boolean;
};

export function normalizeTurn(game: any, opts?: NormalizeTurnOpts) {
    const allowDerive = opts?.allowDerive ?? true;

    const order: string[] = Array.isArray(game.turnOrder) ? game.turnOrder : [];
    const n = order.length;

    let cur = game.currentTurn;
    let idx = game.currentTurnIndex;

    if (cur == null || cur === "" || cur === "undefined") cur = undefined;
    if (typeof idx !== "number" || Number.isNaN(idx)) idx = -1;

    if (n === 0) {
        return {...game, currentTurn: "", currentTurnIndex: -1};
    }

    const curIdx = cur ? order.indexOf(cur) : -1;
    const curValid = curIdx !== -1;

    if (!curValid) {
        if (!allowDerive) {
            const safeIdx = (typeof idx === "number" && idx >= 0 && idx < n) ? idx : -1;
            return {...game, currentTurn: cur ?? "", currentTurnIndex: safeIdx};
        }

        let nextIdx = (idx >= 0 && idx < n) ? idx : 0;
        const nextCur = order[nextIdx] ?? order[0];
        return {...game, currentTurn: nextCur, currentTurnIndex: order.indexOf(nextCur)};
    }

    return {...game, currentTurn: cur, currentTurnIndex: curIdx};
}

export function nextFlightId(state: RootState): number {
    return (state.ui.flightSeq ?? 0) + 1;
}

export function buildRevealMap(revealed: any[] | undefined) {
    if (!revealed?.length) return undefined;

    const map: Record<string, { cards: HandCard[]; handValue: number }> = {};

    for (const p of revealed) {
        const key =
            (typeof p.playerId === "string" && p.playerId) ||
            (typeof p.stableId === "string" && p.stableId) ||
            (typeof p.sessionId === "string" && p.sessionId) ||
            "";

        if (!key) continue;

        map[key] = {
            cards: convertServerCardsToUICards(p.cards),
            handValue: p.handValue ?? 0,
        };
    }

    return map;
}

export function visibleTopDiscard(state: RootState) {
    return state.ui.discardHold
        ? (state.ui.discardHoldTop ?? state.game.topDiscard)
        : state.game.topDiscard;
}

export const phaseFromStatus = (s: string) =>
    ({ waiting: "lobby", starting: "playing", playing: "playing", roundEnded: "roundEnded", gameEnded: "gameOver" }[s] || "lobby") as RootState["game"]["phase"];

export function applyServerUpdate(state: RootState, nextGame: any, patch: any) {
    const endKind = state.ui.endFlow?.kind;
    const phase =
        endKind === "round"
            ? "roundEnded"
            : endKind === "game"
                ? "gameOver"
                : phaseFromStatus(nextGame.gameStatus);

    const shouldNorm = ["turnOrder", "currentTurn", "currentTurnIndex"].some((k) => k in patch);

    const baseGame = shouldNorm
        ? normalizeTurn({ ...nextGame, phase }, { allowDerive: false })
        : { ...nextGame, phase };

    let nextUi = state.ui;
    let game = baseGame;


    const holding = !!state.ui.discardHold;

    if (holding) {
        const patchTouchesDiscard = "topDiscard" in patch || "cardsDiscarded" in patch;
        const patchTouchesDiscardPile = "discardPile" in patch;

        if (patchTouchesDiscard) {
            nextUi = {
                ...nextUi,
                pendingTopDiscard:
                    "topDiscard" in patch ? baseGame.topDiscard : nextUi.pendingTopDiscard,
                pendingDiscardCount:
                    "cardsDiscarded" in patch ? baseGame.cardsDiscarded : nextUi.pendingDiscardCount,
            };

            game = {
                ...game,
                topDiscard: state.game.topDiscard,
                cardsDiscarded: state.game.cardsDiscarded,
            };
        }

        if (patchTouchesDiscardPile) {
            nextUi = {
                ...nextUi,
                pendingDiscardPile: baseGame.discardPile,
            };

            game = {
                ...game,
                discardPile: state.game.discardPile,
            };
        }
    }

    // When mandatory draw ends: slide the floating discard card back
    const prevMandatory = !!state.game.mandatoryDraw;
    const nextMandatory = !!game.mandatoryDraw;

    // Slide back on turn change, UNLESS the human's mandatory draw window is active
    // (meaning the human still needs to decide whether to draw the top discard card).
    // `nextMandatory` reads state.game.mandatoryDraw which is set synchronously by the
    // MANDATORY_DRAW dispatch — which fires before this SERVER_PATCH microtask runs.
    const turnChanged = "currentTurn" in patch && patch.currentTurn !== state.game.currentTurn;
    if (turnChanged && !nextMandatory && (nextUi.discardPile.offset.x !== 0 || nextUi.discardPile.offset.y !== 0 || nextUi.discardPile.offset.rot !== 0)) {
        nextUi = {
            ...nextUi,
            discardPile: {
                ...nextUi.discardPile,
                offset: { x: 0, y: 0, rot: 0 },
                offsetSeq: nextUi.discardPile.offsetSeq + 1,
                discardedBatchCount: 0,
            },
            discardDrawableCard: undefined,
            discardPileDrawing: false,
        };
    }

    if (prevMandatory && !nextMandatory) {
        nextUi = {
            ...nextUi,
            discardPile: {
                ...nextUi.discardPile,
                offset: { x: 0, y: 0, rot: 0 },
                offsetSeq: nextUi.discardPile.offsetSeq + 1,
                discardedBatchCount: 0,
            },
            discardDrawableCard: undefined,
            discardPileDrawing: false,
        };
    }

    // Release discard hold when mandatory draw ends
    if (state.ui.discardHold && prevMandatory && !nextMandatory) {
        game = {
            ...game,
            topDiscard: nextUi.pendingTopDiscard ?? game.topDiscard,
            cardsDiscarded: nextUi.pendingDiscardCount ?? game.cardsDiscarded,
            discardPile: nextUi.pendingDiscardPile ?? game.discardPile,
        };

        nextUi = {
            ...nextUi,
            discardHold: false,
            discardHoldTop: undefined,
            discardHoldCount: undefined,
            pendingTopDiscard: undefined,
            pendingDiscardCount: undefined,
            pendingDiscardPile: undefined,
            discardDrawableCard: undefined,
        };
    }

    return { ...state, game, ui: nextUi };
}

export function handleEndGame(state: RootState, payload: any, kind: "round" | "game") {
    const revealMap = buildRevealMap(payload.revealedHands);
    const myKey = state.game.myPlayerId || state.game.sessionId;

    const opponents = revealMap ? state.game.opponents.map(o => {
        const r = revealMap[o.id];
        return r ? { ...o, cards: r.cards, cardCount: r.cards.length, handValue: r.handValue } : o;
    }) : state.game.opponents;

    const game = normalizeTurn({
        ...state.game,
        lastRound: payload,
        leaderboard: payload.leaderboard,
        opponents,
        playerCards: revealMap?.[myKey]?.cards ?? state.game.playerCards,
        phase: kind === "round" ? "roundEnded" : "gameOver",
        flavorText: payload.flavorText,
    });

    return {
        ...state,
        game,
        ui: {
            ...state.ui,
            endFlow: { kind, step: "claimAnnounce" as const },
            locks: { ...state.ui.locks, input: true },
        },
    };
}

export const PEEK = { x: 40, y: 20, rot: 25 };

export function enqueueFlights(state: RootState, flights: FlightRequest[]) {
    if (!flights.length) return state;
    return {
        ...state,
        ui: {
            ...state.ui,
            mode: "animating",
            locks: { ...state.ui.locks, input: true },
            flightQueue: [...state.ui.flightQueue, ...flights],
        },
    };
}

// Builds a draw-from-discard flight using the drawable (under) card.
// - When discardHold is active: game.discardPile is still the pre-discard pile, so [-1] is the drawable card.
// - When discardHold is released: game.discardPile has the new card at [-1] (offset/peek), so [-2] is drawable.
export function makeDrawFromDiscardFlight(
    state: RootState,
    id: number,
    to: "hand" | { seat: string }
): FlightRequest {
    const pile = state.game.discardPile;
    // discardDrawableCard = original top before this discard batch (set when last flight lands, cleared on draw/mandatory-draw-end)
    // discardHold active = pre-discard pile: [-1] is the drawable card
    // hold released, single discard: [-2] is the drawable card ([-1] is at PEEK)
    const card = state.ui.discardDrawableCard
        ?? (state.ui.discardHold
            ? (pile[pile.length - 1] ?? undefined)
            : (pile[pile.length - 2] ?? pile[pile.length - 1] ?? undefined));

    return {
        id,
        kind: "draw",
        from: "discard",
        to,
        card,
    } as any;
}
