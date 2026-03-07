// src/state/machine/reducer.ts

import type { RootState, Event, FlightRequest, DiscardOrigin } from "./types";
import {
    applyServerUpdate,
    handleEndGame,
    makeDrawFromDiscardFlight,
    normalizeTurn,
} from "@/state/machine/utilities";
import { convertServerCardToUICard } from "@/helpers/suitHelpers";
import { predictionReducer } from "@/state/prediction/reducer";
import { DISCARD_PEEK } from "@/components/Piles/DiscardPile/discardPileConfig";

// -----------------------------
// Small helpers (pure + cheap)
// -----------------------------
type ServerCardPayload = { id: string; rank: any; suit: any; value: number };

const toUiCard = (c?: ServerCardPayload | null) => (c ? (convertServerCardToUICard(c as any) as any) : undefined);

const isMe = (state: RootState, stableId: string) => !!state.game.myPlayerId && state.game.myPlayerId === stableId;

function phaseFromStatus(status: string): RootState["game"]["phase"] {
    switch (status) {
        case "waiting":     return "lobby";
        case "starting":
        case "playing":     return "playing";
        case "roundEnded":  return "roundEnded";
        case "gameEnded":   return "gameOver";
        default:            return "lobby";
    }
}

export function reducer(state: RootState, ev: Event): RootState {
    switch (ev.type) {
        // -----------------------------
        // Boot / identity / theme
        // -----------------------------
        case "BOOT":
            return { ...state, game: { ...state.game, sessionId: ev.sessionId, phase: "lobby" } };

        case "SET_THEME":
            return { ...state, ui: { ...state.ui, themeId: ev.themeId } };

        case "YOU_ARE":
            return { ...state, game: { ...state.game, myPlayerId: ev.stableId } };

        // -----------------------------
        // Server sync
        // -----------------------------
        case "SERVER_SNAPSHOT": {
            const snapshot = (ev.snapshot ?? {}) as any;
            const merged = { ...state.game, ...snapshot };
            const game = normalizeTurn(merged, { allowDerive: false });
            return applyServerUpdate(state, game, snapshot);
        }

        case "SERVER_PATCH": {
            const patch = (ev.patch ?? {}) as any;
            return applyServerUpdate(state, { ...state.game, ...patch }, patch);
        }

        // -----------------------------
        // Server actions (ACTION channel)
        // -----------------------------
        case "SERVER_ACTION": {
            const a = (ev as any).action;
            if (!a?.type || !a?.payload) return state;

            switch (a.type) {
                // ============================================================
                // DISCARD - syncs offset animation across all clients
                // ============================================================
                case "DISCARD": {
                    const p = a.payload as {
                        playerId: string;
                        topDiscardBefore: any;
                        topDiscardAfter: any;
                        cardIds?: string[];
                        discardedCards?: any[];
                    };
                    const actorId = p.playerId;

                    const nextGame = {
                        ...state.game,
                        topDiscard: p.topDiscardAfter ? toUiCard(p.topDiscardAfter) : state.game.topDiscard,
                        cardsDiscarded: (state.game.cardsDiscarded || 0) + (p.cardIds?.length ?? 1),
                    };

                    if (!isMe(state, actorId)) {
                        // Check if prediction already fired for this opponent
                        const existingPred = state.prediction.active.find(
                            (pr) => pr.type === "opponentDiscard" && (pr as any).opponentId === actorId
                        );

                        const underCard = p.topDiscardBefore ? toUiCard(p.topDiscardBefore) : state.game.topDiscard;

                        if (existingPred) {
                            return {
                                ...state,
                                game: nextGame,
                                prediction: predictionReducer(state.prediction, {
                                    type: "PREDICTION_CONFIRMED",
                                    id: existingPred.id,
                                }),
                            };
                        }

                        // No prediction - create flights now
                        const cards = (p.discardedCards ?? []).map(toUiCard).filter(Boolean) as any[];
                        const n = Math.max(1, cards.length || (p.cardIds?.length ?? 0) || 1);

                        let seq = state.ui.flightSeq ?? 0;
                        const flights: FlightRequest[] = [];
                        for (let i = 0; i < n; i++) {
                            flights.push({
                                id: ++seq,
                                kind: "discard",
                                from: { seat: actorId },
                                to: "discard",
                                card: cards[i],
                                discardFraction: (i + 1) / n,
                            } as any);
                        }

                        return {
                            ...state,
                            game: nextGame,
                            ui: {
                                ...state.ui,
                                mode: "animating",
                                locks: { ...state.ui.locks, input: true },
                                flightSeq: seq,
                                flightQueue: [...state.ui.flightQueue, ...flights],
                                discardHold: true,
                                discardHoldTop: underCard,
                                discardHoldCount: state.game.cardsDiscarded,
                                discardedBatchSize: n,
                            },
                        };
                    }

                    // Own discard: flight already created by INTENT_DISCARD_SELECTED
                    return { ...state, game: nextGame };
                }

                // ============================================================
                // DRAW FROM DISCARD
                // ============================================================
                case "DRAW_FROM_DISCARD": {
                    const actorId = (a.payload as { playerId: string }).playerId;

                    if (isMe(state, actorId)) {
                        return reducer(state, { type: "MY_DREW", fromDiscard: true });
                    }

                    const existingPred = state.prediction.active.find(
                        (pr) => pr.type === "opponentDraw" && (pr as any).opponentId === actorId
                    );

                    if (existingPred) {
                        return {
                            ...state,
                            prediction: predictionReducer(state.prediction, {
                                type: "PREDICTION_CONFIRMED",
                                id: existingPred.id,
                            }),
                        };
                    }

                    return reducer(state, { type: "OPPONENT_DREW", opponentId: actorId, fromDiscard: true });
                }

                // ============================================================
                // DRAW FROM DECK
                // ============================================================
                case "DRAW_FROM_DECK": {
                    const actorId = (a.payload as { playerId: string }).playerId;

                    if (isMe(state, actorId)) {
                        return reducer(state, { type: "MY_DREW", fromDiscard: false });
                    }

                    const existingPred = state.prediction.active.find(
                        (pr) => pr.type === "opponentDraw" && (pr as any).opponentId === actorId
                    );

                    if (existingPred) {
                        return {
                            ...state,
                            prediction: predictionReducer(state.prediction, {
                                type: "PREDICTION_CONFIRMED",
                                id: existingPred.id,
                            }),
                        };
                    }

                    return reducer(state, { type: "OPPONENT_DREW", opponentId: actorId, fromDiscard: false });
                }

                default:
                    return state;
            }
        }

        // -----------------------------
        // Turn & game state updates
        // -----------------------------
        case "TURN_TOPOLOGY_UPDATED":
            return {
                ...state,
                game: normalizeTurn({
                    ...state.game,
                    turnOrder: ev.order,
                    currentTurn: ev.currentTurn,
                    currentTurnIndex: ev.currentTurnIndex,
                }),
            };

        case "ATU_UPDATED":
            return { ...state, game: { ...state.game, atuCards: ev.cards, deckReady: ev.cards.length > 0 } };

        case "TOP_DISCARD_UPDATED":
            return { ...state, game: { ...state.game, topDiscard: ev.card } };

        case "MANDATORY_DRAW": {
            const next = { ...state, game: { ...state.game, mandatoryDraw: ev.value } };
            if (state.game.mandatoryDraw && !ev.value) {
                return {
                    ...next,
                    ui: {
                        ...next.ui,
                        discardPile: {
                            ...next.ui.discardPile,
                            offset: { x: 0, y: 0, rot: 0 },
                            offsetSeq: next.ui.discardPile.offsetSeq + 1,
                            discardedBatchCount: 0,
                        },
                        discardDrawableCard: undefined,
                        discardPileDrawing: false,
                    },
                };
            }
            return next;
        }

        // -----------------------------
        // Hand & opponents
        // -----------------------------
        case "HAND_UPDATED": {
            if (state.ui.endFlow) return state;
            const wasEmpty = state.game.playerCards.length === 0;
            const gettingCards = ev.cards.length > 0;
            const isRoundStart = wasEmpty && gettingCards && state.game.gameStatus === "playing";
            return {
                ...state,
                game: { ...state.game, playerCards: ev.cards },
                ui: isRoundStart
                    ? { ...state.ui, dealSeq: (state.ui.dealSeq ?? 0) + 1, dealingActive: true }
                    : state.ui,
            };
        }

        case "OPPONENT_UPDATED": {
            if (state.ui.endFlow && state.game.opponents.some((o) => o.id === ev.opponent.id)) return state;

            const exists = state.game.opponents.some((o) => o.id === ev.opponent.id);
            const opponents = exists
                ? state.game.opponents.map((o) =>
                    o.id === ev.opponent.id ? { ...o, ...ev.opponent, cards: ev.opponent.cards ?? o.cards } : o
                )
                : [...state.game.opponents, ev.opponent];

            return { ...state, game: { ...state.game, opponents } };
        }

        case "OPPONENT_REMOVED":
            return { ...state, game: { ...state.game, opponents: state.game.opponents.filter((o) => o.id !== ev.id) } };

        case "OPPONENT_DREW": {
            const id = (state.ui.flightSeq ?? 0) + 1;
            const flight = ev.fromDiscard
                ? makeDrawFromDiscardFlight(state, id, { seat: ev.opponentId })
                : ({ id, kind: "draw", from: "deck", to: { seat: ev.opponentId } } as any);

            const discardDrawUi = ev.fromDiscard
                ? {
                    discardDrawableCard: undefined as any,
                    discardPileDrawing: true,
                    discardPile: {
                        ...state.ui.discardPile,
                        offset: { x: 0, y: 0, rot: 0 },
                        offsetSeq: state.ui.discardPile.offsetSeq + 1,
                        discardedBatchCount: 0,
                    },
                }
                : {};

            return {
                ...state,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    locks: { ...state.ui.locks, input: true },
                    flightSeq: id,
                    flightQueue: [...state.ui.flightQueue, flight],
                    ...discardDrawUi,
                },
            };
        }

        case "MY_DREW":
            return state;

        // -----------------------------
        // Prediction
        // -----------------------------
        case "PREDICT_OPPONENT_DRAW": {
            const prediction = predictionReducer(state.prediction, ev as any);
            const id = (state.ui.flightSeq ?? 0) + 1;
            const flight = ev.fromDiscard
                ? makeDrawFromDiscardFlight(state, id, { seat: ev.opponentId })
                : ({ id, kind: "draw", from: "deck", to: { seat: ev.opponentId } } as any);

            const discardDrawUi = ev.fromDiscard
                ? {
                    discardDrawableCard: undefined as any,
                    discardPileDrawing: true,
                    discardPile: {
                        ...state.ui.discardPile,
                        offset: { x: 0, y: 0, rot: 0 },
                        offsetSeq: state.ui.discardPile.offsetSeq + 1,
                        discardedBatchCount: 0,
                    },
                }
                : {};
// console.log("[PREDICT_OPPONENT_DRAW] opponent drew");
            return {
                ...state,
                prediction,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    locks: { ...state.ui.locks, input: true },
                    flightSeq: id,
                    flightQueue: [...state.ui.flightQueue, flight],
                    ...discardDrawUi,
                },
            };
        }

        case "PREDICT_OPPONENT_DISCARD": {
            const prediction = predictionReducer(state.prediction, ev as any);

            let seq = state.ui.flightSeq ?? 0;
            const flights: FlightRequest[] = [];
            for (let i = 0; i < ev.count; i++) {
                flights.push({ id: ++seq, kind: "discard", from: { seat: ev.opponentId }, to: "discard", discardFraction: (i + 1) / ev.count } as any);
            }

            return {
                ...state,
                prediction,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    locks: { ...state.ui.locks, input: true },
                    flightSeq: seq,
                    flightQueue: [...state.ui.flightQueue, ...flights],
                    discardHold: true,
                    discardHoldTop: state.ui.discardHoldTop ?? state.game.topDiscard,
                    discardHoldCount: state.ui.discardHoldCount ?? state.game.cardsDiscarded,
                    discardedBatchSize: ev.count,
                },
            };
        }

        case "PREDICTION_CONFIRMED":
            return { ...state, prediction: predictionReducer(state.prediction, ev as any) };

        case "CLEAR_PREDICTIONS":
            return { ...state, prediction: predictionReducer(state.prediction, ev as any) };

        // -----------------------------
        // UI interactions
        // -----------------------------
        case "UI_SELECT_TOGGLE": {
            const selectedIds = state.ui.selectedIds.includes(ev.id)
                ? state.ui.selectedIds.filter((x) => x !== ev.id)
                : [...state.ui.selectedIds, ev.id];
            return { ...state, ui: { ...state.ui, selectedIds } };
        }

        case "UI_SET_SELECTION":
            return { ...state, ui: { ...state.ui, selectedIds: ev.ids } };

        case "UI_CLEAR_SELECTION":
            return { ...state, ui: { ...state.ui, selectedIds: [] } };

        case "UI_SET_MODE":
            return { ...state, ui: { ...state.ui, mode: ev.mode } };

        case "UI_LOCK":
            return { ...state, ui: { ...state.ui, locks: { ...state.ui.locks, [ev.key]: ev.value } } };

        // -----------------------------
        // End game flow
        // -----------------------------
        case "ROUND_ENDED":
            return handleEndGame(state, ev.payload, "round");

        case "GAME_ENDED":
            return handleEndGame(state, ev.payload, "game");

        case "CLAIM_REVEAL_DONE":
        case "ROUND_ENDED_CLOSED":
            return reducer(state, { type: "ACK_ENDFLOW" } as any);

        case "ACK_ENDFLOW": {
            const flow = state.ui.endFlow;
            if (!flow) return state;

            if (flow.step === "claimAnnounce") {
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        endFlow: { ...flow, step: "roundScores" },
                        tableOverlay: null,
                        locks: { ...state.ui.locks, input: true },
                    },
                };
            }

            if (flow.step === "roundScores") {
                if (flow.kind === "game") {
                    return {
                        ...state,
                        ui: {
                            ...state.ui,
                            endFlow: null,
                            mode: "idle",
                            locks: { ...state.ui.locks, input: false },
                            navIntent: "lobby",
                        },
                    };
                }

                const game = normalizeTurn({
                    ...state.game,
                    phase: phaseFromStatus((state.game as any).gameStatus ?? "waiting"),
                    lastRound: null,
                    playerCards: [],
                    mandatoryDraw: false,
                    atuCards: [],
                    deckReady: false,
                    topDiscard: undefined,
                    opponents: state.game.opponents.map((o) => ({ ...o, cards: [], handValue: 0 })),
                } as any);

                return {
                    ...state,
                    game,
                    ui: { ...state.ui, endFlow: null, mode: "idle", locks: { ...state.ui.locks, input: false } },
                };
            }

            return state;
        }

        // -----------------------------
        // Intents
        // -----------------------------
        case "INTENT_DRAW_FROM_DECK":
        case "INTENT_DRAW_FROM_DISCARD": {
            if (!state.game.mandatoryDraw) return state;
            if (ev.type === "INTENT_DRAW_FROM_DECK" && state.game.cardsRemaining <= 0) return state;
            if (ev.type === "INTENT_DRAW_FROM_DISCARD" && !state.game.topDiscard) return state;

            const isDiscard = ev.type === "INTENT_DRAW_FROM_DISCARD";
            const id = (state.ui.flightSeq ?? 0) + 1;

            const flight = isDiscard
                ? makeDrawFromDiscardFlight(state, id, "hand")
                : ({ id, kind: "draw", from: "deck", to: "hand" } as any);

            const discardDrawUi = isDiscard
                ? {
                    // Immediately hide under card and spring offset back — card is now in the air
                    discardDrawableCard: undefined as any,
                    discardPileDrawing: true,
                    discardPile: {
                        ...state.ui.discardPile,
                        offset: { x: 0, y: 0, rot: 0 },
                        offsetSeq: state.ui.discardPile.offsetSeq + 1,
                        discardedBatchCount: 0,
                    },
                }
                : {};

            return {
                ...state,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    locks: { ...state.ui.locks, input: true, draw: true },
                    flightSeq: id,
                    flightQueue: [...state.ui.flightQueue, flight],
                    ...discardDrawUi,
                },
            };
        }

        case "INTENT_DISCARD_SELECTED": {
            if (state.ui.locks.input || state.ui.locks.discard || !ev.ids?.length) return state;

            const originById = new Map<string, DiscardOrigin>(
                (ev.origins ?? []).map(o => [o.id, o])
            );

            let seq = state.ui.flightSeq ?? 0;
            const flights: FlightRequest[] = [];
            const totalDiscard = ev.ids.length;

            for (let di = 0; di < ev.ids.length; di++) {
                const id = ev.ids[di];
                const origin = originById.get(id);
                const card = state.game.playerCards.find(c => c.id === id);
                flights.push({
                    id: ++seq,
                    kind: "discard",
                    from: "hand",
                    to: "discard",
                    card,
                    fromRect: origin?.rect ?? null,
                    discardFraction: (di + 1) / totalDiscard,
                } as any);
            }

            return {
                ...state,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    selectedIds: [],
                    locks: { ...state.ui.locks, input: true, discard: true },
                    flightSeq: seq,
                    flightQueue: [...state.ui.flightQueue, ...flights],
                    discardHold: true,
                    discardHoldTop: state.game.topDiscard,
                    discardHoldCount: state.game.cardsDiscarded,
                    discardedBatchSize: ev.ids.length,
                },
            };
        }

        case "CLAIM_RESULT": {
            if (!state.ui.claimPending) return state;

            return {
                ...state,
                ui: {
                    ...state.ui,
                    claimPending: false,
                    locks: !ev.ok ? { ...state.ui.locks, input: false } : state.ui.locks,
                },
            };
        }

        case "INTENT_SHOUT_CLAIM": {
            if (!state.game.myPlayerId) return state;
            if (state.game.currentTurn !== state.game.myPlayerId) return state;
            if (state.ui.endFlow) return state;
            if (state.ui.locks.input) return state;
            if (state.ui.claimPending) return state;

            return { ...state, ui: { ...state.ui, claimPending: true } };
        }

        // -----------------------------
        // Animations
        // -----------------------------
        case "ANIM_FLIGHT_DONE": {
            const head = state.ui.flightQueue[0];
            if (!head || head.id !== ev.id) return state;

            const nextQueue = state.ui.flightQueue.slice(1);
            const doneAnimating = nextQueue.length === 0;

            let nextGame = state.game;
            let nextUi = state.ui;
            let nextLocks = state.ui.locks;
            let nextMode = state.ui.mode;

            const isDiscardLanding = head.kind === "discard" && head.to === "discard";
            const nextHead = nextQueue[0];
            const isLastDiscardInBatch = isDiscardLanding &&
                !(nextHead?.kind === "discard" && nextHead?.to === "discard");
            const isIntermediateDiscard = isDiscardLanding && !isLastDiscardInBatch;
            const isDrawStarting = head.kind === "draw";

            if (isIntermediateDiscard) {
                // Progressive reveal: each card appears in the fan as it lands, rather than
                // all cards appearing at once after the last flight completes.

                // Pin the drawable card on the very first intermediate landing (before pile grows).
                // nextGame.discardPile is still the pre-discard pile held by discardHold.
                const drawableCard = nextUi.discardDrawableCard ??
                    nextGame.discardPile[nextGame.discardPile.length - 1] ?? undefined;

                // Reveal one more card from the pending pile (or use head.card as fallback
                // if the server patch hasn't arrived yet).
                const pending = nextUi.pendingDiscardPile;
                const currentLen = nextGame.discardPile.length;
                if (pending && currentLen < pending.length) {
                    nextGame = { ...nextGame, discardPile: pending.slice(0, currentLen + 1) };
                } else if (head.card) {
                    nextGame = { ...nextGame, discardPile: [...nextGame.discardPile, head.card as any] };
                }

                const newBatchCount = nextUi.discardPile.discardedBatchCount + 1;
                // Each card lands at its proportional fan position (fraction of full PEEK).
                // This ensures card k of N stays put when card k+1 arrives (no snap).
                const fraction = head.discardFraction ?? 1.0;
                const fractionalOffset = {
                    x: DISCARD_PEEK.x * fraction,
                    y: DISCARD_PEEK.y * fraction,
                    rot: DISCARD_PEEK.rot * fraction,
                };
                nextUi = {
                    ...nextUi,
                    discardDrawableCard: drawableCard as any,
                    discardPile: {
                        ...nextUi.discardPile,
                        offset: fractionalOffset,
                        offsetSeq: nextUi.discardPile.offsetSeq + 1,
                        discardedBatchCount: newBatchCount,
                    },
                };
            }

            if (isLastDiscardInBatch) {
                // discardDrawableCard may already be set by intermediate landings above.
                // If so, preserve it; otherwise compute it from the pre-discard pile top.
                const drawableCard = nextUi.discardDrawableCard ??
                    nextGame.discardPile[nextGame.discardPile.length - 1] ?? undefined;

                // Prefer the count stored at flight-creation time (reliable even if server patch is late).
                // Fall back to computing from pile lengths if available.
                const batchCount =
                    nextUi.discardedBatchSize ??
                    (nextUi.pendingDiscardPile !== undefined
                        ? Math.max(1, nextUi.pendingDiscardPile.length - nextGame.discardPile.length)
                        : 1);

                // Apply the held discardPile now that all cards have landed
                if (nextUi.pendingDiscardPile !== undefined) {
                    nextGame = { ...nextGame, discardPile: nextUi.pendingDiscardPile };
                    nextUi = { ...nextUi, pendingDiscardPile: undefined };
                }

                nextUi = {
                    ...nextUi,
                    discardedBatchSize: undefined, // consumed
                    discardDrawableCard: drawableCard as any,
                    discardPile: {
                        ...nextUi.discardPile,
                        offset: DISCARD_PEEK,
                        offsetSeq: nextUi.discardPile.offsetSeq + 1,
                        discardedBatchCount: batchCount,
                    },
                };
            }

            if (isDrawStarting) {
                nextUi = { ...nextUi, discardPileDrawing: false };

                // When a draw flight FROM the discard pile completes, always clear the PEEK
                // offset. This handles the case where the discard flight landed and set the
                // PEEK AFTER the draw-intent already tried to clear it (race between
                // SERVER_ACTION DISCARD landing and PREDICT_OPPONENT_DRAW firing).
                if (head.from === "discard") {
                    nextUi = {
                        ...nextUi,
                        discardPile: {
                            ...nextUi.discardPile,
                            offset: { x: 0, y: 0, rot: 0 },
                            offsetSeq: nextUi.discardPile.offsetSeq + 1,
                            discardedBatchCount: 0,
                        },
                        discardDrawableCard: undefined,
                    };
                }
            }

            if (doneAnimating) {
                nextMode = "idle";
                nextLocks = { ...nextLocks, input: false, discard: false, draw: false };

                // Release discard hold and apply any stashed server updates
                if (nextUi.discardHold) {
                    if (nextUi.pendingTopDiscard !== undefined) {
                        nextGame = {
                            ...nextGame,
                            topDiscard: nextUi.pendingTopDiscard,
                            cardsDiscarded: nextUi.pendingDiscardCount ?? nextGame.cardsDiscarded,
                        };
                    }
                    if (nextUi.pendingDiscardPile !== undefined) {
                        nextGame = { ...nextGame, discardPile: nextUi.pendingDiscardPile };
                    }
                    nextUi = {
                        ...nextUi,
                        discardHold: false,
                        discardHoldTop: undefined,
                        discardHoldCount: undefined,
                        pendingTopDiscard: undefined,
                        pendingDiscardCount: undefined,
                        pendingDiscardPile: undefined,
                        discardPile: { ...nextUi.discardPile, underCard: null },
                    };
                }
            }

            return {
                ...state,
                game: nextGame,
                ui: {
                    ...nextUi,
                    flightSeq: state.ui.flightSeq,
                    flightQueue: nextQueue,
                    mode: nextMode,
                    locks: nextLocks,
                },
            };
        }

        case "ANIM_DEAL_DONE":
            return { ...state, ui: { ...state.ui, dealingActive: false } };

        default:
            return state;
    }
}
