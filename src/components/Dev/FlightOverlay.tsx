import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Modal} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import {useVisualStore} from '@/state/useVisualStore';
import {useGameStore} from '@/state/useGameStore';
import {GameCard} from '@/components/Cards/GameCard';
import {
    PLAYER_CARD_WIDTH,
    BASE_CARD_WIDTH,
    CARD_ASPECT_RATIO,
    TABLE_PERSPECTIVE,
    TABLE_TILT,
    DISCARD_OFFSET
} from '@/state/constants';
import {useResponsive} from '@/hooks/useResponsive';
import {runOnJS} from "react-native-worklets";

type Phase = 'flying' | 'staged' | 'resting';

const FlyingCardItem = ({
                            ghost,
                            cardWidth,
                            cardHeight,
                            isMyTurn,
                            onDone,
                        }: {
    ghost: { id: string; card: any; startX: number; startY: number; endX: number; endY: number };
    cardWidth: number;
    cardHeight: number;
    isMyTurn: boolean;
    onDone: () => void;
}) => {
    const { scale } = useResponsive();

    // Landing calculations
    const exactLandingX = ghost.endX - cardWidth / 2 + DISCARD_OFFSET.x;
    const exactLandingY = ghost.endY - cardHeight / 2 + DISCARD_OFFSET.y;
    const initialScale = scale(PLAYER_CARD_WIDTH / BASE_CARD_WIDTH);

    // Shared Values
    const translateX = useSharedValue(ghost.startX - cardWidth / 2);
    const translateY = useSharedValue(ghost.startY - cardHeight / 2);
    const rotateZ = useSharedValue(0);
    const scaleAnim = useSharedValue(initialScale);

    const FLY_DURATION = 500;

    useEffect(() => {
        // Horizontal travel
        translateX.value = withTiming(exactLandingX, {
            duration: FLY_DURATION,
            easing: Easing.out(Easing.quad),
        });

        // Vertical travel (using In-Out or specialized easing for a "toss" feel)
        translateY.value = withTiming(exactLandingY, {
            duration: FLY_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
            if (finished) {
                // Use runOnJS because onDone likely updates Zustand state
                runOnJS(onDone)();
            }
        });

        rotateZ.value = withTiming(DISCARD_OFFSET.rotateZ, {
            duration: FLY_DURATION
        });

        scaleAnim.value = withTiming(1.0, {
            duration: FLY_DURATION
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: cardWidth,
        height: cardHeight,
        transform: [
            { perspective: 1000 },
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotateZ: `${rotateZ.value}deg` },
            { scale: scaleAnim.value },
        ],
    }));

    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <GameCard card={ghost.card} style={{ width: '100%', height: '100%' }} />
        </Animated.View>
    );
};

export const FlightOverlay = () => {
    const flyingCards = useVisualStore(s => s.flyingCards);
    const removeFlyingCard = useVisualStore(s => s.removeFlyingCard);
    const isMyTurn = useGameStore(s => s.local.isMyTurn);

    const {scale} = useResponsive();
    const cardWidth = scale(BASE_CARD_WIDTH);
    const cardHeight = cardWidth * CARD_ASPECT_RATIO;

    if (flyingCards.length === 0) return null;

    return (
        <Modal transparent visible animationType="none" statusBarTranslucent>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {flyingCards.map(ghost => (
                    <FlyingCardItem
                        key={ghost.id}
                        ghost={ghost}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        isMyTurn={isMyTurn}
                        scaleMult={scale} // 🌟 Pass down the scaler function
                        onDone={() => removeFlyingCard(ghost.id)}
                    />
                ))}
            </View>
        </Modal>
    );
};