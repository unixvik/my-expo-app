import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { useVisualStore } from '@/state/useVisualStore';
import {BASE_CARD_WIDTH, CARD_ASPECT_RATIO, rnShadow, TABLE_PERSPECTIVE, TABLE_TILT} from '@/state/constants';
import { useResponsive } from '@/hooks/useResponsive';
import { getSceneTransform, getFlightYOffset } from '@/utils/helpers';
import { DISCARD_OFFSET } from '@/state/constants';
import {CardFace} from "@/components/Cards/CardFace";

const FLIGHT_DURATION = 630;

// Separate shadow component
const FlyingCardShadow = ({ ghost, cardWidth, cardHeight, targetX, targetY, targetRotation, delay }: any) => {
    const flightProgress = useSharedValue(0);
    const arcOffsetY = getFlightYOffset();

    useEffect(() => {
        flightProgress.value = withDelay(
            delay,
            withTiming(1, {
                duration: FLIGHT_DURATION,
                easing: Easing.bezier(0.3, 0, 0.2, 1)
            })
        );
    }, []);

    const shadowStyle = useAnimatedStyle(() => {
        const p = flightProgress.value;
        const arcMultiplier = Math.sin(p * Math.PI);

        // Shadow offset shifts as the card goes higher
        const shadowDrop = interpolate(arcMultiplier, [0, 1], [0, 40]);

        return {
            position: 'absolute',
            width: cardWidth,
            height: cardHeight,
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 8,
            transform: [
                { translateX: interpolate(p, [0, 1], [ghost.startX, targetX]) + shadowDrop * 0.4 },
                { translateY: interpolate(p, [0, 1], [ghost.startY, targetY + arcOffsetY]) + shadowDrop },
                { scale: interpolate(arcMultiplier, [0, 1], [1, 0.85]) },
                { rotateZ: `${interpolate(p, [0, 1], [0, targetRotation])}deg` },
            ],
            // Fades in slightly at start, is max opaque at peak flight, fades to translucent on landing
            opacity: interpolate(p, [0, 0.1, 0.9, 1], [0, 0.5, 0.2, 0.1]),
        };
    });

    return <Animated.View style={shadowStyle} pointerEvents="none" />;
};

// Card component without shadow
export const FlyingCardItem = ({ ghost, cardWidth, cardHeight, targetX, targetY, targetRotation, delay, onDone }: any) => {
    const flightProgress = useSharedValue(0);
    const impactProgress = useSharedValue(0);
    const arcOffsetY = getFlightYOffset();
    const baseShadow = rnShadow("heavy");
    // console.log("Ghost card:",ghost.card);
    useEffect(() => {
        flightProgress.value = withDelay(
            delay,
            withTiming(1, {
                duration: FLIGHT_DURATION,
                easing: Easing.bezier(0.2, 0, 0, 1)
            }, (finished) => {
                'worklet';
                if (finished) {
                    impactProgress.value = withTiming(1, { duration: 300 }, (ok) => {
                        if (ok) runOnJS(onDone)();
                    });
                }
            })
        );
    }, []);

    const cardStyle = useAnimatedStyle(() => {
        const p = flightProgress.value;
        const imp = impactProgress.value;
        const arcMultiplier = Math.sin(p * Math.PI);

        // Casual wobble/flutter
        const wobble = Math.sin(p * 12) * interpolate(p, [0, 0.5, 1], [0, 10, 0]);
        const arc = -arcMultiplier * 150;

        // Squash and Stretch Logic
        const squash = Math.sin(imp * Math.PI) * interpolate(imp, [0, 1], [0.12, 0]);
        const scaleX = (1 + squash) * interpolate(arcMultiplier, [0, 0.5, 1], [1, 1.1, 1]);
        const scaleY = (1 - squash) * interpolate(arcMultiplier, [0, 0.5, 1], [1, 1.1, 1]);

        return {
            position: 'absolute',
            left: 0,
            top: 0,
            width: cardWidth,
            height: cardHeight,
            shadowColor: baseShadow.shadowColor,
            shadowOffset: baseShadow.shadowOffset,
            shadowOpacity: baseShadow.shadowOpacity,
            shadowRadius: baseShadow.shadowRadius,
            transform: [
                { translateX: interpolate(p, [0, 1], [ghost.startX, targetX]) },
                { translateY: interpolate(p, [0, 1], [ghost.startY, targetY + arcOffsetY]) + arc },
                { scaleX },
                { scaleY },
                { rotateZ: `${interpolate(p, [0, 1], [0, targetRotation]) + wobble}deg` },
                { rotateX: `${arcMultiplier * 20}deg` },
            ],
        };
    });

    const shadowStyle = useAnimatedStyle(() => {
        const p = flightProgress.value;
        const arcMultiplier = Math.sin(p * Math.PI);
        const shadowDrop = interpolate(arcMultiplier, [0, 1], [0, 30]);

        return {
            position: 'absolute',
            width: cardWidth,
            height: cardHeight,
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: 8,
            transform: [
                { translateX: interpolate(p, [0, 1], [ghost.startX, targetX]) + shadowDrop },
                { translateY: interpolate(p, [0, 1], [ghost.startY, targetY + arcOffsetY]) + shadowDrop },
                { scale: interpolate(arcMultiplier, [0, 1], [1, 0.9]) },
                { rotateZ: `${interpolate(p, [0, 1], [0, targetRotation])}deg` },
            ],
            opacity: interpolate(p, [0, 0.1, 0.9, 1], [0, 0.6, 0.3, 0]),
        };
    });

    return (
        <>
            {/* Shadow is rendered BEFORE the card, so it's always UNDER in the local stack */}
            <Animated.View style={shadowStyle} pointerEvents="none" />
            <Animated.View style={cardStyle} pointerEvents="none">
                <CardFace cardId={ghost.card} isFacedown={ghost.isFacedown} style={{ width: '100%', height: '100%' }} />
            </Animated.View>
        </>
    );
};

