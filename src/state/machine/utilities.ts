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

    // Treat null/empty/"undefined" as missing
    if (cur == null || cur === "" || cur === "undefined") cur = undefined;

    // Normalize idx
    if (typeof idx !== "number" || Number.isNaN(idx)) idx = -1;

    if (n === 0) {
        return {...game, currentTurn: "", currentTurnIndex: -1};
    }

    const curIdx = cur ? order.indexOf(cur) : -1;
    const curValid = curIdx !== -1;

    // If currentTurn is missing or invalid
    if (!curValid) {
        // ✅ Strict mode: do not fabricate
        if (!allowDerive) {
            const safeIdx = (typeof idx === "number" && idx >= 0 && idx < n) ? idx : -1;
            return {...game, currentTurn: cur ?? "", currentTurnIndex: safeIdx};
        }

        // Lenient mode: derive from idx (or default 0)
        let nextIdx = (idx >= 0 && idx < n) ? idx : 0;
        const nextCur = order[nextIdx] ?? order[0];
        return {...game, currentTurn: nextCur, currentTurnIndex: order.indexOf(nextCur)};
    }

    // cur valid: enforce idx to match
    return {...game, currentTurn: cur, currentTurnIndex: curIdx};
}


export function nextFlightId(state: RootState): number {
    return (state.ui.flightSeq ?? 0) + 1;
}
/**
 * Builds map keyed by sessionId (Option B).
 */
export function buildRevealMap(revealed: any[] | undefined) {
    if (!revealed?.length) return undefined;

    const map: Record<string, { cards: HandCard[]; handValue: number }> = {};

    for (const p of revealed) {
        // Prefer stable id if server sends it (playerId/stableId), else fallback to sessionId
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

export function dbgTurn(prefix: string, turnOrder: string[], currentTurn: string, currentTurnIndex: number) {
    const idx = turnOrder.indexOf(currentTurn);
    if (idx === -1 || currentTurnIndex === -1) {
        // console.log(
        //     `[TURNDBG ${prefix}] currentTurn="${currentTurn}" idx=${idx} stateIdx=${currentTurnIndex} order=[${turnOrder.join(", ")}]`
        // );
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

    // ----------------------------
    // ✅ 1) Build next game normally
    // ----------------------------
    const baseGame = shouldNorm
        ? normalizeTurn({ ...nextGame, phase }, { allowDerive: false })
        : { ...nextGame, phase };

    // ----------------------------
    // ✅ 2) Mask discard pile truth while client is holding visuals
    // ----------------------------
    let nextUi = state.ui;
    let game = baseGame;

    const holding = !!state.ui.discardHold;

    if (holding) {
        const patchTouchesDiscard =
            "topDiscard" in patch || "cardsDiscarded" in patch;

        if (patchTouchesDiscard) {
            // stash authoritative values to apply later
            nextUi = {
                ...nextUi,
                pendingTopDiscard:
                    "topDiscard" in patch ? baseGame.topDiscard : nextUi.pendingTopDiscard,
                pendingDiscardCount:
                    "cardsDiscarded" in patch ? baseGame.cardsDiscarded : nextUi.pendingDiscardCount,
            };

            // keep currently-visible discard pile stable
            game = {
                ...game,
                topDiscard: state.game.topDiscard,
                cardsDiscarded: state.game.cardsDiscarded,
            };
        }
    }

    // ----------------------------
    // ✅ 3) When mandatory draw ends, slide floating card back and release hold
    // ----------------------------
    const prevMandatory = !!state.game.mandatoryDraw;
    const nextMandatory = !!game.mandatoryDraw;

    // When mandatory draw ends (after a draw): slide the floating card back
    if (prevMandatory && !nextMandatory) {
        // Clear peek offset (triggers slide-back animation in DiscardPile)
        nextUi = {
            ...nextUi,
            discardPeekX: 0,
            discardPeekY: 0,
            discardPeekRot: 0,
            discardPeekSeq: (nextUi.discardPeekSeq ?? 0) + 1,
        };

        // Clear floating card after a short delay to allow slide animation
        // (The DiscardPile component will handle this via animation)
        nextUi = {
            ...nextUi,
            discardFloatingTop: undefined,
        };
    }

    // ----------------------------
    // ✅ 4) Release discard hold when mandatory draw ended
    // ----------------------------
    if (state.ui.discardHold && prevMandatory && !nextMandatory) {
        game = {
            ...game,
            topDiscard: nextUi.pendingTopDiscard ?? game.topDiscard,
            cardsDiscarded: nextUi.pendingDiscardCount ?? game.cardsDiscarded,
        };

        nextUi = {
            ...nextUi,
            discardHold: false,
            discardHoldTop: undefined,
            discardHoldCount: undefined,
            pendingTopDiscard: undefined,
            pendingDiscardCount: undefined,
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

    return { ...state, game, ui: { ...state.ui, endFlow: { kind, step: "claimAnnounce" }, locks: { ...state.ui.locks, input: true } } };
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

// Freeze pile to “pre-change” truth (under-card), so we can stage a floating top.
export function beginDiscardTheater(state: RootState) {
    return {
        ...state.ui,
        discardHold: true,
        discardHoldTop: state.ui.discardHoldTop ?? state.game.topDiscard ?? undefined,
        discardHoldCount: state.ui.discardHoldCount ?? state.game.cardsDiscarded,
        // don’t change discardFloatingTop here; that gets set on landing
    };
}

// Called when a discard flight lands in the discard pile (player or opponent).
export function landDiscardTheater(ui: RootState["ui"], game: RootState["game"], landedCard: any) {
    return {
        ...ui,
        discardHold: true,
        discardHoldTop: ui.discardHoldTop ?? game.topDiscard ?? undefined,
        discardHoldCount: ui.discardHoldCount ?? game.cardsDiscarded,
        discardFloatingTop: landedCard ?? ui.discardFloatingTop,

        discardPeekX: PEEK.x,
        discardPeekY: PEEK.y,
        discardPeekRot: PEEK.rot,
        discardPeekSeq: (ui.discardPeekSeq ?? 0) + 1,
    };
}

// Builds a draw-from-discard flight that always draws the UNDER-CARD (not the floating staged one).
export function makeDrawFromDiscardFlight(
    state: RootState,
    id: number,
    to: "hand" | { seat: string }
): FlightRequest {
    const under = state.ui.discardHoldTop ?? state.game.topDiscard ?? undefined;

    return {
        id,
        kind: "draw",
        from: "discard",
        to,
        card: under, // ✅ the correct card (underneath), same for player & opponent
    } as any;
}