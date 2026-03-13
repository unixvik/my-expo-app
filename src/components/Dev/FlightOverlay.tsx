import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { useVisualStore } from '@/state/useVisualStore';
import { GameCard } from '@/components/Cards/GameCard';
import { PLAYER_CARD_WIDTH, CARD_ASPECT_RATIO, TABLE_TILT, TABLE_PERSPECTIVE } from '@/state/constants';
import { useResponsive } from '@/hooks/useResponsive';

const FlyingCardItem = ({
                            ghost,
                            cardWidth,
                            cardHeight,
                            onDone,
                        }: {
    ghost: { id: string; card: any; startX: number; startY: number; endX: number; endY: number };
    cardWidth: number;
    cardHeight: number;
    onDone: () => void;
}) => {
    // 🌟 1. Use Translation instead of absolute left/top for 60fps performance
    const translateX = useSharedValue(ghost.startX - cardWidth / 2);
    const translateY = useSharedValue(ghost.startY - cardHeight / 2);
    const scaleAnim = useSharedValue(1);
    const opacity = useSharedValue(1);

    // 🌟 2. Add the 3D Rotation shared value (starts flat at 0 degrees)
    const rotateXAnim = useSharedValue(0);

    useEffect(() => {
        // Flight path
        translateX.value = withTiming(ghost.endX - cardWidth / 2, { duration: 400, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(ghost.endY - cardHeight / 2, { duration: 400, easing: Easing.in(Easing.quad) });

        // Target scale (shrink it slightly if your table cards are smaller than hand cards)
        scaleAnim.value = withTiming(0.8, { duration: 400 });

        // 🌟 3. Tilt the card backward as it flies
        rotateXAnim.value = withTiming(TABLE_TILT, { duration: 400, easing: Easing.inOut(Easing.quad) });

        // Fade out right as it lands (animating to 0, not 1)
        opacity.value = withDelay(350, withTiming(0, { duration: 50 }, (finished) => {
            'worklet';
            if (finished) runOnJS(onDone)();
        }));
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: cardWidth,
        height: cardHeight,
        zIndex: 999999,
        opacity: opacity.value,
        transform: [
            // 🌟 4. Transform order matters! Perspective MUST be first.
            { perspective: TABLE_PERSPECTIVE },
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotateX: `${rotateXAnim.value}deg` },
            { scale: scaleAnim.value }
        ],
    }));

    return (
        <Animated.View style={style} pointerEvents="none">
            <GameCard card={ghost.card} style={{ width: cardWidth, height: cardHeight }} />
        </Animated.View>
    );
};

export const FlightOverlay = () => {
    const flyingCards = useVisualStore(s => s.flyingCards);
    const removeFlyingCard = useVisualStore(s => s.removeFlyingCard);
    const { scale } = useResponsive();

    const cardWidth = scale(PLAYER_CARD_WIDTH);
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
                        // Swap this back when you are done debugging the landing!
                        // onDone={() => removeFlyingCard(ghost.id)}
                        onDone={() => null}
                    />
                ))}
            </View>
        </Modal>
    );
};