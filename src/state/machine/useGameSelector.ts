// src/state/machine/useGameSelector.ts
import { useRef, useSyncExternalStore } from "react";
import type { RootState } from "./types";
import { useGameContext } from "./GameProvider";

type EqualityFn<T> = (a: T, b: T) => boolean;

export function shallowEqual(a: any, b: any) {
    if (Object.is(a, b)) return true;
    if (typeof a !== "object" || !a || typeof b !== "object" || !b) return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
        if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false;
    }
    return true;
}

export function useGameSelector<T>(
    selector: (s: RootState) => T,
    equalityFn: EqualityFn<T> = Object.is
): T {
    const { store } = useGameContext();

    const selectorRef = useRef(selector);
    const eqRef = useRef(equalityFn);
    selectorRef.current = selector;
    eqRef.current = equalityFn;

    // Cache BOTH state reference and selected value
    const lastStateRef = useRef<RootState>(store.getState());
    const lastSelectedRef = useRef<T>(selectorRef.current(lastStateRef.current));

    const getSnapshot = () => {
        const state = store.getState();

        // ✅ Critical: if state object is identical, return stable selected value
        if (Object.is(state, lastStateRef.current)) {
            return lastSelectedRef.current;
        }

        lastStateRef.current = state;

        const next = selectorRef.current(state);
        const prev = lastSelectedRef.current;

        if (!eqRef.current(prev, next)) {
            lastSelectedRef.current = next;
        }

        return lastSelectedRef.current;
    };

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}