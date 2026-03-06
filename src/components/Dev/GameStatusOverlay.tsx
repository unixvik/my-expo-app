// src/coomponents/Dev/GameStatusOverlay.tsx

import React, { memo } from "react";
import {View, Text, StyleSheet, ScrollView} from "react-native";
import { useGameSelector } from "@/state/machine/useGameSelector";
import {selectCanDiscard, selectIsMyTurn, selectPlayerCards} from "@/state/machine/selector"
import {useCardsLogic} from "@/components/Player/hooks/useCardsLogic";
import {Event } from "@/state/machine/types"
export const GameStatusOverlay = memo(function GameStatusOverlay() {
    // --- Core game
    const gameStatus = useGameSelector(s => s.game.gameStatus);
    const phase = useGameSelector(s => s.game.phase);
    const round = useGameSelector(s => s.game.round);
    const cardsRemaining = useGameSelector(s => s.game.cardsRemaining);
    const currentTurn = useGameSelector(s => s.game.currentTurn);
    const turnOrder = useGameSelector(s => s.game.turnOrder);
    const atu = useGameSelector(s => s.game.atuCards[0]);
    const topDiscard = useGameSelector(s => s.game.topDiscard);
    const eventLog = useGameSelector(s => s.ui.eventLog);
    // --- Player-centric
    const mySessionId = useGameSelector(s => s.game.sessionId);
    const playerCards = useGameSelector(s => s.game.playerCards);
    const selectedIds = useGameSelector(s => s.ui.selectedIds);

    const uiMode= useGameSelector(s => s.ui.mode);

    const { pendingDiscardIds } =
        useCardsLogic(playerCards);
    // --- Derived logic flags (if present in state)
    const isMyTurn = useGameSelector(selectIsMyTurn);
    const canDiscard = useGameSelector(selectCanDiscard);
    const mandatoryDraw = useGameSelector(s => s.game.mandatoryDraw);

    // --- UI
    const locks = useGameSelector(s => s.ui.locks);
    const popup = useGameSelector(s => s.ui.popup);
    const mode = useGameSelector(s => s.ui.mode);




    // --- Opponents
    const opponents = useGameSelector(s =>
        s.game.opponents.map(o => ({
            ...o,
            botTargetRank: o.botTargetRank ?? "",
            botTargetTTL: o.botTargetTTL ?? 0,
            botLastDecision: o.botLastDecision ?? "",
            botLastAction: o.botLastAction ?? "",
            botLastFromDiscard: o.botLastFromDiscard ?? false,
            botThinkMs: o.botThinkMs ?? 0,
            botTurnSeq: o.botTurnSeq ?? 0,
        }))
    );


    const serverTop = useGameSelector((s) => s.game.topDiscard);

    const cardsDiscarded = useGameSelector((s) => s.game.cardsDiscarded);
    // console.log(opponents);
    return (

        <ScrollView  style={hud.wrap}>

            <Text style={hud.title}>STATE</Text>

            {/* Game */}
            <Text style={hud.row}><Text style={hud.k}>status:</Text> {String(gameStatus)}</Text>
            <Text style={hud.row}><Text style={hud.k}>phase:</Text> {String(phase)}</Text>
            <Text style={hud.row}><Text style={hud.k}>round:</Text> {String(round)}</Text>
            <Text style={hud.row}><Text style={hud.k}>deck:</Text> {String(cardsRemaining)}</Text>
            <Text style={hud.row}><Text style={hud.k}>turn:</Text> {String(currentTurn ?? "-")}</Text>

            <Text style={hud.row}><Text style={hud.k}>turnIdx:</Text> {turnOrder?.indexOf(currentTurn ?? "")}</Text>
            <Text style={hud.row}><Text style={hud.k}>atu:</Text> {atu?.rank + atu?.suit}</Text>
            <Text style={hud.row}><Text style={hud.k}>topDiscard:</Text> {topDiscard?.rank ?? "-"}{topDiscard?.suit ?? ""}</Text>

            <Text style={hud.sep}>-- Events --</Text>

            <Text style={hud.sub}>
                {(eventLog?.slice(-5) ?? [])
                    .map(e => e.type.replace("INTENT_", "I_"))
                    .join("  →  ") || "none"}
            </Text>
            <Text style={hud.sep}>-- DISCARD DECK --</Text>
            <Text style={hud.row}><Text style={hud.k}>Server Top</Text> {String(serverTop?.id)}</Text>
            <Text style={hud.row}><Text style={hud.k}>CardsDiscarded</Text> {String(cardsDiscarded)}</Text>
            {/* Player */}
            <Text style={hud.sep}>-- Player --</Text>
            <Text style={hud.row}><Text style={hud.k}>me:</Text> {mySessionId?.slice(0,6)}</Text>
            <Text style={hud.row}><Text style={hud.k}>myTurn:</Text> {String(isMyTurn)}</Text>
            <Text style={hud.row}><Text style={hud.k}>canDiscard:</Text> {String(canDiscard)}</Text>
            <Text style={hud.row}><Text style={hud.k}>mandatoryDraw:</Text> {String(mandatoryDraw)}</Text>
            <Text style={hud.row}><Text style={hud.k}>ui mode:</Text> {String(uiMode)}</Text>

            <Text style={hud.row}><Text style={hud.k}>hand:</Text> {playerCards?.length}</Text>
            <Text style={hud.row}><Text style={hud.k}>selected:</Text> {selectedIds?.length ?? 0}</Text>
            <Text style={hud.row}><Text style={hud.k}>pendingDiscard:</Text> {pendingDiscardIds?.size ?? 0}</Text>
            {playerCards.map(card => (
                <>
                <Text key={card.id} style={hud.k}>Card: <Text style={hud.row}>{card.id}</Text> </Text>
                </>
            ))}
            {/* Opponents */}
            <Text style={hud.sep}>-- Opponents --</Text>
            <Text style={hud.row}>
                <Text style={hud.k}>count:</Text> {opponents?.length ?? 0}
            </Text>

            {opponents.map((opponent) => {

                const isBot = opponent.isBot;
                // console.log(isBot);

                return (
                    <View key={opponent.id} style={{ marginBottom: 10 }}>
                        {/*<Text style={hud.row}>*/}
                        {/*    {opponent.name}: {opponent.handValue} PTS*/}
                        {/*    {isBot ? "  🤖" : ""}*/}
                        {/*</Text>*/}

                        {isBot && (
                            <View style={{ paddingLeft: 10 }}>
                                <Text style={hud.row}>
                                    <Text style={hud.k}>turnSeq:</Text> {opponent.botTurnSeq ?? 0}
                                </Text>

                                <Text style={hud.row}>
                                    <Text style={hud.k}>target:</Text>{" "}
                                    {opponent.botTargetRank
                                        ? `${opponent.botTargetRank} (${opponent.botTargetTTL})`
                                        : "-"}
                                </Text>

                                <Text style={hud.row}>
                                    <Text style={hud.k}>lastAction:</Text>{" "}
                                    {opponent.botLastAction ?? "-"}
                                </Text>

                                <Text style={hud.row}>
                                    <Text style={hud.k}>decision:</Text>{" "}
                                    {opponent.botLastDecision ?? "-"}
                                </Text>

                                <Text style={hud.row}>
                                    <Text style={hud.k}>fromDiscard:</Text>{" "}
                                    {String(opponent.botLastFromDiscard ?? false)}
                                </Text>

                                <Text style={hud.row}>
                                    <Text style={hud.k}>thinkMs:</Text>{" "}
                                    {opponent.botThinkMs ?? 0}
                                </Text>
                            </View>
                        )}
                    </View>
                );
            })}


            {/* UI */}
            <Text style={hud.sep}>-- UI --</Text>
            <Text style={hud.row}><Text style={hud.k}>mode:</Text> {String(mode)}</Text>
            <Text style={hud.row}><Text style={hud.k}>popup:</Text> {String(popup ?? "-")}</Text>
            <Text style={hud.sub}>
                locks:{" "}
                {Object.entries(locks)
                    .filter(([, v]) => !!v)
                    .map(([k]) => k)
                    .join(", ") || "none"}
            </Text>

        </ScrollView>

    );
});

const hud = StyleSheet.create({
    wrap: {
        position: "absolute",
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.65)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        zIndex: 100,
        maxWidth: 260,
        flex: 1
    },
    title: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 4,
    },
    row: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 12,
        lineHeight: 16,
    },
    k: {
        color: "rgba(0,255,255,0.6)",
        fontWeight: "700",
    },
    sep: {
        marginTop: 6,
        color: "rgba(255,255,255,0.4)",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
    },
    sub: {
        marginTop: 4,
        color: "rgba(255,255,255,0.6)",
        fontSize: 10,
    },
});
