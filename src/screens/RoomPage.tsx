import React, { memo, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useRoomActions } from "@/hooks/useRoomActions";

import { Lobby } from "@/screens/Lobby";
import { PlayArea } from "@/screens/PlayArea";

import { useGameMachine } from "@/state/machine/useMachine";
import { GameProvider } from "@/state/machine/GameProvider";
import { useGameSelector } from "@/state/machine/useGameSelector";
import { ThemeProvider } from "@/theme/ThemeProvider";

import { selectThemeId } from "@/state/machine/selector";

const RoomContent = memo(function RoomContent({
                                                  room,
                                                  conn,
                                                  disconnect,
                                                  playerJoinEvents,
                                              }: any) {

    const phase = useGameSelector((s) => s.game.phase);
    const gameStatus = useGameSelector((s) => s.game.gameStatus);
    const themeId = useGameSelector(selectThemeId);
    const navIntent = useGameSelector((s) => s.ui.navIntent);

    const { addTwoBots, setReady, kickPlayer } = useRoomActions(room);

    // ✅ EXIT EFFECT
    useEffect(() => {
        if (navIntent === "lobby") {
            disconnect(); // leave room cleanly
        }
    }, [navIntent, disconnect]);

    const inLobby = phase === "lobby" || gameStatus === "waiting";

    return (
        <ThemeProvider themeId={themeId}>
            {!inLobby ? (
                <PlayArea room={room} sessionId={conn.sessionId} />
            ) : (
                <Lobby
                    room={room}
                    roomId={conn.roomId}
                    sessionId={conn.sessionId}
                    gameStatus={gameStatus}
                    playerJoinEvents={playerJoinEvents}
                    onReady={setReady}
                    onAddBots={addTwoBots}
                    onLeave={disconnect}
                    onKick={kickPlayer}
                />
            )}
        </ThemeProvider>
    );
});

export function RoomPage() {
    const { conn, room, connect, disconnect, playerJoinEvents } = useRoomConnection();

    const isConnected = conn.status === "connected" && !!room;
    const sessionId = isConnected ? conn.sessionId : "temp";

    const deps = useMemo(
        () => ({
            room: isConnected ? room : undefined,
            runAnim: (_: string) => {},
            playSfx: (_: string) => {},
        }),
        [isConnected, room]
    );

    const machine = useGameMachine(sessionId, deps);

    if (!isConnected) {
        return (
            <View className="flex-1 justify-center items-center p-4 bg-slate-950">
                {conn.status === "connecting" && (
                    <>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-white mt-4 font-medium">
                            Connecting to Claim...
                        </Text>
                    </>
                )}

                {conn.status === "error" && (
                    <>
                        <Text className="text-red-500 text-lg text-center mb-4">
                            {conn.message}
                        </Text>
                        <TouchableOpacity onPress={connect} className="bg-blue-600 px-6 py-3 rounded-lg">
                            <Text className="text-white font-bold">Retry Connection</Text>
                        </TouchableOpacity>
                    </>
                )}

                {conn.status === "idle" && (
                    <TouchableOpacity onPress={connect} className="bg-blue-600 px-6 py-3 rounded-lg">
                        <Text className="text-white font-bold">Connect</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <GameProvider value={machine}>
            <RoomContent
                room={room}
                conn={conn}
                disconnect={disconnect}
                playerJoinEvents={playerJoinEvents ?? []}
            />
        </GameProvider>
    );
}