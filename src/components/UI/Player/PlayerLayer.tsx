// src/components/Layers/PlayerLayer.tsx

import React, {useMemo, useRef} from "react";
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
import {ClaimButton} from "@/components/Buttons/ClaimButton";
import {AnimatedHandCard} from "@/components/Cards/AnimatedHandCard";
import {DiscardButton} from "@/components/Buttons/DiscardButton";
import {useAppStyles} from "@/hooks/useAppStyles";
import {useAwaitingDraw, useSelf} from "@/state/gameSelectors";
import {HandValue} from "@/components/UI/Player/HandValue";
import {Avatar} from "@/components/UI/Player/Avatar";
import {useGameActions} from "@/hooks/useGameActions";
import {useGameConstants} from "@/hooks/useGameConstants";
import {useVisualStore} from "@/state/useVisualStore";

export function PlayerLayer() {
    const {styles, theme} = useAppStyles();
    const {isClaimOpen} = useGameConstants();
    const mandatoryDraw = useAwaitingDraw();
    const me = useSelf();
    const myId = me?.id;
    // const discardLayout = useVisualStore((s) => s.layouts.discard) ?? null;
    const springConfig = LinearTransition.springify().damping(16).stiffness(160);
    const currentTurn = useGameStore((s) => s.server.currentTurn);
    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds);

    //actions
    const {toggleCardSelection,claimGame} = useGameActions();


    return (
        <View style={styles.playerZone} pointerEvents="box-none">

            <DiscardButton
                styles={styles}
                myId={myId}
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
            {/*<Animated.View style={styles.myArea}>*/}
            {/*<View style={styles.myArea}>*/}

                <Avatar/>

                {/* 🌟 2. HAND CONTAINER ANIMATION */}
                <Animated.View style={[styles.handContainer, {minWidth: 100, justifyContent: 'center', alignItems: 'flex-end'}]}>
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
                                // discardTarget={discardLayout} // read the discardTarget target
                            />
                        );
                    })}
                </Animated.View>

                <HandValue/>

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