// src/hooks/useGameMessages.ts
import { useEffect, useRef, useState, useCallback } from "react";
import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "@/colyseus/state";
import type { PlayerJoinEvent, GameEndData } from "@/types/types";

const NOTIFICATION_DURATION_MS = 3000;

type GameStatus = "waiting" | "starting" | "playing" | "ended";

type PlayerEventPayload = {
    id?: string;
    sessionId?: string;
    name: string;
};

function normalizePlayerPayload(data: PlayerEventPayload) {
    return {
        id: typeof data.id === "string" ? data.id : undefined,
        sessionId: typeof data.sessionId === "string" ? data.sessionId : undefined,
        name: data.name ?? "Unknown",
    };
}

export function useGameMessages(room: Room<ClaimRoomState> | null) {
    const [playerJoinEvents, setPlayerJoinEvents] = useState<PlayerJoinEvent[]>([]);
    const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);

    const [status, setStatus] = useState<GameStatus>("waiting");
    const [countdown, setCountdown] = useState<number>(0);

    const [resetRequested, setResetRequested] = useState<boolean>(false);
    const clearResetRequested = useCallback(() => setResetRequested(false), []);

    const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    const addNotification = useCallback((event: PlayerJoinEvent) => {
        setPlayerJoinEvents((prev) => [...prev, event]);

        const t = setTimeout(() => {
            setPlayerJoinEvents((prev) => prev.filter((e) => e.timestamp !== event.timestamp));
            timeoutsRef.current.delete(t);
        }, NOTIFICATION_DURATION_MS);

        timeoutsRef.current.add(t);
    }, []);

    useEffect(() => {
        if (!room) return;

        const off: Array<() => void> = [];
        const pushOff = (maybeOff: any) => {
            if (typeof maybeOff === "function") off.push(maybeOff);
        };

        pushOff(
            room.onMessage("playerJoined", (data: PlayerEventPayload) => {
                const p = normalizePlayerPayload(data);
                addNotification({
                    type: "join",
                    sessionId: p.sessionId ?? "",
                    name: p.name,
                    timestamp: Date.now(),
                    ...(p.id ? { id: p.id } : {}),
                } as any);
            })
        );

        pushOff(
            room.onMessage("playerLeft", (data: PlayerEventPayload) => {
                const p = normalizePlayerPayload(data);
                addNotification({
                    type: "leave",
                    sessionId: p.sessionId ?? "",
                    name: p.name,
                    timestamp: Date.now(),
                    ...(p.id ? { id: p.id } : {}),
                } as any);
            })
        );

        pushOff(
            room.onMessage("playerDiscarded", (data: PlayerEventPayload) => {
                const p = normalizePlayerPayload(data);
                addNotification({
                    type: "discard",
                    sessionId: p.sessionId ?? "",
                    name: p.name,
                    timestamp: Date.now(),
                    ...(p.id ? { id: p.id } : {}),
                } as any);
            })
        );

        pushOff(
            room.onMessage("playerKicked", (data: PlayerEventPayload) => {
                const p = normalizePlayerPayload(data);
                addNotification({
                    type: "leave",
                    sessionId: p.sessionId ?? "",
                    name: `${p.name} (kicked)`,
                    timestamp: Date.now(),
                    ...(p.id ? { id: p.id } : {}),
                } as any);
            })
        );

        pushOff(
            room.onMessage("gameStarting", (data: { countdown: number }) => {
                setStatus("starting");
                setCountdown(data?.countdown ?? 0);
            })
        );

        pushOff(room.onMessage("countdown", (data: { countdown: number }) => setCountdown(data?.countdown ?? 0)));

        pushOff(
            room.onMessage("gameStarted", () => {
                setStatus("playing");
                setCountdown(0);
            })
        );

        pushOff(
            room.onMessage("gameEnded", (data: GameEndData) => {
                setGameEndData(data);
                setStatus("ended");
            })
        );

        pushOff(
            room.onMessage("rematchReady", () => {
                setGameEndData(null);
                setStatus("waiting");
                setCountdown(0);
            })
        );

        pushOff(room.onMessage("roomReset", () => setResetRequested(true)));

        return () => {
            off.forEach((fn) => {
                try {
                    fn();
                } catch {}
            });
            timeoutsRef.current.forEach((t) => clearTimeout(t));
            timeoutsRef.current.clear();
        };
    }, [room, addNotification]);

    return {
        playerJoinEvents,
        gameEndData,
        status,
        countdown,
        resetRequested,
        clearResetRequested,
    };
}