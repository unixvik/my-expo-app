// src/components/Cards/DrawPile.native.tsx
import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";
import { CardBack } from "../Cards/CardBack";

const TOTAL_CARDS = 30;
const ANIMATED_CARDS = 12;
const CARD_OFFSET = 0.4;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function DrawPile_old({
                      drawCount,
                      onAnimationComplete,
                      onDraw,
                      pileRef,
                      triggerOpponentDraw = 0,
                      opponentDrawTarget = null,
                      triggerMyDraw = 0,
                  }: {
    drawCount: number;
    onAnimationComplete?: () => void;
    onDraw?: () => void;
    pileRef?: React.RefObject<View | null>;
    triggerOpponentDraw?: number;
    opponentDrawTarget?: { x: number; y: number } | null;
    triggerMyDraw?: number;
}) {
    const [cardsDealt, setCardsDealt] = useState(0);
    const [flyingCards, setFlyingCards] = useState<Array<{ id: number; target: { x: number; y: number } }>>([]);


    const lastOppSeqRef = useRef(0);
    const lastMySeqRef = useRef(0);

    // Pulse animation
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0)).current;
    const pulseKey = useRef(0);

    // Pile shake animation
    const pileTranslateY = useRef(new Animated.Value(0)).current;
    const pileRotate = useRef(new Animated.Value(0)).current;

    // Hover/Press scale
    const pressScale = useRef(new Animated.Value(1)).current;

    // Individual card animations for deal-in
    const cardAnimations = useRef(
        Array.from({ length: ANIMATED_CARDS }, () => ({
            bottom: new Animated.Value(600),
            opacity: new Animated.Value(0),
            rotate: new Animated.Value(-180 + Math.random() * 20),
        }))
    ).current;

    // Deal-in animation
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < ANIMATED_CARDS) {
                const globalIndex = (TOTAL_CARDS - ANIMATED_CARDS) + i;
                Animated.parallel([
                    Animated.spring(cardAnimations[i].bottom, {
                        toValue: globalIndex * CARD_OFFSET,
                        stiffness: 280,
                        damping: 16,
                        mass: 0.7 + i * 0.08,
                        useNativeDriver: false,
                    }),
                    Animated.timing(cardAnimations[i].opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.spring(cardAnimations[i].rotate, {
                        toValue: 0,
                        stiffness: 280,
                        damping: 16,
                        useNativeDriver: false,
                    }),
                ]).start(() => {
                    if (i === ANIMATED_CARDS - 1) onAnimationComplete?.();
                });

                setCardsDealt((prev) => prev + 1);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 80);

        return () => clearInterval(interval);
    }, []);

    // Opponent draw flight
    useEffect(() => {
        if (!opponentDrawTarget) return;
        if (triggerOpponentDraw <= lastOppSeqRef.current) return;
        lastOppSeqRef.current = triggerOpponentDraw;

        const newCard = {
            id: Date.now() + Math.random(),
            target: opponentDrawTarget,
        };

        setFlyingCards((prev) => [...prev, newCard]);

        // Flying card animation handled below in render
        setTimeout(() => {
            setFlyingCards((prev) =>
                prev.filter((c) => c.id !== newCard.id)
            );
        }, 700);
    }, [triggerOpponentDraw, opponentDrawTarget]);

    // My draw pulse
    useEffect(() => {
        if (triggerMyDraw <= lastMySeqRef.current) return;
        lastMySeqRef.current = triggerMyDraw;
        pulseKey.current += 1;

        // Shake pile
        Animated.sequence([
            Animated.timing(pileTranslateY, { toValue: -8, duration: 70, useNativeDriver: true }),
            Animated.timing(pileTranslateY, { toValue: 0, duration: 70, useNativeDriver: true }),
        ]).start();

        Animated.sequence([
            Animated.timing(pileRotate, { toValue: -3, duration: 70, useNativeDriver: true }),
            Animated.timing(pileRotate, { toValue: 3, duration: 70, useNativeDriver: true }),
            Animated.timing(pileRotate, { toValue: 0, duration: 70, useNativeDriver: true }),
        ]).start();

        // Pulse ring
        pulseScale.setValue(1);
        pulseOpacity.setValue(0.9);
        Animated.parallel([
            Animated.timing(pulseScale, {
                toValue: 1.35,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
        ]).start();
    }, [triggerMyDraw]);

    const handlePressIn = () => {
        if (drawCount <= 0) return;
        Animated.spring(pressScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (drawCount <= 0) return;
        onDraw?.();
    };

    const staticCards = TOTAL_CARDS - ANIMATED_CARDS;
    const pileRotateInterpolate = pileRotate.interpolate({
        inputRange: [-10, 10],
        outputRange: ["-10deg", "10deg"],
    });

    return (
      <>
        {/*// <View style={styles.container}>*/}
            {/* Label */}
            <Text style={styles.label}>DRAW ({drawCount})</Text>

            {/* Pile */}
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={drawCount <= 0}
                activeOpacity={1}
            >
                <Animated.View
                    ref={pileRef as any}
                    style={[
                        styles.pileContainer,
                        {
                            opacity: drawCount <= 0 ? 0.5 : 1,
                            transform: [
                                { scale: pressScale },
                                { translateY: pileTranslateY },
                                { rotate: pileRotateInterpolate },
                            ],
                        },
                    ]}
                >
                    {/* Static bottom cards */}
                    {Array.from({ length: staticCards }).map((_, i) => (
                        <View
                            key={`s-${i}`}
                            style={[
                                styles.cardBase,
                                {
                                    bottom: i * CARD_OFFSET,
                                    zIndex: i,
                                },
                            ]}
                        >
                            <CardBack />
                        </View>
                    ))}

                    {/* Animated deal-in cards */}
                    {Array.from({ length: ANIMATED_CARDS }).map((_, i) => {
                        const globalIndex = staticCards + i;
                        const rotateInterp = cardAnimations[i].rotate.interpolate({
                            inputRange: [-200, 200],
                            outputRange: ["-200deg", "200deg"],
                        });

                        return i < cardsDealt ? (
                            <Animated.View
                                key={`a-${i}`}
                                style={[
                                    styles.cardBase,
                                    {
                                        zIndex: globalIndex,
                                        bottom: cardAnimations[i].bottom,
                                        opacity: cardAnimations[i].opacity,
                                        transform: [{ rotate: rotateInterp }],
                                    },
                                ]}
                            >
                                <CardBack />
                            </Animated.View>
                        ) : null;
                    })}

                    {/* Flying cards for opponent draws */}
                    {flyingCards.map((card) => (
                        <FlyingCard
                            key={card.id}
                            target={card.target}
                            onComplete={() =>
                                setFlyingCards((prev) =>
                                    prev.filter((c) => c.id !== card.id)
                                )
                            }
                        />
                    ))}

                    {/* Pulse ring on confirmed my draw */}
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                transform: [{ scale: pulseScale }],
                                opacity: pulseOpacity,
                            },
                        ]}
                        pointerEvents="none"
                    />
                </Animated.View>
            </TouchableOpacity>
        {/*</View>*/}
            </>
    );
}

