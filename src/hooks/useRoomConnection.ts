// src/hooks/useRoomConnection.ts

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@colyseus/sdk";
import { CloseCode } from "@colyseus/sdk";
import { client } from "@/api/client";
import type { ClaimRoomState } from "@/colyseus/state";
import { useGameStore } from "@/state/useGameStore";

import { attachStateSync } from "@/api/stateSync";
import { attachMessageQueue } from "@/api/messageQueue";
import {getOrCreatePlayerKey, getStoredName, saveStoredName} from "@/utils/playerKey";
import {sessionTag} from "@/utils/helpers";

import { setGlobalRoom } from "@/api/roomInstance";

const ROOM_NAME = "claim_room";

// function sessionTag() {
//     return Math.random().toString(36).slice(2, 10);
// }

type LeaveReason = "intentional" | "remote" | "error";


export let globalRoom: Room<ClaimRoomState> | null = null;

export function useRoomConnection() {
    const roomRef = useRef<Room<ClaimRoomState> | null>(null);
    const [room, setRoom] = useState<Room<ClaimRoomState> | null>(null);

    // Store Actions
    const setConn = useGameStore((s) => s.setConn);
    const setPlayerKey = useGameStore((s)=> s.setPlayerKey);
    const setInitialSync = useGameStore((s) => s.setInitialSync);
    const resetStore = useGameStore((s) => s.resetStore);
    const conn = useGameStore((s) => s.conn);

    const attemptRef = useRef(0);
    const leaveReasonRef = useRef<LeaveReason>("remote");

    const setupRoom = useCallback((nextRoom: Room<ClaimRoomState>) => {
        // 1. Initial Hydration: Only set synced once the first state arrives
        nextRoom.onStateChange.once(() => {
            setInitialSync(true);
        });

        // 2. Attach Listeners
        attachStateSync(nextRoom);
        attachMessageQueue(nextRoom);
    }, [setInitialSync]);

    const bindRoomEvents = useCallback((r: Room<ClaimRoomState>, myAttempt: number) => {
        r.onDrop?.(() => {
            if (roomRef.current !== r || attemptRef.current !== myAttempt) return;

            setConn({ status: "reconnecting", roomId: r.roomId, sessionId: r.sessionId });

            // @ts-ignore
            client.reconnect<ClaimRoomState>(r.roomId, r.sessionId)
                .then((reconnected) => {
                    if (attemptRef.current !== myAttempt) {
                        try { reconnected.leave(); } catch {}
                        return;
                    }
                    roomRef.current = reconnected;
                    setRoom(reconnected);
                    setConn({ status: "connected", roomId: reconnected.roomId, sessionId: reconnected.sessionId });

                    setupRoom(reconnected);
                    bindRoomEvents(reconnected, myAttempt);
                })
                .catch((err) => {
                    roomRef.current = null;
                    setRoom(null);
                    setConn({ status: "error", message: err instanceof Error ? err.message : "Reconnect failed" });
                });
        });

        r.onLeave((code: number) => {
            if (roomRef.current !== r) return;
            const reason = leaveReasonRef.current;
            roomRef.current = null;
            setRoom(null);

            if (reason === "intentional") {
                setConn({ status: "idle" });
                return;
            }

            const failedToReconnect = (CloseCode as any)?.FAILED_TO_RECONNECT != null && code === (CloseCode as any).FAILED_TO_RECONNECT;
            setConn({ status: "error", message: failedToReconnect ? "Failed to reconnect." : `Left room (code ${code})` });
        });
    }, [setConn, setupRoom]);

    const connect = useCallback(async () => {
        if (roomRef.current || connectingRef.current) return;

        const myAttempt = ++attemptRef.current;
        setConn({ status: "connecting" });

        try {
            // 1. Get the persistent key
            const playerKey = await getOrCreatePlayerKey();

            // 🌟 Check if we have a name, otherwise use a stable one
            let name = await getStoredName();
            if (!name) {
                name = `Vik-${sessionTag()}`; // Only create the tag ONCE in the app's lifetime
                await saveStoredName(name);
            }

            // 2. Pass it to the server in the options object
            const nextRoom = await client.joinOrCreate<ClaimRoomState>(ROOM_NAME, {
                name: name, // 🌟 Now this is stable across refreshes!
                // playerKey: playerKey,
                customName: "ROOM_123"
            });

            if (attemptRef.current !== myAttempt || roomRef.current) {
                nextRoom.leave();
                return;
            }

            roomRef.current = nextRoom;
            // 🌟 Use the setter instead of the local variable
            setGlobalRoom(nextRoom);

            // Success logic...
            setConn({ status: "connected", roomId: nextRoom.roomId, sessionId: nextRoom.sessionId });
            setPlayerKey(playerKey);
            setupRoom(nextRoom);
            bindRoomEvents(nextRoom, myAttempt);
        } catch (err) {
            setConn({ status: "error", message: err instanceof Error ? err.message : "Failed to connect" });
        }
    }, [setConn, setupRoom, bindRoomEvents]);

    const disconnect = useCallback(() => {
        attemptRef.current++;
        leaveReasonRef.current = "intentional";

        const r = roomRef.current;
        roomRef.current = null;

        // 🌟 Force immediate cleanup
        if (r) {
            console.log("Cleaning up room connection...");
            r.removeAllListeners(); // Stop state updates from hitting the store
            r.leave(true); // 'true' tells Colyseus to consent to immediate removal
        }

        setRoom(null);
        resetStore();
    }, [resetStore]);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { conn, room, connect, disconnect };
}

const connectingRef = { current: null as any }; // Internal guard for hook