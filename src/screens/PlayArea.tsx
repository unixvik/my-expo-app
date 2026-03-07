// src/screens/PlayArea.tsx

import React, { useRef, useCallback } from "react";
import { View } from "react-native";
import { TableSurface } from "@/components/Table/TableSurface/TableSurface";
import Opponents from "@/components/OpponentSeat/Opponents";
import { DrawPile } from "@/components/Piles/DrawPile/DrawPile";
import { DiscardPile } from "@/components/Piles/DiscardPile/DiscardPile";
import { ThemeCyclerOverlay } from "@/components/Dev/ThemeCyclerOverlay";

import { selectOpponentsInTurnOrder, selectPlayersReady } from "@/state/machine/selector";
import { useGameSelector, shallowEqual } from "@/state/machine/useGameSelector";
import { useGameCommands } from "@/state/machine/useGameCommands";

import ATUDraw from "@/components/Cards/ATUDraw";
import { PlayerArea } from "@/components/Player/PlayerArea";
import { DrawToolTip } from "@/components/Table/DrawToolTip";
import { useDevice } from "@/hooks/useDevice";
import { GameStatusOverlay } from "@/components/Dev/GameStatusOverlay";

import ClaimShoutedOverlay from "@/components/Overlays/ClaimAnnouncePopup";
import { RoundHistoryPopup } from "@/components/Overlays/RoundHistoryPopup";
import WaitingForPlayersOverlay from "@/components/Overlays/WaitingForPlayersOverlay";
import {CardFlightOverlay} from "@/components/Overlays/CardFlightOverlay";
import {StageZone} from "@/components/Table/StageZone";

type Props = {
    room: any;
    sessionId: string;
};

const TABLE_TRANSFORM = [
    { perspective: 1000 },
    { rotateX: "0deg" as any },
    { scaleY: 0.6 },
    { scaleX: 0.66 },
    { skewX: "-20deg" as any },
];

export function PlayArea({ room, sessionId }: Props) {
    const seatOriginRef = useRef<Record<string, { x: number; y: number }>>({});
    const { isDesktop } = useDevice();
    const { drawDeck, drawDiscard, revealDone, closeRoundEnded } = useGameCommands();

    const onSeatOrigins = useCallback((m: Record<string, { x: number; y: number }>) => {
        seatOriginRef.current = m;
    }, []);

    const {
        opponents,
        cardsRemaining,
        turnOrder,
        currentTurnIndex,
        mandatoryDraw,
        flavorText,
        phase,
        popup,
        lastRound,
        mySessionId,
        myPlayerId,
    } = useGameSelector(
        (s) => ({
            opponents: selectOpponentsInTurnOrder(s),
            cardsRemaining: s.game.cardsRemaining,
            turnOrder: s.game.turnOrder,
            currentTurnIndex: s.game.currentTurnIndex,
            mandatoryDraw: s.game.mandatoryDraw,
            flavorText: s.game.flavorText,
            phase: s.game.phase,
            popup: s.ui.endFlow?.step ?? s.ui.popup,
            lastRound: s.game.lastRound,
            mySessionId: s.game.sessionId,
            myPlayerId: s.game.myPlayerId,
        }),
        shallowEqual
    );

    const players = useGameSelector(selectPlayersReady, shallowEqual);

    type Pose3D = { rx?: number; ry?: number; rz?: number; s?: number };
    type AnchorRect = { x: number; y: number; w: number; h: number; pose?: Pose3D };

    // Anchors for animations
    const anchorsRef = useRef({
        deck: undefined as AnchorRect | undefined,
        discard: undefined as AnchorRect | undefined,
        hand: undefined as AnchorRect | undefined,
        stage: undefined as AnchorRect | undefined,
        seats: {} as Record<string, AnchorRect | undefined>,
    });


    const setDeckAnchor = useCallback((r: AnchorRect) => { anchorsRef.current.deck = r; }, []);
    const setDiscardAnchor = useCallback((r: AnchorRect) => { anchorsRef.current.discard = r; }, []);
    const setHandAnchor = useCallback((r: AnchorRect) => { anchorsRef.current.hand = r; }, []);
    const setStageAnchor = useCallback((r: AnchorRect) => { anchorsRef.current.stage = r; }, []);
    const setSeatAnchor = useCallback((id: string, r: AnchorRect) => { anchorsRef.current.seats[id] = r; }, []);

    const stagedCards = useGameSelector((s) => s.ui.stagedCards, shallowEqual);


    return (
        <View className="flex-1 relative overflow-hidden">

            <GameStatusOverlay />
            <ThemeCyclerOverlay />
            <CardFlightOverlay anchorsRef={anchorsRef} />


            <Opponents
                mockOpponents={opponents}
                onSeatOrigins={onSeatOrigins}
                turnOrder={turnOrder}
                currentTurnIndex={currentTurnIndex}
                myPlayerId={myPlayerId ?? null}
                onSeatAnchor={setSeatAnchor}
            />

            {/* CLAIM POPUP */}
            {popup === "claimAnnounce" && lastRound && (
                <ClaimShoutedOverlay
                    playerName={lastRound.claim.claimerName}
                    success={lastRound.claim.success}
                    flavorText={flavorText}
                    onDismiss={revealDone} // forwards to ACK_ENDFLOW
                />
            )}

            {/* ROUND SCORES */}
            {popup === "roundScores" && lastRound && (
                <RoundHistoryPopup
                    open
                    history={lastRound.history}
                    onClose={closeRoundEnded} // forwards to ACK_ENDFLOW
                />
            )}

            {phase === "waitingNextRound" && (
                <WaitingForPlayersOverlay
                    players={players.map((p) => ({ id: p.playerId, name: p.name, ready: p.ready }))}
                    localPlayerId={mySessionId}
                    roundNumber={2}
                    isLocalReady={players.find((p) => p.isMe)?.ready ?? false}
                    onReady={() => room.send("player_ready")}
                />
            )}

            <TableSurface />

            <View className="absolute w-full h-[80%]" style={{ transform: TABLE_TRANSFORM }}>
                <View className="flex-row w-full h-full items-center justify-center">
                    <StageZone stagedCards={stagedCards} onAnchor={setStageAnchor} />
                    <View className="w-1/4 items-center justify-center">
                        <View style={{ position: "absolute", bottom: 0, zIndex: 0 }}>
                            <ATUDraw />
                        </View>
                        <View style={{ zIndex: 1 }}>
                            <DrawPile drawCount={cardsRemaining} onDraw={drawDeck}  onAnchor={setDeckAnchor} />
                        </View>
                    </View>

                    <View className="w-[30%] translate-x-10 translate-y-5 items-center justify-center">
                        {mandatoryDraw && <DrawToolTip />}
                    </View>

                    <View className="w-1/4 items-center justify-center">
                        <DiscardPile onPress={drawDiscard} onAnchor={setDiscardAnchor}/>
                    </View>

                </View>
            </View>

            <PlayerArea onHandAnchor={setHandAnchor} />
        </View>
    );
}
