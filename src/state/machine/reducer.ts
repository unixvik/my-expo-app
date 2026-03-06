// src/state/machine/reducer.ts

import type { RootState, Event, FlightRequest, DiscardOrigin } from "./types";
import {
    applyServerUpdate,
    handleEndGame,
    makeDrawFromDiscardFlight,
    normalizeTurn,
} from "@/state/machine/utilities";
import { convertServerCardToUICard } from "@/helpers/suitHelpers";

// -----------------------------
// Small helpers (pure + cheap)
// -----------------------------
type ServerCardPayload = { id: string; rank: any; suit: any; value: number };

const toUiCard = (c?: ServerCardPayload | null) => (c ? (convertServerCardToUICard(c as any) as any) : undefined);

const isMe = (state: RootState, stableId: string) => !!state.game.myPlayerId && state.game.myPlayerId === stableId;

function phaseFromStatus(status: string): RootState["game"]["phase"] {
    switch (status) {
        case "waiting":
            return "lobby";
        case "starting":
        case "playing":
            return "playing";
        case "roundEnded":
            return "roundEnded";
        case "gameEnded":
            return "gameOver";
        default:
            return "lobby";
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

            console.log('[SERVER_ACTION]', a.type, a.payload);

            switch (a.type) {
                // ============================================================
                // DISCARD - For syncing offset animation across all clients
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

                    console.log('[SERVER_ACTION] DISCARD FULL PAYLOAD:', {
                        actorId,
                        myId: state.game.myPlayerId,
                        topDiscardBefore: p.topDiscardBefore,
                        topDiscardAfter: p.topDiscardAfter,
                        currentGameTopDiscard: state.game.topDiscard,
                        cardCount: p.discardedCards?.length ?? p.cardIds?.length ?? 1,
                    });

                    // ✅ CRITICAL: Update game.topDiscard immediately from action payload
                    const nextGame = {
                        ...state.game,
                        topDiscard: p.topDiscardAfter ? toUiCard(p.topDiscardAfter) : state.game.topDiscard,
                        cardsDiscarded: (state.game.cardsDiscarded || 0) + (p.cardIds?.length ?? 1),
                    };

                    console.log('[SERVER_ACTION] Updated game.topDiscard immediately:', nextGame.topDiscard?.id);

                    // ✅ If opponent discards, create flight animations AND set offset card
                    if (!isMe(state, actorId)) {
                        console.log('==========================================');
                        console.log('[SERVER_ACTION] 🎴 OPPONENT DISCARD (BOT OR PLAYER)');
                        console.log('[SERVER_ACTION] Actor ID:', actorId);

                        const floatingCard = p.topDiscardAfter ? toUiCard(p.topDiscardAfter) : undefined;

                        // ✅ Try to get the previous card from payload, fallback to current state
                        let underCard: any;
                        if (p.topDiscardBefore) {
                            underCard = toUiCard(p.topDiscardBefore);
                            console.log('[SERVER_ACTION] Using topDiscardBefore from payload:', underCard?.id);
                        } else {
                            underCard = state.game.topDiscard;
                            console.log('[SERVER_ACTION] topDiscardBefore missing! Using current game top:', underCard?.id);
                        }

                        console.log('[SERVER_ACTION] Card setup:', {
                            underCard: underCard?.id,
                            floatingCard: floatingCard?.id,
                        });

                        // ✅ Create flight animations from opponent seat to discard pile
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
                            } as any);
                        }

                        const newPeekSeq = (state.ui.discardPeekSeq ?? 0) + 1;

                        console.log('[SERVER_ACTION] Setting offset card state:', {
                            flights: flights.length,
                            discardPeekX: 40,
                            discardPeekY: 20,
                            discardPeekRot: 25,
                            discardPeekSeq: newPeekSeq,
                            floatingCardId: floatingCard?.id,
                        });
                        console.log('==========================================');

                        return {
                            ...state,
                            game: nextGame, // ✅ Apply updated game state
                            ui: {
                                ...state.ui,
                                mode: "animating",
                                locks: { ...state.ui.locks, input: true },
                                flightSeq: seq,
                                flightQueue: [...state.ui.flightQueue, ...flights],

                                // Set up offset card (will be applied when flights land)
                                discardFloatingTop: floatingCard,
                                discardHold: true,
                                discardHoldTop: underCard,
                                discardHoldCount: state.game.cardsDiscarded,
                                discardPeekX: 40,
                                discardPeekY: 20,
                                discardPeekRot: 25,
                                discardPeekSeq: newPeekSeq,
                            },
                        };
                    }

                    // For our own discards, update game state but let INTENT_DISCARD_SELECTED handle flights
                    return { ...state, game: nextGame };
                }

                // ============================================================
                // DRAW FROM DISCARD
                // ============================================================
                case "DRAW_FROM_DISCARD": {
                    const p = a.payload as { playerId: string };
                    const actorId = p.playerId;

                    console.log('[SERVER_ACTION] DRAW_FROM_DISCARD', { actorId, myId: state.game.myPlayerId });

                    // Dispatch MY_DREW or OPPONENT_DREW
                    if (isMe(state, actorId)) {
                        console.log('[SERVER_ACTION] Dispatching MY_DREW (fromDiscard: true)');
                        return reducer(state, { type: "MY_DREW", fromDiscard: true } as any);
                    } else {
                        console.log('[SERVER_ACTION] Dispatching OPPONENT_DREW (fromDiscard: true)');
                        return reducer(state, { type: "OPPONENT_DREW", opponentId: actorId, fromDiscard: true } as any);
                    }
                }

                // ============================================================
                // DRAW FROM DECK
                // ============================================================
                case "DRAW_FROM_DECK": {
                    const p = a.payload as { playerId: string };
                    const actorId = p.playerId;

                    console.log('[SERVER_ACTION] DRAW_FROM_DECK', { actorId, myId: state.game.myPlayerId });

                    // Dispatch MY_DREW or OPPONENT_DREW
                    if (isMe(state, actorId)) {
                        console.log('[SERVER_ACTION] Dispatching MY_DREW (fromDiscard: false)');
                        return reducer(state, { type: "MY_DREW", fromDiscard: false } as any);
                    } else {
                        console.log('[SERVER_ACTION] Dispatching OPPONENT_DREW (fromDiscard: false)');
                        return reducer(state, { type: "OPPONENT_DREW", opponentId: actorId, fromDiscard: false } as any);
                    }
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

        case "MANDATORY_DRAW":
            return { ...state, game: { ...state.game, mandatoryDraw: ev.value } };

        // -----------------------------
        // Hand & opponents
        // -----------------------------
        case "HAND_UPDATED":
            return state.ui.endFlow ? state : { ...state, game: { ...state.game, playerCards: ev.cards } };

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

        // ✅ Opponent draw - trigger slide-back for all clients
        case "OPPONENT_DREW": {
            const drewFromDiscard = !!(ev as any).fromDiscard;

            console.log('[OPPONENT_DREW] Opponent drew', {
                opponentId: ev.opponentId,
                fromDiscard: drewFromDiscard,
            });

            // ✅ Create flight - ANIM_FLIGHT_DONE will trigger slide-back automatically
            const id = (state.ui.flightSeq ?? 0) + 1;

            const flight = drewFromDiscard
                ? makeDrawFromDiscardFlight(state, id, { seat: ev.opponentId })
                : ({
                    id,
                    kind: "draw",
                    from: "deck",
                    to: { seat: ev.opponentId },
                } as any);

            console.log('[OPPONENT_DREW] Creating flight', {
                flightId: id,
                from: drewFromDiscard ? 'discard' : 'deck',
            });

            return {
                ...state,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    locks: { ...state.ui.locks, input: true },
                    flightSeq: id,
                    flightQueue: [...state.ui.flightQueue, flight],
                },
            };
        }

        case "MY_DREW": {
            const drewFromDiscard = !!(ev as any).fromDiscard;

            console.log('[MY_DREW] Player drew', {
                fromDiscard: drewFromDiscard,
            });

            // ✅ Just update stats - ANIM_FLIGHT_DONE will trigger slide-back automatically
            return {
                ...state,
                game: {
                    ...state.game,
                    myDrawSeq: (state.game.myDrawSeq ?? 0) + 1,
                    myLastFromDiscard: drewFromDiscard,
                },
            };
        }

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

            // ✅ Create flight animation: deck/discard → hand
            const flight = isDiscard
                ? makeDrawFromDiscardFlight(state, id, "hand")
                : ({
                    id,
                    kind: "draw",
                    from: "deck",
                    to: "hand",
                } as any);

            return {
                ...state,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    locks: { ...state.ui.locks, input: true, draw: true },
                    flightSeq: id,
                    flightQueue: [...state.ui.flightQueue, flight],
                    stageCommitArmed: (state.ui.stagedCards?.length ?? 0) > 0 || state.ui.stageCommitArmed,
                    discardDrawHideTop: isDiscard ? true : state.ui.discardDrawHideTop,
                },
            };
        }
        //
        case "INTENT_DISCARD_SELECTED": {
            if (state.ui.locks.input || state.ui.locks.discard || !(ev as any).ids?.length) return state;

            const originById = new Map<string, DiscardOrigin>(
                (ev.origins ?? []).map(o => [o.id, o])
            );

            // Create discard flights for each selected card
            let seq = state.ui.flightSeq ?? 0;
            const flights: FlightRequest[] = [];

            for (const id of ev.ids) {
                const origin = originById.get(id);
                const card = state.game.playerCards.find(c => c.id === id);

                flights.push({
                    id: ++seq,
                    kind: "discard",
                    from: "hand",
                    to: "discard",
                    card: card,
                    fromRect: origin?.rect ?? null,
                } as any);
            }
            console.log("[INTENT_DISCARD_SELECTED] ",ev.ids);
            return {
                ...state,
                ui: {
                    ...state.ui,
                    mode: "animating",
                    selectedIds: [],
                    locks: { ...state.ui.locks, input: true, discard: true },
                    flightSeq: seq,
                    flightQueue: [...state.ui.flightQueue, ...flights],

                    // ✅ Freeze the current top card so pile doesn't change during animation
                    discardHold: true,
                    discardHoldTop: state.game.topDiscard,
                    discardHoldCount: state.game.cardsDiscarded,

                    // ✅ Clear any previous floating card when starting new discard
                    discardFloatingTop: undefined,
                    discardPeekX: 0,
                    discardPeekY: 0,
                    discardPeekRot: 0,
                },
            };
        }

        // Legacy / compatibility
        case "OPPONENT_DISCARDED": {
            const n = Math.max(1, (ev as any).count ?? 1);
            const cards = ((ev as any).cards ?? []) as any[];

            let seq = state.ui.flightSeq ?? 0;
            const flights: FlightRequest[] = [];
            for (let i = 0; i < n; i++) {
                flights.push({
                    id: ++seq,
                    kind: "discard",
                    from: { seat: (ev as any).opponentId },
                    to: "discard",
                    card: cards[i],
                } as any);
            }

            return {
                ...state,
                ui: { ...state.ui, flightSeq: seq, flightQueue: [...state.ui.flightQueue, ...flights] },
            };
        }

        case "CLAIM_RESULT": {
            const ui: any = state.ui;
            if (!ui.claimPending) return state;

            const shouldUnlock = !(ev as any).ok;
            return {
                ...state,
                ui: {
                    ...state.ui,
                    claimPending: false as any,
                    locks: shouldUnlock ? { ...state.ui.locks, input: false } : state.ui.locks,
                },
            };
        }

        case "INTENT_SHOUT_CLAIM": {
            if (!state.game.myPlayerId) return state;
            if (state.game.currentTurn !== state.game.myPlayerId) return state;
            if (state.ui.endFlow) return state;
            if (state.ui.locks.input) return state;
            if ((state.ui as any).claimPending) return state;

            return { ...state, ui: { ...state.ui, claimPending: true as any } };
        }

        // -----------------------------
        // Animations
        // -----------------------------
        case "ANIM_FLIGHT_DONE": {
            const head = state.ui.flightQueue[0];
            if (!head || head.id !== (ev as any).id) return state;

            const nextQueue = state.ui.flightQueue.slice(1);
            const nextSeq = state.ui.flightSeq ?? 0;

            let nextLocks = state.ui.locks;
            let nextMode = state.ui.mode;
            let nextUi = state.ui;

            const doneAnimating = nextQueue.length === 0;

            // ✨ Server-driven: only manage offset, server provides cards
            const isDiscardLanding = head.kind === "discard" && head.to === "discard";
            const isDrawStarting = head.kind === "draw";

            if (isDiscardLanding) {
                // When discard lands: set offset
                console.log('[ANIM_FLIGHT_DONE] 🎴 Discard landed, setting offset');

                nextUi = {
                    ...nextUi,
                    discardPile: {
                        offset: { x: 40, y: 20, rot: 25 },
                        offsetSeq: (nextUi.discardPile?.offsetSeq ?? 0) + 1,
                    },
                };

                // ✅ If this is OUR discard (from hand), track the card IDs for server call
                if (head.from === "hand") {
                    // Collect all pending discard card IDs from remaining flights + this one
                    const myDiscardFlights = [head, ...nextQueue].filter(
                        f => f.kind === "discard" && f.from === "hand" && f.to === "discard"
                    );

                    const cardIds = myDiscardFlights
                        .map(f => f.card?.id)
                        .filter(Boolean) as string[];

                    console.log('[ANIM_FLIGHT_DONE] My discard completed, need to send to server:', cardIds);

                    // Store in state so component can send to server
                    nextUi = {
                        ...nextUi,
                        discardPile: nextUi.discardPile,
                        pendingServerDiscard: cardIds, // ✨ NEW: Track what needs to be sent
                    };
                }
            }

            if (isDrawStarting) {
                // When draw starts: clear offset (slide-back)
                console.log('[ANIM_FLIGHT_DONE] 🎯 Draw starting, clearing offset');

                nextUi = {
                    ...nextUi,
                    discardPile: {
                        offset: { x: 0, y: 0, rot: 0 },
                        offsetSeq: (nextUi.discardPile?.offsetSeq ?? 0) + 1,
                    },
                };
            }

            if (doneAnimating) {
                nextMode = "idle";
                nextLocks = { ...nextLocks, input: false, discard: false, draw: false };
            }

            return {
                ...state,
                ui: {
                    ...nextUi,
                    flightSeq: nextSeq,
                    flightQueue: nextQueue,
                    mode: nextMode,
                    locks: nextLocks,
                },
            };
        }

        case "CLEAR_FLOATING_DISCARD":
            console.log('[CLEAR-FLOAT] Clearing floating discard card and releasing hold', {
                cardId: state.ui.discardFloatingTop?.id,
                hadHold: state.ui.discardHold,
                hasPending: !!state.ui.pendingTopDiscard,
            });

            // ✅ Release hold and apply any pending server updates now that animation is done
            let nextGame = state.game;
            if (state.ui.pendingTopDiscard !== undefined) {
                console.log('[CLEAR-FLOAT] Applying pending server updates', {
                    pendingTop: state.ui.pendingTopDiscard?.id,
                    pendingCount: state.ui.pendingDiscardCount,
                });
                nextGame = {
                    ...nextGame,
                    topDiscard: state.ui.pendingTopDiscard,
                    cardsDiscarded: state.ui.pendingDiscardCount ?? nextGame.cardsDiscarded,
                };
            }

            return {
                ...state,
                game: nextGame,
                ui: {
                    ...state.ui,
                    discardFloatingTop: undefined,
                    discardHold: false,
                    discardHoldTop: undefined,
                    discardHoldCount: undefined,
                    pendingTopDiscard: undefined,
                    pendingDiscardCount: undefined,
                }
            };

        // ✨ NEW: State-driven discard pile events
        case "DISCARD_LANDED": {
            const landedCard = ev.card ?? state.game.topDiscard;

            console.log('[DISCARD_LANDED] 🎴 Card landed on pile', {
                landedCard: landedCard?.id,
                settingOffset: { x: 40, y: 20, rot: 25 },
            });

            return {
                ...state,
                ui: {
                    ...state.ui,
                    discardPile: {
                        floatingCard: landedCard ?? null,
                        underCard: null, // ✅ Don't show under card
                        offset: { x: 40, y: 20, rot: 25 },
                        offsetSeq: (state.ui.discardPile.offsetSeq ?? 0) + 1,
                    },
                },
            };
        }

        case "DRAW_STARTED": {
            console.log('[DRAW_STARTED] 🎯 Starting slide-back animation');

            return {
                ...state,
                ui: {
                    ...state.ui,
                    discardPile: {
                        ...state.ui.discardPile,
                        offset: { x: 0, y: 0, rot: 0 },
                        offsetSeq: state.ui.discardPile.offsetSeq + 1,
                    },
                },
            };
        }

        case "OFFSET_SLIDE_COMPLETE": {
            console.log('[OFFSET_SLIDE_COMPLETE] ✅ Slide-back complete, clearing floating card');

            return {
                ...state,
                ui: {
                    ...state.ui,
                    discardPile: {
                        floatingCard: null,
                        underCard: null,
                        offset: { x: 0, y: 0, rot: 0 },
                        offsetSeq: state.ui.discardPile.offsetSeq,
                    },
                },
            };
        }

        default:
            return state;
    }
}