// src/components/Layers/PlayerLayer.tsx
import React, { useMemo } from "react";
import { View, Platform } from "react-native";
import Animated, {
    LinearTransition,
    FadeIn,
    useSharedValue, useAnimatedRef,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { AppText } from "@/Common/AppText";
import { convertServerCardToUICard } from "@/utils/suitHelper";
import { useGameStore } from "@/state/useGameStore";
import { CARD_PLAYER_SCALE_RATIO, PLAYER_CARD_WIDTH } from "@/state/constants";
import { ClaimButton } from "@/components/Buttons/ClaimButton";
import { AnimatedHandCard } from "@/components/Cards/AnimatedHandCard";
import { DiscardButton } from "@/components/Buttons/DiscardButton";
import { useAppStyles } from "@/hooks/useAppStyles";
import { useAwaitingDraw, useSelf } from "@/state/gameSelectors";
import { HandValue } from "@/components/UI/Player/HandValue";
import { Avatar } from "@/components/UI/Player/Avatar";
import { useGameActions } from "@/hooks/useGameActions";
import { useGameConstants } from "@/hooks/useGameConstants";
import { runOnJS } from "react-native-reanimated";
import {updateLayout} from "@/utils/helpers";

export function PlayerLayer() {
    const { styles, theme } = useAppStyles();
    const { isClaimOpen } = useGameConstants();
    const mandatoryDraw = useAwaitingDraw();
    const me = useSelf();
    const myId = me?.id;
    const springConfig = LinearTransition.springify().damping(16).stiffness(160);
    const currentTurn = useGameStore((s) => s.server.currentTurn);
    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds);

    const { toggleCardSelection, claimGame } = useGameActions();
    const hoveredCardId = useSharedValue<string | null>(null);
    const OVERLAP_RATIO = CARD_PLAYER_SCALE_RATIO;



    const cardIds = useMemo(() =>
            me?.hand?.map(c => convertServerCardToUICard(c).id) || [],
        [me?.hand]
    );

    // ✅ Only create gestures on mobile platforms
    const isWeb = Platform.OS === 'web';

    const panGesture = Gesture.Pan()
        .minDistance(10)
        .enabled(!isWeb) // ✅ Disable on web
        .onUpdate((e) => {
            'worklet';
            const step = PLAYER_CARD_WIDTH * OVERLAP_RATIO;
            const cardIndex = Math.floor(e.x / step);

            if (cardIndex >= 0 && cardIndex < cardIds.length) {
                const nextId = cardIds[cardIndex];

                if (hoveredCardId.value !== nextId) {
                    hoveredCardId.value = nextId;
                }
            } else {
                hoveredCardId.value = null;
            }
        })
        .onEnd(() => { 'worklet'; hoveredCardId.value = null; })
        .onFinalize(() => { 'worklet'; hoveredCardId.value = null; });

    const tapGesture = Gesture.Tap()
        .enabled(!isWeb) // ✅ Disable on web
        .onEnd((_event, success) => {
            'worklet';
            if (success) {
                const step = PLAYER_CARD_WIDTH * OVERLAP_RATIO;
                const cardIndex = Math.floor(_event.x / step);
                const nextId = cardIds[cardIndex];

                if (nextId) runOnJS(toggleCardSelection)(nextId);
            }
        });

    const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

    // ✅ Conditional wrapper - only use GestureDetector on mobile
    const HandContainer = ({ children }: { children: React.ReactNode }) => {
        if (isWeb) {
            return (
                <Animated.View style={[styles.handContainer, { minWidth: 200, justifyContent: 'center', alignItems: 'flex-end' }]}>
                    {children}
                </Animated.View>
            );
        }

        return (
            <GestureDetector gesture={composedGesture}>
                <Animated.View style={[styles.handContainer, { minWidth: 200, justifyContent: 'center', alignItems: 'flex-end' }]}>
                    {children}
                </Animated.View>
            </GestureDetector>
        );
    };

    return (
        <View style={styles.playerZone} pointerEvents="box-none">
            <DiscardButton styles={styles} myId={myId} hand={me?.hand ?? []} />

            <View style={styles.myAreaHeader}>
                <AppText>{me?.name || 'Me'}</AppText>
                {currentTurn === me?.id && (
                    <AppText style={{ color: theme.accent, fontWeight: 'bold' }}> - YOUR TURN</AppText>
                )}
            </View>

            <Animated.View style={styles.myArea} layout={springConfig}>
                <Avatar />

                <HandContainer >
                    {me?.hand?.map((rawCard, index) => {
                        const card = convertServerCardToUICard(rawCard);
                        const isSelected = selectedDiscardIds.some(c => c === card.id);

                        return (
                            <AnimatedHandCard

                                key={card.id}
                                card={card}
                                index={index}
                                totalCards={me.hand.length}
                                cardWidth={PLAYER_CARD_WIDTH * CARD_PLAYER_SCALE_RATIO}
                                isSelected={isSelected}
                                hoveredCardId={hoveredCardId}
                                onToggleSelect={toggleCardSelection}

                            />
                        );
                    })}
                </HandContainer>

                <HandValue />
            </Animated.View>

            <Animated.View
                entering={FadeIn.duration(400)}
                style={{ position: 'absolute', left: '75%', top: '50%', zIndex: 100 }}
            >
                <ClaimButton enabled={isClaimOpen && !mandatoryDraw} onPress={() => claimGame()} />
            </Animated.View>
        </View>
    );
}