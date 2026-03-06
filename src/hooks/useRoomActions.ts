import { useCallback } from "react";
import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "../colyseus/state";

export function useRoomActions(room: Room<ClaimRoomState> | null) {
    const setReady = useCallback(() => {
        if (!room) return;
        room.send("playerReady"); // ✅ correct spelling
    }, [room]);

    const addTwoBots = useCallback(() => {
        // console.log(room);
        if (!room) return;

        room.send("addBot", { name: "Bot"+ Math.floor(100 + Math.random() * 900) });
        // room.send("addBot", { name: "Bot2" });
        // console.log("addTwoBots clicked!");
        // room.send("playerReady")
    }, [room]);
    const kickPlayer = useCallback(
        (playerId: string) => {
            if (!playerId) return;
            room?.send?.("kickPlayer", { playerId }); // stableId
        },
        [room]
    );

    return {
        setReady,
        addTwoBots,
        kickPlayer
    };
}
