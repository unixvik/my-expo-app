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
} from 'react-native-reanimated';
import { useVisualStore } from '@/state/useVisualStore';
import {
    BASE_CARD_WIDTH,
    CARD_ASPECT_RATIO,
    rnShadow,
    TABLE_PERSPECTIVE,
    TABLE_TILT,
    getFanPosition,
    DISCARD_OFFSET,
    FLIGHT_DURATION,
} from '@/state/constants';
import { useResponsive } from '@/hooks/useResponsive';
import { CardFace } from "@/components/Cards/CardFace";


// Separate shadow component
const FlyingCardShadow = ({ ghost, cardWidth, cardHeight, targetX, targetY, targetRotation, delay }: any) => {
    const flightProgress = useSharedValue(0);

    // Defensive fallback for layout variables
    const safeStartX = ghost?.startX || 0;
    const safeStartY = ghost?.startY || 0;

    useEffect(() => {
        flightProgress.value = withDelay(
            delay,
            withTiming(1, {
                duration: FLIGHT_DURATION,
                easing: Easing.bezier(0.3, 0, 0.2, 1)
            })
        );
    }, [delay, flightProgress]);

    const shadowStyle = useAnimatedStyle(() => {
        const p = flightProgress.value;
        const arcMultiplier = Math.sin(p * Math.PI);
        const shadowDrop = interpolate(arcMultiplier, [0, 1], [0, 40]);

        return {
            transform: [
                { translateX: interpolate(p, [0, 1], [safeStartX, targetX]) + shadowDrop * 0.4 },
                { translateY: interpolate(p, [0, 1], [safeStartY, targetY]) + shadowDrop },
                { scale: interpolate(arcMultiplier, [0, 1], [1, 0.85]) },
                { rotateZ: `${interpolate(p, [0, 1], [0, targetRotation])}deg` },
            ],
            opacity: interpolate(p, [0, 0.1, 0.9, 1], [0, 0.5, 0.2, 0.1]),
        };
    });

    return (
        <Animated.View
            style={[
                { position: 'absolute', width: cardWidth, height: cardHeight, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 },
                shadowStyle
            ]}
            pointerEvents="none"
        />
    );
};

