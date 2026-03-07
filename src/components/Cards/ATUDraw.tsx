// src/components/Cards/ATUDraw.tsx
import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useGameSelector, shallowEqual } from "@/state/machine/useGameSelector";
import { selectAtuCards } from "@/state/machine/selector";
import { CardFace } from "@/components/Cards/CardFace/CardFace";
import { CardBack } from "@/components/Cards/CardBack";
import { useAtuCinematic } from "./useAtuCinematics";

type Props = {
    cardW: number;
    cardH: number;
    cardR: number;
    scaleMul: number;
    delayReveal?: boolean;
};

export const ATUDraw = memo(function ATUDraw({ cardW, cardH, cardR, scaleMul, delayReveal }: Props) {
    const atuCards = useGameSelector(selectAtuCards, shallowEqual);
    // const atuRevealed = useGameSelector(s => (s.ui.dealReveal["__atu__"] ?? 0) > 0);
const atuRevealed=true;
    const { liftAnim, flipAnim, slideAnim, atuZIndex, triggerAtuReveal } = useAtuCinematic();

    useEffect(() => {
        // Trigger the cinematic sequence when the ATU card is officially revealed
        if (atuCards.length > 0 && atuRevealed && !delayReveal) {
            triggerAtuReveal();
        }
    }, [atuCards.length, atuRevealed, delayReveal, triggerAtuReveal]);

    const atu0 = atuCards.length > 0 ? atuCards[0] : null;
    if (!atu0) return null;

    // Interpolations for the cinematic phases
    const translateY = Animated.add(
        liftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -cardH * 0.8] }),
        slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, cardH * 1] })
    );

    const translateX = Animated.add(
        liftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, cardW * 1.2] }),
        slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -cardW * 0.5] })
    );

    const rotateY = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"]
    });

    const rotateZ = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "100deg"] // Final resting angle
    });

    // Handle face/back opacity during the 3D flip
    const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                {
                    width: cardW,
                    height: cardH,
                    zIndex: atuZIndex,
                    transform: [
                        { perspective: 1000 },
                        { translateY },
                        { translateX },
                        { rotateZ },
                        { rotateY },
                        { scaleX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) }
                    ],
                }
            ]}
        >
            {/* Card Back (Visible before flip) */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: backOpacity }]}>
                <CardBack scaleMul={scaleMul} />
            </Animated.View>

            {/* Card Face & ATU Border (Visible after flip) */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: frontOpacity, transform: [{ rotateY: "180deg" }] }]}>
                <View style={[StyleSheet.absoluteFill, { left: -10, width: cardW + 20, borderWidth: Math.max(1, 3 * scaleMul), borderRadius: cardR, borderColor: "rgba(202,138,4,0.60)" }]} />
                <Text style={[styles.label, { fontSize: Math.max(8, 15 * scaleMul), top: -18 * scaleMul }]}>ATU</Text>
                <CardFace card={atu0} />
            </Animated.View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    label: {
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        color: "rgba(202,138,4,0.70)",
        fontWeight: "800",
        letterSpacing: 2,
    },
});