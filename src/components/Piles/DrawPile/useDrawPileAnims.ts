// src/components/Piles/DrawPile/useDrawPileAnims.ts
import { useEffect, useCallback } from "react";
import {
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    withSpring,
    Easing,
    useDerivedValue,
    cancelAnimation
} from "react-native-reanimated";

export function useDrawPileAnims(opts: {
    enabled: boolean;
    cardW: number;
    floatY: number;
    topLift: number;
}) {
    const { enabled, cardW, floatY, topLift } = opts;

    // 1. Convert to SharedValues
    const float = useSharedValue(0);
    const glowOpacity = useSharedValue(0.4);
    const shimmerX = useSharedValue(-cardW);
    const pressScale = useSharedValue(1);
    const topCardY = useSharedValue(0);

    const stopAll = useCallback(() => {
        cancelAnimation(float);
        cancelAnimation(glowOpacity);
        cancelAnimation(shimmerX);
        cancelAnimation(topCardY);
        cancelAnimation(pressScale);
    }, [float, glowOpacity, shimmerX, topCardY, pressScale]);

    useEffect(() => {
        if (!enabled) {
            stopAll();
            float.value = 0;
            glowOpacity.value = 0.4;
            topCardY.value = 0;
            shimmerX.value = -cardW;
            return;
        }

        // Float loop (Yoyo)
        float.value = withRepeat(
            withTiming(-floatY, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );

        // Glow loop (Yoyo)
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.85, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.28, { duration: 1800, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        // Shimmer loop (Restarting)
        shimmerX.value = -cardW;
        shimmerX.value = withRepeat(
            withSequence(
                withDelay(2500, withTiming(cardW * 1.2, { duration: 800, easing: Easing.out(Easing.quad) })),
                withTiming(-cardW, { duration: 0 })
            ),
            -1,
            false
        );

        // Top lift loop (Restarting)
        topCardY.value = withRepeat(
            withSequence(
                withDelay(1000, withTiming(-topLift, { duration: 600, easing: Easing.out(Easing.cubic) })),
                withTiming(0, { duration: 600, easing: Easing.inOut(Easing.cubic) }),
                withDelay(2000, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );

        return () => stopAll();
    }, [enabled, cardW, floatY, topLift, stopAll]);

    // 2. Convert Animated.add to useDerivedValue
    const innerGlowScale = useDerivedValue(() => {
        return 0.95 + glowOpacity.value * 0.1;
    });

    const pressIn = useCallback(() => {
        if (!enabled) return;
        pressScale.value = withSpring(0.94, { damping: 15, stiffness: 200 });
    }, [enabled, pressScale]);

    const pressOut = useCallback(() => {
        if (!enabled) return;
        pressScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    }, [enabled, pressScale]);

    return {
        float,
        glowOpacity,
        shimmerX,
        pressScale,
        topCardY,
        innerGlowScale,
        pressIn,
        pressOut,
    };
}