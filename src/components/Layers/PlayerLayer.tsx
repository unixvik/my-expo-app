// src/components/Layers/PlayerLayer.tsx

import React, {useMemo} from "react";
import {StyleSheet, TouchableOpacity, View} from "react-native";
import Animated, {
    LinearTransition,
    FadeInDown,
    FadeOutUp,
    FadeIn,
    FadeOut
} from "react-native-reanimated";
import {LinearGradient} from "expo-linear-gradient";

import {AppText} from "@/Common/AppText";
import {convertServerCardToUICard} from "@/utils/suitHelper";
import {useGameStore} from "@/state/useGameStore";
import {PLAYER_CARD_WIDTH} from "@/state/constants";
import {ClaimButton} from "@/components/UI/ClaimButton";
import {AnimatedHandCard} from "@/components/Cards/AnimatedHandCard";
import {DiscardButton} from "@/components/Buttons/DiscardButton";
import {useAppStyles} from "@/hooks/useAppStyles";
import {useActiveGameContext} from "@/hooks/useActiveGameContext";

export function PlayerLayer() {
    const { styles, theme } = useAppStyles();
    const {
        me, hand, handValue, avatarLetter, isMyTurn, myId, currentTurn,
        isClaimOpen, mandatoryDraw, toggleCardSelection,
        selectedDiscardIds, claimGame
    } = useActiveGameContext();

    const discardLayout = useGameStore((s) => s.discardLayout);
    const springConfig = LinearTransition.springify().damping(16).stiffness(160);


    return (
        <View style={styles.playerZone} pointerEvents="box-none">

            <DiscardButton
                styles={styles}
                myId={myId}
                currentTurn={currentTurn}
                mandatoryDraw={mandatoryDraw}
                hand={me?.hand ?? []}
            />

            <View style={styles.myAreaHeader}>
                <AppText>{me?.name || 'Me'}</AppText>
                {currentTurn === me?.id && (
                    <AppText style={{color: theme.accent, fontWeight: 'bold'}}> - YOUR TURN</AppText>
                )}
            </View>

            {/* 🌟 1. SHRINK-WRAP CONTAINER ANIMATION */}
            <Animated.View style={styles.myArea} layout={springConfig}>

                <View style={styles.sideZone}>
                    <Animated.View style={[styles.avatarWrap, {transform: [{scale: 1}]}]}>
                        <LinearGradient colors={["#3d1a6e", "#1a0a3a"]} style={StyleSheet.absoluteFill}/>
                        <AppText style={styles.avatarLetter}>{avatarLetter}</AppText>
                    </Animated.View>
                </View>

                {/* 🌟 2. HAND CONTAINER ANIMATION */}
                <View style={[styles.handContainer, {minWidth: 100, justifyContent: 'center', alignItems: 'flex-end'}]}>
                    {me?.hand?.map((rawCard, index) => {
                        const card = convertServerCardToUICard(rawCard);
                        const isSelected = selectedDiscardIds.some(c => c === card.id);
                        return (
                            <AnimatedHandCard
                                key={card.id}
                                card={card}
                                index={index}
                                totalCards={me.hand.length}
                                cardWidth={PLAYER_CARD_WIDTH}
                                isSelected={isSelected}
                                onToggleSelect={toggleCardSelection}
                                discardTarget={discardLayout} // read the discardTarget target
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
                style={{position: 'absolute', left: '75%', top: '50%', zIndex: 100}}
            >
                <ClaimButton enabled={isClaimOpen && !mandatoryDraw} onPress={() => claimGame()}/>
            </Animated.View>

        </View>
    );
}