// src/state/machine/actions.ts
import type { Event } from "./types";

export const actions = {
    drawDeck: (): Event => ({ type: "INTENT_DRAW_FROM_DECK"}),
    drawDiscard: (): Event => ({ type: "INTENT_DRAW_FROM_DISCARD" }),
    claim: (): Event => ({ type: "INTENT_SHOUT_CLAIM" }),
    revealDone: (): Event => ({ type: "CLAIM_REVEAL_DONE" }),
    closeRoundEnded: (): Event => ({ type: "ROUND_ENDED_CLOSED" }),
    discard: (ids: string[], origins?: any): Event => ({ type: "INTENT_DISCARD_SELECTED", ids, origins }),
    myDrew: (fromDiscard: boolean) => ({ type: "MY_DREW" as const, fromDiscard }),
    opponentDrew: (opponentId: string, fromDiscard: boolean) => ({
        type: "OPPONENT_DREW" as const,
        opponentId,
        fromDiscard,
    }),
    animFlightDone: (id: number) => ({ type: "ANIM_FLIGHT_DONE" as const, id }),
};
