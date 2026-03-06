import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { PlayerJoinEvent } from "@/types/types";
import type { Room } from "@colyseus/sdk";
import type { ClaimRoomState } from "@/colyseus/state";

import { useGameSelector } from "@/state/machine/useGameSelector";
import { selectPlayersReady } from "@/state/machine/selector";
// import { GameStatusOverlay } from "@/components/Dev/GameStatusOverlay";

const BOT_NAMES = [
    "Neo", "Trinity", "Morpheus", "Smith", "Gandalf", "Frodo", "Aragorn",
    "Mario", "Luigi", "Zelda", "Link", "Pikachu", "Sonic", "Luke", "Vader",
    "Stark", "Cap", "Batman", "Joker", "Harry", "Snape", "Kratos", "Chief",
    "Glitch", "Pixel", "Syntax", "Null", "Root",
];

const getRandomName = () => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];

type UiPlayer = {
    id: string;
    name: string;
    ready: boolean;
    connected: boolean;
    isBot: boolean;
    isMe: boolean;
};

interface LobbyProps {
    roomId: string;
    sessionId: string;
    gameStatus: string;
    playerJoinEvents: PlayerJoinEvent[];
    onReady: () => void;
    onAddBots: () => void;
    onLeave: () => void;
    // ✅ Best Practice: Pass the kick handler as a prop to keep UI decoupled from game logic
    onKick: (playerId: string) => void;
    room: Room<ClaimRoomState>;
}

export function Lobby({
                          roomId,
                          sessionId,
                          gameStatus,
                          playerJoinEvents,
                          onReady,
                          onAddBots,
                          onLeave,
                          onKick,
                          room,
                      }: LobbyProps) {
    const players = useGameSelector(selectPlayersReady);
    const playerCount = players.length;

    const BOTS_TO_ADD = 0;
    const hasInitializedBots = useRef(false);

    useEffect(() => {
        if (BOTS_TO_ADD <= 0) return;
        if (!room?.state?.players) return;
        if (gameStatus !== "waiting") return;
        if (hasInitializedBots.current) return;

        if (room.state.players.size >= 8) return;

        for (let i = 0; i < BOTS_TO_ADD; i++) {
            if (room.state.players.size + i >= 8) break;
            room.send("addBot", { name: getRandomName() });
        }

        hasInitializedBots.current = true;
    }, [room, gameStatus]);

    return (
        <View className="flex-1 w-screen h-100" style={{ flex: 1, backgroundColor: "black" }}>
            <Text className="text-3xl font-bold text-white mb-4">Lobby</Text>

            <View className="bg-slate-800/50 p-4 rounded-xl mb-4">
                <Text className="text-slate-300">
                    Room: <Text className="text-white font-mono">{roomId}</Text>
                </Text>
                <Text className="text-slate-300">
                    Session: <Text className="text-white font-mono">{sessionId}</Text>
                </Text>
                <Text className="text-slate-300">
                    Status: <Text className="text-blue-400 font-bold">{gameStatus}</Text>
                </Text>
            </View>

            {/* ✅ Players list */}
            <View className="bg-slate-900/40 border border-white/10 rounded-xl p-3 mb-4">
                <View className="flex-row items-center mb-2">
                    <Text className="text-slate-300 uppercase text-xs font-bold tracking-widest">
                        Players
                    </Text>
                    <Text className="text-slate-500 text-xs ml-auto">{playerCount}/8</Text>
                </View>

                <ScrollView style={{ maxHeight: 180 }} className="rounded-lg">
                    {players.map((p) => {
                        const badge = p.isBot ? "🤖" : p.connected === false ? "⚠️" : "🧑";

                        return (
                            <View
                                key={p.playerId}
                                className="flex-row items-center py-2 border-b border-white/5"
                            >
                                <Text className="mr-2">{badge}</Text>

                                <View>
                                    <Text className="text-white font-bold">
                                        {p.name}{" "}
                                        {p.isMe ? <Text className="text-violet-300">(You)</Text> : null}
                                    </Text>
                                    <Text className="text-slate-500 text-[10px] font-mono">{p.playerId}</Text>
                                </View>

                                {/* ✅ Added flex-row and gap layout for multiple UI elements on the right */}
                                <View className="ml-auto flex-row items-center">
                                    <View
                                        className={`px-2 py-1 rounded-full ${
                                            p.ready ? "bg-green-600/20" : "bg-slate-700/30"
                                        }`}
                                    >
                                        <Text
                                            className={`text-[10px] font-bold ${
                                                p.ready ? "text-green-300" : "text-slate-300"
                                            }`}
                                        >
                                            {p.ready ? "READY" : "NOT READY"}
                                        </Text>
                                    </View>

                                    {/* ✅ Kick Button: Only renders if the player is not the local user */}
                                    {!p.isMe && (
                                        <TouchableOpacity
                                            onPress={() => onKick(p.playerId)}
                                            className="bg-red-900/40 px-2 py-1 rounded border border-red-500/50 ml-2"
                                        >
                                            <Text className="text-[10px] font-bold text-red-300">KICK</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    })}

                    {players.length === 0 ? (
                        <View className="py-8 items-center">
                            <Text className="text-slate-500">No players yet</Text>
                        </View>
                    ) : null}
                </ScrollView>
            </View>

            {/* Buttons */}
            <View className="flex-row flex-wrap gap-2 mb-4">
                <TouchableOpacity
                    onPress={onReady}
                    className="bg-green-600 px-6 py-3 rounded-lg flex-1 min-w-[120px] items-center"
                >
                    <Text className="text-white font-bold">Ready</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onAddBots}
                    className="bg-slate-700 px-6 py-3 rounded-lg flex-1 min-w-[120px] items-center"
                >
                    <Text className="text-white font-bold">+2 Bots</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onLeave}
                    className="bg-red-900/50 border border-red-500 px-6 py-3 rounded-lg flex-1 min-w-[120px] items-center"
                >
                    <Text className="text-red-200 font-bold">Leave</Text>
                </TouchableOpacity>
            </View>

            {/* Activity Feed */}
            <Text className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-2">
                Activity Feed
            </Text>

            <ScrollView className="flex-1 bg-black/20 rounded-lg p-2">
                {playerJoinEvents.map((e) => (
                    <View key={e.timestamp} className="flex-row items-center py-2 border-b border-white/5">
                        <Text className="mr-2">{e.type === "join" ? "✅" : "👋"}</Text>
                        <Text className="text-white">{e.name}</Text>
                        <Text className="text-slate-500 text-[10px] ml-auto">
                            {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}