// src/state/machine/useMachine.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { initialState } from "./initial";
import { effectsFor, type Effect } from "./effects";
import type { Event } from "./types";
import { bindRoom } from "./colyseusBindings";
import { createMachineStore, type MachineStore } from "./store";

type MachineDeps = {
    room?: any;
    myStableId?: string | null;
    runAnim?: (name: string, payload?: any) => void;
    playSfx?: (name: string) => void;
};

export function useGameMachine(sessionId: string, deps: MachineDeps) {
    const depsRef = useRef(deps);
    depsRef.current = deps;

    // Store is stable per sessionId; recreated only when sessionId changes
    const store: MachineStore = useMemo(
        () => createMachineStore(initialState(sessionId || "temp")),
        [sessionId]
    );

    const dispatch = useCallback(
        (ev: Event) => {
            const res = store.dispatch(ev);
            const d = depsRef.current;

            const fx = effectsFor(ev, res.prev, res.next, res.meta) as Effect[];

            for (const e of fx) {
                switch (e.type) {
                    case "NONE":
                        break;

                    case "ROOM_SEND":
                        d.room?.send?.(e.name, e.payload);
                        break;

                    case "ANIM":
                        d.runAnim?.(e.name, e.payload);
                        break;

                    case "SFX":
                        d.playSfx?.(e.name);
                        break;
                }
            }
        },
        [store]
    );

    // Bind once per room instance (don’t wait for stableId)
    useEffect(() => {
        const room = deps.room;
        if (!room) return;

        const unbind = bindRoom(
            room,
            { sessionId: room.sessionId, playerId: null },
            store.dispatch // ✅ server events go through store only
        );

        return () => {
            try {
                unbind?.();
            } catch {}
        };
    }, [deps.room, store]);

    return useMemo(() => ({ store, dispatch }), [store, dispatch]);
}