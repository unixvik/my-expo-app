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
import { PLAYER_CARD_WIDTH, CARD_ASPECT_RATIO } from '@/state/constants';
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
    const x = useSharedValue(ghost.startX - cardWidth / 2);
    const y = useSharedValue(ghost.startY - cardHeight / 2);
    const scaleAnim = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        x.value = withTiming(ghost.endX - cardWidth / 2, { duration: 400, easing: Easing.out(Easing.quad) });
        y.value = withTiming(ghost.endY - cardHeight / 2, { duration: 400, easing: Easing.in(Easing.quad) });
        scaleAnim.value = withTiming(0.6, { duration: 400 });
        opacity.value = withDelay(350, withTiming(0, { duration: 50 }, (finished) => {
            'worklet';
            if (finished) runOnJS(onDone)();
        }));
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        left: x.value,
        top: y.value,
        width: cardWidth,
        height: cardHeight,
        transform: [{ scale: scaleAnim.value }],
        opacity: opacity.value,
        zIndex: 999999,
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
                        onDone={() => removeFlyingCard(ghost.id)}
                    />
                ))}
            </View>
        </Modal>
    );
};
