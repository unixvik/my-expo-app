import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    LinearTransition,
    FadeInDown,
    FadeOutUp,
    FadeIn,
    FadeOut
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { AppText } from "@/Common/AppText";
import { convertServerCardToUICard } from "@/utils/suitHelper";
import { GameCard } from "@/components/Cards/GameCard";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import { useGameStore } from "@/state/useGameStore";
import { useAwaitingDraw, useSelf } from "@/state/gameSelectors";
import { PLAYER_CARD_WIDTH } from "@/state/constants";
import { ClaimButton } from "@/components/UI/ClaimButton";
import {AnimatedHandCard} from "@/components/Cards/AnimatedHandCard";
import {useVisualStore} from "@/state/useVisualStore";

export function PlayerLayer() {
    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);

    const mandatoryDraw = useAwaitingDraw();
    const me = useSelf();
    const { currentTurn } = useGameStore((s) => s.server);
    const myId = me?.id;

    // Actions & State
    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds || []);
    const toggleCardSelection = useGameStore((s) => s.toggleCardSelection);
    const clearSelection = useGameStore((s) => s.clearSelection);
    const discardCards = useGameStore((s) => s.discardCards);
    const claimGame = useGameStore((s) => s.claimGame);

    // 🌟 OPTIMIZATION: Derive from 'me' directly rather than hitting the store again
    const handValue = me?.handValue ?? 0;
    const displayName = me?.name ?? "??";
    const avatarLetter = useMemo(() => displayName.charAt(0).toUpperCase(), [displayName]);

    const isClaimOpen = useGameStore((s) => {
        const isMyTurn = s.server.currentTurn === myId;
        const isRoundEligible = s.server.round >= s.server.claimRoundOpen;
        return isMyTurn && isRoundEligible;
    });

    // 🌟 ANIMATION CONFIG: Shared spring physics for a unified feel
    const springConfig = LinearTransition.springify().damping(16).stiffness(160);

    // 🌟 Read from the visual reality, not the server truth
    const visualHand = useVisualStore((s) => s.visualHand);



    return (
        <View style={styles.playerZone} pointerEvents="box-none">

            {/* 🌟 ANIMATED DISCARD BUTTON OVERLAY */}
            {selectedDiscardIds.length > 0 && currentTurn === myId && !mandatoryDraw && (
                <Animated.View
                    entering={FadeInDown.springify()}
                    exiting={FadeOutUp.duration(200)}
                    style={styles.discardButton} // Apply styles to the Animated wrapper
                >
                    <TouchableOpacity
                        onPress={() => {
                            discardCards(selectedDiscardIds);
                            clearSelection();
                        }}
                    >
                        <AppText style={styles.actionText}>
                            DISCARD {selectedDiscardIds.length} {selectedDiscardIds.length === 1 ? 'CARD' : 'CARDS'}
                        </AppText>
                    </TouchableOpacity>
                </Animated.View>
            )}

            <View style={styles.myAreaHeader}>
                <AppText>{me?.name || 'Me'}</AppText>
                {currentTurn === me?.id && (
                    <AppText style={{ color: theme.accent, fontWeight: 'bold' }}> - YOUR TURN</AppText>
                )}
            </View>

            {/* 🌟 1. SHRINK-WRAP CONTAINER ANIMATION */}
            <Animated.View style={styles.myArea} layout={springConfig}>

                <View style={styles.sideZone}>
                    <Animated.View style={[styles.avatarWrap, { transform: [{ scale: 1 }] }]}>
                        <LinearGradient colors={["#3d1a6e", "#1a0a3a"]} style={StyleSheet.absoluteFill} />
                        <AppText style={styles.avatarLetter}>{avatarLetter}</AppText>
                    </Animated.View>
                </View>

                {/* 🌟 2. HAND CONTAINER ANIMATION */}
                <View style={[styles.handContainer, { width: 0, justifyContent: 'center', alignItems: 'flex-end' }]}>
                    {/*{me?.hand?.map((rawCard, index) => {*/}
                    {visualHand.map((card, index) => {
                        // const card = convertServerCardToUICard(rawCard);
                        // const isSelected = selectedDiscardIds.some(c => c === card.id);
                        const isSelected = selectedDiscardIds.some(c => c === card.id);
                        return (
                            <AnimatedHandCard
                                key={card.id}
                                card={card}
                                index={index}
                                // totalCards={me.hand.length}
                                totalCards={visualHand.length}
                                cardWidth={PLAYER_CARD_WIDTH}
                                isSelected={isSelected}
                                onToggleSelect={toggleCardSelection}
                            />
                        );
                    })}
                </View>

                <View style={[styles.sideZoneRight]}>
                    <AppText style={styles.sideZoneRightHand}>Hand</AppText>
                    <Animated.Text layout={springConfig} style={styles.avatarLetter}>
                        {handValue}
                    </Animated.Text>
                </View>

            </Animated.View>

            {/* 🌟 ANIMATED CLAIM BUTTON */}
            <Animated.View
                entering={FadeIn.duration(400)}
                style={{ position: 'absolute', left: '75%', top: '50%', zIndex: 100 }}
            >
                <ClaimButton enabled={isClaimOpen && !mandatoryDraw} onPress={() => claimGame()} />
            </Animated.View>

        </View>
    );
}