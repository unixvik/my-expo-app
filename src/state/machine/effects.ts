// src/state/machine/effects.ts
import type { Event, RootState } from "./types";
import type { DispatchMeta } from "./store";

export type Effect =
    | { type: "ROOM_SEND"; name: string; payload?: any }
    | { type: "SFX"; name: string }
    | { type: "ANIM"; name: string; payload?: any }
    | { type: "NONE" };

function rejectIfNotAccepted(meta: DispatchMeta): Effect[] {
    // ✅ "accepted" means the reducer actually changed state
    // (ignores eventLog mutations)
    return meta.reducedChanged ? [] : [{ type: "NONE" }];
}

export function effectsFor(ev: Event, _prev: RootState, _next: RootState, meta: DispatchMeta): Effect[] {
    switch (ev.type) {
        case "INTENT_DRAW_FROM_DECK": {
            const rej = rejectIfNotAccepted(meta);
            if (rej.length) return rej;

            return [
                { type: "ROOM_SEND", name: "drawCard", payload: { fromDiscard: false } },
                { type: "SFX", name: "draw" },
            ];
        }

        case "INTENT_DRAW_FROM_DISCARD": {
            const rej = rejectIfNotAccepted(meta);
            if (rej.length) return rej;

            return [
                { type: "ROOM_SEND", name: "drawCard", payload: { fromDiscard: true } },
                { type: "SFX", name: "draw" },
            ];
        }

        case "INTENT_DISCARD_SELECTED": {
            const rej = rejectIfNotAccepted(meta);
            if (rej.length) return rej;

            return [
                { type: "ROOM_SEND", name: "discardCards", payload: { cardIds: ev.ids } },
                { type: "SFX", name: "discard" },
            ];
        }

        case "INTENT_SHOUT_CLAIM": {

            return [
                { type: "ROOM_SEND", name: "shoutClaim" },
                { type: "SFX", name: "claim" },
            ];
        }

        case "ROUND_ENDED_CLOSED": {
            const rej = rejectIfNotAccepted(meta);
            if (rej.length) return rej;

            return [
                { type: "ROOM_SEND", name: "playerReady" },
                { type: "SFX", name: "claim" },
            ];
        }

        default:
            return [{ type: "NONE" }];
    }
}