// src/hooks/useRoomConnection.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@colyseus/sdk";
import { CloseCode } from "@colyseus/sdk";
import { client } from "@/colyseus/client";
import type { ClaimRoomState } from "@/colyseus/state";
import { getOrCreatePlayerKey } from "@/utils/playerKey";
import { useGameMessages } from "./useGameMessages"; // ✅ RELATIVE to avoid duplicate module resolution

const ROOM_NAME = "claim_room";

function sessionTag() {
    return Math.random().toString(36).slice(2, 10);
}

type ConnState =
    | { status: "idle" }
    | { status: "connecting" }
    | { status: "reconnecting"; roomId: string; sessionId: string }
    | { status: "connected"; roomId: string; sessionId: string }
    | { status: "error"; message: string };

type LeaveReason = "intentional" | "remote" | "error";

export function useRoomConnection() {
    // TEMP DEBUG (remove after 1 run):
    // If you don't see this log, you're not running this file.
    // eslint-disable-next-line no-console


    const roomRef = useRef<Room<ClaimRoomState> | null>(null);
    const [room, setRoom] = useState<Room<ClaimRoomState> | null>(null);
    const [conn, setConn] = useState<ConnState>({ status: "idle" });
    // console.log("RAW PLAYERS SNAPSHOT", room?.state.players);
    const connectingRef = useRef<Promise<Room<ClaimRoomState> | null> | null>(null);
    const attemptRef = useRef(0);
    const leaveReasonRef = useRef<LeaveReason>("remote");
    const bindRoomEvents = useCallback((r: Room<ClaimRoomState>, myAttempt: number) => {
        r.onDrop?.(() => {
            if (roomRef.current !== r) return; // ✅ stale instance guard
            if (attemptRef.current !== myAttempt) return;

            setConn({ status: "reconnecting", roomId: r.roomId, sessionId: r.sessionId });

            client
                .reconnect<ClaimRoomState>(r.roomId, r.sessionId)
                .then((reconnected) => {
                    if (attemptRef.current !== myAttempt) {
                        try {
                            reconnected.leave();
                        } catch {}
                        return;
                    }

                    roomRef.current = reconnected;
                    setRoom(reconnected);

                    setConn({
                        status: "connected",
                        roomId: reconnected.roomId,
                        sessionId: reconnected.sessionId,
                    });

                    bindRoomEvents(reconnected, myAttempt);
                })
                .catch((err) => {
                    roomRef.current = null;
                    setRoom(null);

                    const msg = err instanceof Error ? err.message : "Reconnect failed";
                    setConn({ status: "error", message: msg });
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

            const failedToReconnect =
                (CloseCode as any)?.FAILED_TO_RECONNECT != null &&
                code === (CloseCode as any).FAILED_TO_RECONNECT;

            if (failedToReconnect) {
                setConn({ status: "error", message: "Failed to reconnect." });
                return;
            }

            setConn({ status: "error", message: `Left room (code ${code})` });
        });
    }, []);

    const connect = useCallback(async (): Promise<Room<ClaimRoomState> | null> => {
        if (roomRef.current) return roomRef.current;
        if (connectingRef.current) return connectingRef.current;

        const myAttempt = ++attemptRef.current;
        leaveReasonRef.current = "remote";
        setConn({ status: "connecting" });

        connectingRef.current = (async () => {
            try {
                const playerKey = await getOrCreatePlayerKey();
                const tag = sessionTag();

                const nextRoom = await client.joinOrCreate<ClaimRoomState>(ROOM_NAME, {
                    name: `Vik-${tag}`,
                    playerKey,
                });

                // stale attempt or already connected
                if (attemptRef.current !== myAttempt || roomRef.current) {
                    try {
                        nextRoom.leave();
                    } catch {}
                    return null;
                }

                roomRef.current = nextRoom;
                setRoom(nextRoom);

                setConn({
                    status: "connected",
                    roomId: nextRoom.roomId,
                    sessionId: nextRoom.sessionId,
                });

                bindRoomEvents(nextRoom, myAttempt);
                return nextRoom;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to connect";
                roomRef.current = null;
                setRoom(null);
                setConn({ status: "error", message: msg });
                return null;
            } finally {
                connectingRef.current = null;
            }
        })();

        return connectingRef.current;
    }, [bindRoomEvents]);

    const disconnect = useCallback(() => {
        attemptRef.current++; // invalidate in-flight reconnect
        connectingRef.current = null;
        leaveReasonRef.current = "intentional";

        const r = roomRef.current;
        roomRef.current = null;

        setRoom(null);
        setConn({ status: "idle" });

        try {
            r?.leave();
        } catch {}
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    const gameMsgs = useGameMessages(room);

    return {
        conn,
        room,
        roomRef,
        connect,
        disconnect,
        ...gameMsgs,
    };
}