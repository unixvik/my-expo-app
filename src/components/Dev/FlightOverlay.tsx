import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Modal} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing, withDelay,
} from 'react-native-reanimated';
import {useVisualStore} from '@/state/useVisualStore';
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


export const FlyingCardItem = ({
                                   ghost,
                                   cardWidth,
                                   cardHeight,
                                   onDone,
                                   targetX,
                                   targetY,
                                   targetRotation,
                                   targetRotationX,
                                   delay // 🌟 Receive the staggered delay
                               }: any) => {

    // Starting position (Hand)
    const translateX = useSharedValue(ghost.startX - cardWidth / 2);
    const translateY = useSharedValue(ghost.startY - cardHeight / 2);
    const rotateZ = useSharedValue(0);

    useEffect(() => {
        const config = {duration: 2400, easing: Easing.out(Easing.quad)};

        // 🌟 Apply withDelay to stagger the flights
        translateX.value = withDelay(delay, withTiming(targetX, config));
        rotateZ.value = withDelay(delay, withTiming(targetRotation, config));
        translateY.value = withDelay(delay, withTiming(targetY - 100, config, (finished) => {
            if (finished) runOnJS(onDone)();
        }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: cardWidth,
        height: cardHeight,
        transform: [
            { perspective: 1000 },
            {translateX: translateX.value},
            {translateY: translateY.value},
            // {skewX: `${targetRotationX}deg`},
            // {skewY: `${-targetRotationX}deg`},
            {rotateZ: `${rotateZ.value}deg`},
        ],
    }));

    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <GameCard card={ghost.card} style={{width: '100%', height: '100%'}}/>
        </Animated.View>
    );
};

export const FlightOverlay = () => {
    const flyingCards = useVisualStore(s => s.flyingCards);
    const removeFlyingCard = useVisualStore(s => s.removeFlyingCard);

    const {scale} = useResponsive();
    const cardWidth = scale(BASE_CARD_WIDTH);
    const cardHeight = cardWidth * CARD_ASPECT_RATIO;

    if (flyingCards.length === 0) return null;

    return (
        <Modal transparent visible animationType="none" statusBarTranslucent>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {flyingCards.map((ghost, index) => {
                    // 1. Math must be identical to FannedCardItem
                    // const fanRotation = (index * 8) + 360;
                    const fanRotation = DISCARD_OFFSET.rotateZ;
                    const fanRotationX = -18;
                     const fanOffsetX = DISCARD_OFFSET.x + (index * 12);
                    const fanOffsetY = DISCARD_OFFSET.y + (index * 2);

                    // 2. Global Target = Container PageX/Y + Fan Offset
                    // Note: We remove the (- cardWidth / 2) because we want
                    // the left edge to align perfectly with the layout box
                    const exactLandingX = ghost.endX + fanOffsetX / 2;
                    const exactLandingY = ghost.endY + fanOffsetY / 2;

                    // 3. Staggered Delay (150ms between each card)
                    const flightDelay = index * 150;

                    return (
                        <FlyingCardItem
                            key={ghost.id}
                            ghost={ghost}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            targetX={exactLandingX}
                            targetY={exactLandingY}
                            targetRotation={fanRotation}
                            targetRotationX={fanRotationX}
                            delay={flightDelay}
                            onDone={() => removeFlyingCard(ghost.id)}
                        />
                    );
                })}
            </View>
        </Modal>
    );
};
