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
    CENTER_TABLE_CARD_SCALE,
    CARD_ASPECT_RATIO,
    PLAYER_CARD_WIDTH,
    CARD_PLAYER_SCALE_RATIO,
    rnShadow,
    TABLE_PERSPECTIVE,
    TABLE_TILT,
    getFanPosition,
    DISCARD_OFFSET,
    FLIGHT_DURATION, Z_INDEX,
} from '@/state/constants';
import { useResponsive } from '@/hooks/useResponsive';
import { CardFace } from "@/components/Cards/CardFace";

// Card component without shadow
export const FlyingCardItem = ({ ghost, cardWidth, cardHeight, sizeScaleRatio = 1, targetX, targetY, targetRotation, delay, zIndex = 0, onDone }: any) => {
    const flightProgress = useSharedValue(0);
    const impactProgress = useSharedValue(0);
    const baseShadow = rnShadow("contact");

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
                    impactProgress.value = withTiming(1, { duration: 1300 }, (ok) => {
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
        const arc = arcMultiplier * 150;

        const squash = Math.sin(imp * Math.PI) * interpolate(imp, [0, 1], [0.12, 0]);
        const sizeScale = interpolate(p, [0, 1], [1.1, sizeScaleRatio]);
        const scaleX = (1 + squash) * interpolate(arcMultiplier, [0, 0.5, 1], [1, 1.1, 1]) * sizeScale;
        const scaleY = (1 - squash) * interpolate(arcMultiplier, [0, 0.5, 1], [1, 1.1, 1]) * sizeScale;

        const brightness = interpolate(p, [0, 0.9, 1], [100 , 60, 50]);
        // console.log(brightness);
        return {
            transform: [
                { translateX: interpolate(p, [0, 1], [safeStartX, targetX]) },
                { translateY: interpolate(p, [0, 1], [safeStartY, targetY]) + arc },
                { scaleX },
                { scaleY },

                { rotateZ: `${interpolate(p, [0, 1], [0, targetRotation]) + wobble}deg` },
            ],
            // ✅ Fade out at end for crossfade
            // opacity: interpolate(p, [0, 0.85, 1], [0.1, 0.8, 1]),
            filter: `brightness(${brightness}%)`,
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
                    zIndex,
                    elevation: zIndex,
                },
                animatedCardStyle,
                // ✅ U
                //
                // se React Native shadow (stays with card in 3D space)
                baseShadow,
            ]}
            pointerEvents="none"
        >
            <CardFace
                cardId={ghost.card}
                isFacedown={ghost.isFacedown}
                // style={{ width: '100%', height: '100%' }}
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

    const centerCardWidth = scale(BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE);
    const centerCardHeight = centerCardWidth * CARD_ASPECT_RATIO;
    const playerCardWidth = scale(PLAYER_CARD_WIDTH * CARD_PLAYER_SCALE_RATIO);
    const playerCardHeight = playerCardWidth * CARD_ASPECT_RATIO;

    const containerPerspective = useSharedValue(2000);
    const containerTilt = useSharedValue(0);


    useEffect(() => {
        completedRef.current.clear();
        totalCardsRef.current = flyingCards.length;

        // if (flyingCards.length > 0) {
        //     containerPerspective.value = withTiming(TABLE_PERSPECTIVE, {
        //         duration: Math.min(FLIGHT_DURATION, 100),
        //         easing: Easing.bezier(0.33, 1, 0.68, 1)
        //     });
        //     containerTilt.value = withTiming(TABLE_TILT, {
        //         duration: Math.min(FLIGHT_DURATION, 100),
        //         easing: Easing.bezier(0.33, 1, 0.68, 1)
        //     });
        // } else {
        //     containerPerspective.value = 2000;
        //     containerTilt.value = 0;
        // }
    }, [flyingCards.length, containerPerspective, containerTilt]);

    const handleCardDone = (id: string) => {
        completedRef.current.add(id);
        if (completedRef.current.size === totalCardsRef.current) {
            setTimeout(() => {
                // To avoid closure issues, rely on the store action, or use the zustand state directly here
                const currentFlyingCards = useVisualStore.getState().flyingCards;
                currentFlyingCards.forEach(card => removeFlyingCard(card.id));
            }, 10);
        }
    };


    if (!discardLayout || flyingCards.length === 0) return null;

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: Z_INDEX.MODALS }]}>
            <Animated.View style={[StyleSheet.absoluteFillObject]}>
                {flyingCards.map((ghost, index) => {
                    const isDraw = ghost.type === 'draw';
                    const fanIndex = ghost.fanIndex ?? 0;
                    const fanPos = getFanPosition(index);
                    const landingX = isDraw ? (ghost.endX || 0) : discardLayout?.x + fanPos.x;
                    const landingY = isDraw ? (ghost.endY || 0) : (discardLayout?.y +DISCARD_OFFSET.y);
                    const landingRotation = isDraw ? 0 : fanPos.rotation;
                    const delay = fanIndex * 30; // ✅ Use fanIndex for stagger

                    const startWidth = isDraw ? centerCardWidth : playerCardWidth;
                    const startHeight = isDraw ? centerCardHeight : playerCardHeight;
                    const endWidth = isDraw ? playerCardWidth : centerCardWidth;
                    const sizeScaleRatio = endWidth / startWidth;

                    return (
                        <FlyingCardItem
                            key={ghost.id}
                            ghost={ghost}
                            cardWidth={startWidth}
                            cardHeight={startHeight}
                            sizeScaleRatio={sizeScaleRatio}
                            targetX={landingX}
                            targetY={landingY}
                            targetRotation={landingRotation}
                            delay={delay}
                            zIndex={index}
                            onDone={() => handleCardDone(ghost.id)}
                        />
                    );
                })}
            </Animated.View>
        </View>
    );
};