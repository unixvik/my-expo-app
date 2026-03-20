import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@colyseus/sdk";
import { CloseCode } from "@colyseus/sdk";
import { client } from "@/api/client";
import type { ClaimRoomState } from "@/colyseus/state";
import { useGameStore } from "@/state/useGameStore";

import { attachStateSync } from "@/api/stateSync";
import { attachMessageQueue } from "@/api/messageQueue";
import { getOrCreatePlayerKey, getStoredName, saveStoredName } from "@/utils/playerKey";
import { sessionTag } from "@/utils/helpers";

// 🌟 Import the centralized room setter
import { setGlobalRoom } from "@/api/roomInstance";

const ROOM_NAME = "claim_room";

type LeaveReason = "intentional" | "remote" | "error";

export function useRoomConnection() {
    const roomRef = useRef<Room<ClaimRoomState> | null>(null);
    const [room, setRoom] = useState<Room<ClaimRoomState> | null>(null);

    // 🌟 FIX: Moved connectingRef inside the hook so it functions as a proper lock
    const connectingRef = useRef(false);

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
                    setGlobalRoom(reconnected); // 🌟 Keep global instance synced
                    setConn({ status: "connected", roomId: reconnected.roomId, sessionId: reconnected.sessionId });

                    setupRoom(reconnected);
                    bindRoomEvents(reconnected, myAttempt);
                })
                .catch((err) => {
                    roomRef.current = null;
                    setRoom(null);
                    setGlobalRoom(null); // 🌟 Nuke global on error
                    setConn({ status: "error", message: err instanceof Error ? err.message : "Reconnect failed" });
                });
        });

        r.onLeave((code: number) => {
            if (roomRef.current !== r) return;
            const reason = leaveReasonRef.current;

            roomRef.current = null;
            setRoom(null);
            setGlobalRoom(null); // 🌟 Nuke global on leave

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

        connectingRef.current = true; // Lock connection attempts
        const myAttempt = ++attemptRef.current;
        setConn({ status: "connecting" });

        try {
            const playerKey = await getOrCreatePlayerKey();

            let name = await getStoredName();
            if (!name) {
                name = `Vik-${sessionTag()}`;
                await saveStoredName(name);
            }

            const nextRoom = await client.joinOrCreate<ClaimRoomState>(ROOM_NAME, {
                name: name,
                // playerKey: playerKey,
                customName: "ROOM_1234"
            });

            if (attemptRef.current !== myAttempt || roomRef.current) {
                nextRoom.leave();
                return;
            }

            roomRef.current = nextRoom;
            setRoom(nextRoom);
            setGlobalRoom(nextRoom); // 🌟 Register safely with the global scope

            setConn({ status: "connected", roomId: nextRoom.roomId, sessionId: nextRoom.sessionId });
            setPlayerKey(playerKey);
            setupRoom(nextRoom);
            bindRoomEvents(nextRoom, myAttempt);
        } catch (err) {
            setConn({ status: "error", message: err instanceof Error ? err.message : "Failed to connect" });
        } finally {
            connectingRef.current = false; // Unlock connection attempts
        }
    }, [setConn, setupRoom, bindRoomEvents, setPlayerKey]);

    const disconnect = useCallback(() => {
        attemptRef.current++;
        leaveReasonRef.current = "intentional";

        const r = roomRef.current;
        roomRef.current = null;
        setRoom(null);
        setGlobalRoom(null); // 🌟 Instantly severe global communication

        if (r) {
            console.log("Cleaning up room connection...");
            r.removeAllListeners();
            r.leave(true);
        }

        resetStore();
    }, [resetStore]);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { conn, room, connect, disconnect };
}