export const FlightOverlay = () => {
    const flyingCards = useVisualStore(s => s.flyingCards);
    const removeFlyingCard = useVisualStore(s => s.removeFlyingCard);
    const discardLayout = useVisualStore(s => s.layouts.discard);
    const completedRef = useRef(new Set<string>());
    const totalCardsRef = useRef(0);
    const { scale } = useResponsive();

    const cardWidth = scale(BASE_CARD_WIDTH);
    const cardHeight = cardWidth * CARD_ASPECT_RATIO;

    const containerPerspective = useSharedValue(2000);
    const containerTilt = useSharedValue(0);

    useEffect(() => {
        completedRef.current.clear();
        totalCardsRef.current = flyingCards.length;

        if (flyingCards.length > 0) {
            containerPerspective.value = withTiming(TABLE_PERSPECTIVE, {
                duration: Math.min(FLIGHT_DURATION, 1000),
                easing: Easing.bezier(0.33, 1, 0.68, 1)
            });
            containerTilt.value = withTiming(TABLE_TILT, {
                duration: Math.min(FLIGHT_DURATION, 1000),
                easing: Easing.bezier(0.33, 1, 0.68, 1)
            });
        } else {
            containerPerspective.value = 2000;
            containerTilt.value = 0;
        }
    }, [flyingCards.length]);

    const handleCardDone = (id: string) => {
        completedRef.current.add(id);
        if (completedRef.current.size === totalCardsRef.current) {
            setTimeout(() => {
                flyingCards.forEach(card => removeFlyingCard(card.id));
            }, 40);
        }
    };

    const containerStyle = useAnimatedStyle(() => ({
        ...StyleSheet.absoluteFillObject,
        transform: [
            { perspective: containerPerspective.value },
            { rotateX: `${containerTilt.value}deg` }
        ]
    }));

    if (!discardLayout || flyingCards.length === 0) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
            <Animated.View style={containerStyle}>
                {flyingCards.map((ghost, index) => {
                    const isDraw = ghost.type === 'draw';
                    // Draw: fly to the ghost's own endpoint (opponent avatar)
                    // Discard: land exactly where FannedCardItem renders
                    const landingX = isDraw ? ghost.endX : discardLayout.x + DISCARD_OFFSET.x + (index * 5);
                    const landingY = isDraw ? ghost.endY : discardLayout.y + DISCARD_OFFSET.y - (index * 22);
                    const landingRotation = isDraw ? 0 : (index * 8) + 12;
                    const delay = index * 20;

                    return (
                        <FlyingCardItem
                            key={ghost.id}
                            ghost={ghost}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            targetX={landingX}
                            targetY={landingY}
                            targetRotation={landingRotation}
                            delay={delay}
                            onDone={() => handleCardDone(ghost.id)}
                        />
                    );
                })}
            </Animated.View>
        </View>
    );
};