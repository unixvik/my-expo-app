// src/state/machine/GameProvider.tsx
import React, { createContext, useContext } from "react";
import type { Event } from "./types";
import type { MachineStore } from "./store";

export type MachineApi = {
    store: MachineStore;
    dispatch: (ev: Event) => void;
};

const GameContext = createContext<MachineApi | null>(null);

export function GameProvider({
                                 value,
                                 children,
                             }: {
    value: MachineApi;
    children: React.ReactNode;
}) {
    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGameContext must be used inside <GameProvider>");
    return ctx;
}