// Card component without shadow
export const FlyingCardItem = ({ ghost, cardWidth, cardHeight, targetX, targetY, targetRotation, delay, onDone }: any) => {
    const flightProgress = useSharedValue(0);
    const impactProgress = useSharedValue(0);
    const baseShadow = rnShadow("heavy");

    const safeStartX = ghost?.startX || 0;
    const safeStartY = ghost?.startY || 0;

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
                        if (ok && onDone) {
                            runOnJS(onDone)();
                        }
                    });
                }
            })
        );
    }, [delay, flightProgress, impactProgress, onDone]);

    const animatedCardStyle = useAnimatedStyle(() => {
        const p = flightProgress.value;
        const imp = impactProgress.value;
        const arcMultiplier = Math.sin(p * Math.PI);

        const wobble = Math.sin(p * 12) * interpolate(p, [0, 0.5, 1], [0, 10, 0]);
        const arc = -arcMultiplier * 150;

        const squash = Math.sin(imp * Math.PI) * interpolate(imp, [0, 1], [0.12, 0]);
        const scaleX = (1 + squash) * interpolate(arcMultiplier, [0, 0.5, 1], [1, 1.1, 1]);
        const scaleY = (1 - squash) * interpolate(arcMultiplier, [0, 0.5, 1], [1, 1.1, 1]);

        return {
            transform: [
                { translateX: interpolate(p, [0, 1], [safeStartX, targetX]) },
                { translateY: interpolate(p, [0, 1], [safeStartY, targetY]) + arc },
                { scaleX },
                { scaleY },
                { rotateZ: `${interpolate(p, [0, 1], [0, targetRotation]) + wobble}deg` },
                { rotateX: `${arcMultiplier * 20}deg` },
            ],
            // ✅ Fade out at end for crossfade
            // opacity: interpolate(p, [0, 0.85, 1], [1, 1, 0]),
        };
    });

    // ✅ CSS drop-shadow filter (works in same transform space)
    const cardContainerStyle = useAnimatedStyle(() => {
        const p = flightProgress.value;
        const arcMultiplier = Math.sin(p * Math.PI);

        // Dynamic shadow based on arc height
        const shadowIntensity = interpolate(arcMultiplier, [0, 1], [0.3, 0.6]);
        const shadowBlur = interpolate(arcMultiplier, [0, 1], [10, 25]);
        const shadowOffsetY = interpolate(arcMultiplier, [0, 1], [5, 20]);

        return {
            filter: `drop-shadow(0px ${shadowOffsetY}px ${shadowBlur}px rgba(0,0,0,${shadowIntensity}))`,
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: cardWidth,
                    height: cardHeight,
                },
                animatedCardStyle,
                // ✅ Use React Native shadow (stays with card in 3D space)
                baseShadow,
            ]}
            pointerEvents="none"
        >
            <CardFace
                cardId={ghost.card}
                isFacedown={ghost.isFacedown}
                style={{ width: '100%', height: '100%' }}
            />
        </Animated.View>
    );
};
export const FlightOverlay = () => {
    const flyingCards = useVisualStore(s => s.flyingCards);
    const removeFlyingCard = useVisualStore(s => s.removeFlyingCard);
    const discardLayout = useVisualStore(s => s.layouts.discard);
    const completedRef = useRef(new Set<string>());
    const totalCardsRef = useRef(0);
    const { scale,moderateScale } = useResponsive();

    const cardWidth = scale(BASE_CARD_WIDTH);
    const cardHeight = cardWidth * CARD_ASPECT_RATIO;

    const containerPerspective = useSharedValue(2000);
    const containerTilt = useSharedValue(0);


    useEffect(() => {
        completedRef.current.clear();
        totalCardsRef.current = flyingCards.length;

        if (flyingCards.length > 0) {
            containerPerspective.value = withTiming(TABLE_PERSPECTIVE, {
                duration: Math.min(FLIGHT_DURATION, 100),
                easing: Easing.bezier(0.33, 1, 0.68, 1)
            });
            containerTilt.value = withTiming(TABLE_TILT, {
                duration: Math.min(FLIGHT_DURATION, 100),
                easing: Easing.bezier(0.33, 1, 0.68, 1)
            });
        } else {
            containerPerspective.value = 2000;
            containerTilt.value = 0;
        }
    }, [flyingCards.length, containerPerspective, containerTilt]);

    const handleCardDone = (id: string) => {
        completedRef.current.add(id);
        if (completedRef.current.size === totalCardsRef.current) {
            // setTimeout(() => {
                // To avoid closure issues, rely on the store action, or use the zustand state directly here
                const currentFlyingCards = useVisualStore.getState().flyingCards;
                currentFlyingCards.forEach(card => removeFlyingCard(card.id));
            // }, 40);
        }
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: containerPerspective.value },
            { rotateX: `${containerTilt.value}deg` },
        ]
    }));

    if (!discardLayout || flyingCards.length === 0) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
            <Animated.View style={[StyleSheet.absoluteFillObject, containerStyle]}>
                {flyingCards.map((ghost, index) => {
                    const isDraw = ghost.type === 'draw';
                    const fanIndex = ghost.fanIndex ?? 0;
                    const fanPos = getFanPosition(index);
                    const landingX = isDraw ? (ghost.endX || 0) : (discardLayout?.x+scale(10) || 0)+ fanPos.x;
                    // const landingY = isDraw ? (ghost.endY || 0) : (discardLayout?.y - discardLayout?.y/2 +DISCARD_OFFSET.x|| 0) + fanPos.y;
                    const landingY = isDraw ? (ghost.endY || 0) : (discardLayout?.y-scale(DISCARD_OFFSET.y*2));
                    const landingRotation = isDraw ? 0 : scale(fanPos.rotation);
                    const delay = fanIndex * 20; // ✅ Use fanIndex for stagger


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