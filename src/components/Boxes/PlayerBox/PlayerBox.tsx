// src/components/Boxes/PlayerBox/PlayerBox.tsx

import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, {useCallback, useEffect, useMemo, useRef} from "react";
import { CelestialRing } from "@/components/Boxes/PlayerBox/CelestialRing";
import { useGameSelector } from "@/state/machine/useGameSelector";
import {selectMandatoryDraw, selectHandValue, selectIsMyTurn} from "@/state/machine/selector";
import { useTurnActiveFx } from "@/components/Boxes/PlayerBox/useTurnActiveFx";
import { styles } from '@/components/Boxes/PlayerBox/playerBox.styles';
import { PlayerCards } from "@/components/Player/PlayerCards";
import { useDevice } from "@/hooks/useDevice";
import { useCardSize } from "@/hooks/useCardSize";
import { ClaimButton } from "@/components/Buttons/CelestialClaimButton";
import {useGameCommands} from "@/state/machine/useGameCommands";
import { selectClaimPending } from "@/state/machine/selector";
import { calculateCinematicFan } from "@/helpers/cardFanLayout";
type Rect = { x: number; y: number; w: number; h: number; pose?: { rx?: number; ry?: number; rz?: number; s?: number } };

interface PlayerBoxProps {
    name: string; onHandAnchor?: (r: Rect) => void; // ✅ new
}

export const PlayerBox = React.memo(function PlayerBox({ name, onHandAnchor }: PlayerBoxProps) {
    // Subscription to specific selectors is better for scale than pulling whole state
    const isMyTurn = useGameSelector(selectIsMyTurn);
    const mandatoryDraw = useGameSelector(selectMandatoryDraw);
    const gameStatus = useGameSelector(s => s.game.gameStatus);

    const handValue = useGameSelector(selectHandValue);
    const {claim} = useGameCommands();
    const { isDesktop } = useDevice();
    const { CARD_W, CARD_H, SCALE } = useCardSize();
    const containerWidth = !isDesktop ? "55%" : "35%";
    const handMul = isDesktop ? 0.75 : 0.8;

    const playerCardCount = useGameSelector(s => s.game.playerCards.length);

    const { breatheAnim } = useTurnActiveFx(isMyTurn, {
        hapticOnActivate: true,
        breatheTo: 1.05,
        breatheMs: 1600,
    });

    // Memoize expensive string operations or formatting
    const displayName = useMemo(() => name || "Unknown", [name]);
    const avatarLetter = useMemo(() => (displayName.charAt(0)).toUpperCase(), [displayName]);

    const handRef = useRef<View>(null);

    // Report the exact slot where the NEXT drawn card will land: slot[N] in fan of N+1.
    // Keeping the anchor always one step ahead means the flight destination is ready
    // before the draw intent fires.
    const reportHand = useCallback(() => {
        if (!onHandAnchor) return;
        const node: any = handRef.current;
        if (!node?.measureInWindow) return;
        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w <= 0 || h <= 0) return;
            const nextCount = playerCardCount + 1;
            const fan = calculateCinematicFan(nextCount, isDesktop, SCALE);
            const slot = fan[playerCardCount] ?? fan[fan.length - 1];
            if (!slot) { onHandAnchor({ x, y, w, h }); return; }

            const cx = x + w / 2;
            const cy = y + h / 2;
            const cw = CARD_W * handMul;
            const ch = CARD_H * handMul;
            onHandAnchor({
                x: cx + slot.translateX - cw / 2,
                y: cy + slot.translateY - ch / 2,
                w: cw,
                h: ch,
                pose: { rx: 0, rz: slot.rotate, s: handMul * slot.scale },
            });
        });
    }, [onHandAnchor, playerCardCount, isDesktop, SCALE, CARD_W, CARD_H, handMul]);

    useEffect(() => {
        requestAnimationFrame(reportHand);
    }, [reportHand]);


    const claimPending = useGameSelector(selectClaimPending);

    const claimEnabled =
        isMyTurn &&
        gameStatus === "playing" &&
        !mandatoryDraw &&
        !claimPending;

    return (
        <View className="flex-row items-center justify-center">
            {/* Layout Spacers */}
            <View className="w-1/3" />

            <View
                className="flex overflow-visible"
                style={[styles.identityRow, { width: containerWidth }]}
                pointerEvents="box-none"
            >
                <View style={styles.compassWrapper}>
                    <CelestialRing active={isMyTurn} />
                    <Animated.View style={[styles.avatarWrap, { transform: [{ scale: breatheAnim }] }]}>
                        <LinearGradient colors={["#3d1a6e", "#1a0a3a"]} style={StyleSheet.absoluteFill} />
                        <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                    </Animated.View>
                </View>

                <View className="min-w-[7%] place-self-stretch justify-center">
                    <Text numberOfLines={1} style={styles.nameText}>{displayName}</Text>
                    {isMyTurn && <Text style={styles.turnText}>YOUR TURN...</Text>}
                </View>

                <View className="flex-1 place-self-stretch items-center -translate-y-[20%] justify-center z-[20] overflow-visible"
                      ref={handRef}
                      onLayout={reportHand}
                >
                    <PlayerCards />
                </View>

                <View className="flex w-[15%] justify-end">
                    <Text style={styles.handText}>Hand Value</Text>
                    <Text className="font-black" style={styles.handPoints}>{handValue}</Text>
                </View>
            </View>

            {/* Action Section */}
            <View className="w-1/3 max-w-1/3 items-start left-5 justify-end p-4">
                <ClaimButton
                    enabled={claimEnabled}
                    onPress={claim}
                    size={86}
                />
            </View>
        </View>
    );
});