// src/state/machine/store.ts

import type { Event, RootState } from "./types";
import { reducer } from "./reducer";

export type DispatchMeta = {
    type: string;
    at: number;
    noisy: boolean;
    reducedChanged: boolean; // ✅ did reducer change state (ignores eventLog mutation)
    didLog: boolean;         // ✅ did we write to eventLog/lastEvent
};

export type DispatchResult = {
    prev: RootState;
    next: RootState;
    meta: DispatchMeta;
};

export type MachineStore = {
    getState: () => RootState;
    subscribe: (listener: () => void) => () => void;

    // ✅ returns prev/next + meta so effects can be correct
    dispatch: (ev: Event) => DispatchResult;

    setState: (next: RootState) => void;
};

const MAX_LOG = 200;
const NOISY = new Set(["SERVER_SNAPSHOT", "SERVER_PATCH"]);

const getEventType = (e: any) =>
    e.type === "MESSAGE" || e.type === "SERVER_MESSAGE"
        ? (e.message?.type || e.messageType || e.name || "MESSAGE")
        : e.type || "UNKNOWN";

export function createMachineStore(initial: RootState): MachineStore {
    let state = initial;
    const listeners = new Set<() => void>();

    const notify = () => listeners.forEach((l) => l());

    return {
        getState: () => state,

        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        setState: (next) => {
            if (next !== state) {
                state = next;
                notify();
            }
        },

        dispatch: (ev) => {
            const at = Date.now();
            const type = getEventType(ev);
            const noisy = NOISY.has(type);

            const prev = state;

            // 1) Log event (skip noisy)
            let didLog = false;
            if (!noisy) {
                didLog = true;
                const log = [...(state.ui.eventLog ?? []), { type, at }];
                state = {
                    ...state,
                    ui: {
                        ...state.ui,
                        lastEvent: { type, at },
                        eventLog: log.slice(-MAX_LOG),
                    },
                };
            }

            const beforeReduce = state;

            // 2) Reduce
            const reduced = reducer(beforeReduce, ev);
            const reducedChanged = reduced !== beforeReduce;

            if (reducedChanged) {
                state = reduced;
            }

            // ✅ Notify if *either* logging changed state *or* reducer changed state
            if (didLog || reducedChanged) notify();

            return {
                prev,
                next: state,
                meta: {
                    type,
                    at,
                    noisy,
                    didLog,
                    reducedChanged,
                },
            };
        },
    };
}