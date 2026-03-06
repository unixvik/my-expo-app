// src/state/machine/reducer.ts

import type { RootState, Event, FlightRequest } from "./types";
import {
    applyServerUpdate,
    handleEndGame,
    makeDrawFromDiscardFlight,
    normalizeTurn,
} from "@/state/machine/utilities";

import { convertServerCardToUICard } from "@/helpers/suitHelpers";

type ServerCardPayload = {
    id: string
    rank: any
    suit: any
    value: number
}

const toUiCard = (c?: ServerCardPayload | null) =>
    c ? (convertServerCardToUICard(c as any) as any) : undefined

const isMe = (state: RootState, stableId: string) =>
    !!state.game.myPlayerId && state.game.myPlayerId === stableId

const nextFlightId = (state: RootState) => (state.ui.flightSeq ?? 0) + 1

function phaseFromStatus(status: string): RootState["game"]["phase"] {
    switch (status) {
        case "waiting":
            return "lobby"
        case "starting":
        case "playing":
            return "playing"
        case "roundEnded":
            return "roundEnded"
        case "gameEnded":
            return "gameOver"
        default:
            return "lobby"
    }
}

export function reducer(state: RootState, ev: Event): RootState {

    switch (ev.type) {

        case "BOOT":
            return {
                ...state,
                game: {
                    ...state.game,
                    sessionId: ev.sessionId,
                    phase: "lobby"
                }
            }

        case "SET_THEME":
            return {
                ...state,
                ui: { ...state.ui, themeId: ev.themeId }
            }

        case "YOU_ARE":
            return {
                ...state,
                game: { ...state.game, myPlayerId: ev.stableId }
            }

        case "SERVER_SNAPSHOT": {

            const snapshot = (ev.snapshot ?? {}) as any
            const merged = { ...state.game, ...snapshot }

            const game = normalizeTurn(merged, { allowDerive: false })

            return applyServerUpdate(state, game, snapshot)
        }

        case "SERVER_PATCH": {

            const patch = (ev.patch ?? {}) as any

            return applyServerUpdate(
                state,
                { ...state.game, ...patch },
                patch
            )
        }

        case "SERVER_ACTION": {

            const a = (ev as any).action
            if (!a?.type || !a?.payload) return state

            switch (a.type) {

                // -------------------------------------
                // DISCARD
                // -------------------------------------

                case "DISCARD": {

                    const p = a.payload
                    const actorId = p.playerId

                    const nextGame = {
                        ...state.game,
                        topDiscard: p.topDiscardAfter
                            ? toUiCard(p.topDiscardAfter)
                            : state.game.topDiscard,

                        cardsDiscarded:
                            (state.game.cardsDiscarded || 0) +
                            (p.cardIds?.length ?? 1)
                    }

                    if (!isMe(state, actorId)) {

                        const floatingCard = p.topDiscardAfter
                            ? toUiCard(p.topDiscardAfter)
                            : undefined

                        const underCard =
                            p.topDiscardBefore
                                ? toUiCard(p.topDiscardBefore)
                                : state.game.topDiscard

                        const cards =
                            (p.discardedCards ?? [])
                                .map(toUiCard)
                                .filter(Boolean)

                        const n =
                            Math.max(
                                1,
                                cards.length ||
                                (p.cardIds?.length ?? 0) ||
                                1
                            )

                        let seq = state.ui.flightSeq ?? 0
                        const flights: FlightRequest[] = []

                        for (let i = 0; i < n; i++) {

                            flights.push({
                                id: ++seq,
                                kind: "discard",
                                from: { seat: actorId },
                                to: "discard",
                                card: cards[i]
                            } as any)

                        }

                        const newPeekSeq =
                            (state.ui.discardPeekSeq ?? 0) + 1

                        return {
                            ...state,

                            game: nextGame,

                            ui: {
                                ...state.ui,

                                mode: "animating",

                                locks: {
                                    ...state.ui.locks,
                                    input: true
                                },

                                flightSeq: seq,

                                flightQueue: [
                                    ...state.ui.flightQueue,
                                    ...flights
                                ],

                                discardFloatingTop: floatingCard,

                                discardHold: true,

                                discardHoldTop: underCard,

                                discardHoldCount: state.game.cardsDiscarded,

                                discardPeekX: 40,
                                discardPeekY: 20,
                                discardPeekRot: 25,
                                discardPeekSeq: newPeekSeq
                            }
                        }

                    }

                    return {
                        ...state,
                        game: nextGame
                    }

                }

                // -------------------------------------
                // DRAW
                // -------------------------------------

                case "DRAW_FROM_DISCARD":
                case "DRAW_FROM_DECK": {

                    const actorId = a.payload.playerId
                    const fromDiscard =
                        a.type === "DRAW_FROM_DISCARD"

                    if (isMe(state, actorId)) {

                        return {
                            ...state,
                            game: {
                                ...state.game,
                                myDrawSeq:
                                    (state.game.myDrawSeq ?? 0) + 1,

                                myLastFromDiscard: fromDiscard
                            }
                        }

                    }

                    const id = nextFlightId(state)

                    const flight =
                        fromDiscard
                            ? makeDrawFromDiscardFlight(
                                state,
                                id,
                                { seat: actorId }
                            )
                            : {
                                id,
                                kind: "draw",
                                from: "deck",
                                to: { seat: actorId }
                            }

                    return {
                        ...state,

                        ui: {

                            ...state.ui,

                            mode: "animating",

                            locks: {
                                ...state.ui.locks,
                                input: true
                            },

                            flightSeq: id,

                            flightQueue: [
                                ...state.ui.flightQueue,
                                flight
                            ]
                        }
                    }

                }

                default:
                    return state

            }

        }

        case "HAND_UPDATED":

            if (state.ui.endFlow) return state

            return {
                ...state,
                game: {
                    ...state.game,
                    playerCards: ev.cards
                }
            }

        case "OPPONENT_UPDATED": {

            const exists =
                state.game.opponents.some(
                    o => o.id === ev.opponent.id
                )

            const opponents =
                exists
                    ? state.game.opponents.map(o =>
                        o.id === ev.opponent.id
                            ? { ...o, ...ev.opponent }
                            : o
                    )
                    : [
                        ...state.game.opponents,
                        ev.opponent
                    ]

            return {
                ...state,
                game: {
                    ...state.game,
                    opponents
                }
            }

        }

        case "UI_SELECT_TOGGLE": {

            const selected =
                state.ui.selectedIds.includes(ev.id)
                    ? state.ui.selectedIds.filter(
                        x => x !== ev.id
                    )
                    : [
                        ...state.ui.selectedIds,
                        ev.id
                    ]

            return {
                ...state,
                ui: {
                    ...state.ui,
                    selectedIds: selected
                }
            }

        }

        case "ROUND_ENDED":
            return handleEndGame(
                state,
                ev.payload,
                "round"
            )

        case "GAME_ENDED":
            return handleEndGame(
                state,
                ev.payload,
                "game"
            )

        default:
            return state
    }

}