// Separated flying card component for cleaner animation
function FlyingCard({
                        target,
                        onComplete,
                    }: {
    target: { x: number; y: number };
    onComplete: () => void;
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: target.x,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: target.y,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.8, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.1, duration: 300, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.9, duration: 300, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(rotate, { toValue: 5, duration: 200, useNativeDriver: true }),
                Animated.timing(rotate, { toValue: -5, duration: 200, useNativeDriver: true }),
                Animated.timing(rotate, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
        ]).start(onComplete);
    }, []);

    const rotateInterp = rotate.interpolate({
        inputRange: [-10, 10],
        outputRange: ["-10deg", "10deg"],
    });

    return (
        <Animated.View
            style={[
                styles.cardBase,
                styles.flyingCard,
                {
                    transform: [
                        { translateX },
                        { translateY },
                        { scale },
                        { rotate: rotateInterp },
                    ],
                    opacity,
                },
            ]}
            pointerEvents="none"
        >
            <CardBack />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        alignItems: "center",
        transform: [{ translateY: -80 }],
        userSelect: "none",
        zIndex: 10,
    },
    label: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        fontWeight: "bold",
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    pileContainer: {
        position: "relative",
        width: 70,
        height: 120 + TOTAL_CARDS * CARD_OFFSET,
    },
    cardBase: {
        position: "absolute",
        width: 70,
        height: 100,
        left: 0,
    },
    flyingCard: {
        bottom: TOTAL_CARDS * CARD_OFFSET,
        zIndex: 1000,
    },
    pulseRing: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 8,
        borderWidth: 4,
        borderColor: "rgba(147, 197, 253, 1)",
        pointerEvents: "none",
    },
});

export default DrawPile;