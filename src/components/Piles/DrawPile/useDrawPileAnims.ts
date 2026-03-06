// src/components/Piles/DrawPile/useDrawPileAnims.ts
import { useEffect, useMemo, useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";

export function useDrawPileAnims(opts: {
    enabled: boolean;
    cardW: number;
    floatY: number;
    topLift: number;
}) {
    const { enabled, cardW, floatY, topLift } = opts;

    const float = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0.4)).current;
    const shimmerX = useRef(new Animated.Value(-cardW)).current;
    const pressScale = useRef(new Animated.Value(1)).current;
    const topCardY = useRef(new Animated.Value(0)).current;

    const innerGlowScaleBase = useRef(new Animated.Value(0.95)).current;
    const glowScaleFactor = useRef(new Animated.Value(0.1)).current;

    const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
    const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
    const shimmerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
    const topLiftLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    const stopAll = useCallback(() => {
        try { floatLoopRef.current?.stop(); } catch {}
        try { glowLoopRef.current?.stop(); } catch {}
        try { shimmerLoopRef.current?.stop(); } catch {}
        try { topLiftLoopRef.current?.stop(); } catch {}
        floatLoopRef.current = null;
        glowLoopRef.current = null;
        shimmerLoopRef.current = null;
        topLiftLoopRef.current = null;
    }, []);

    useEffect(() => {
        if (!enabled) {
            stopAll();
            float.setValue(0);
            glowOpacity.setValue(0.4);
            topCardY.setValue(0);
            shimmerX.setValue(-cardW);
            return;
        }

        floatLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(float, { toValue: -floatY, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        floatLoopRef.current.start();

        glowLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, { toValue: 0.85, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: 0.28, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        glowLoopRef.current.start();

        const from = -cardW;
        const to = cardW * 1.2;
        shimmerX.setValue(from);

        shimmerLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.delay(2500),
                Animated.timing(shimmerX, { toValue: to, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(shimmerX, { toValue: from, duration: 0, useNativeDriver: true }),
            ])
        );
        shimmerLoopRef.current.start();

        topLiftLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.delay(1000),
                Animated.timing(topCardY, { toValue: -topLift, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(topCardY, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
                Animated.delay(2000),
            ])
        );
        topLiftLoopRef.current.start();

        return () => stopAll();
    }, [enabled, cardW, floatY, topLift, stopAll, float, glowOpacity, shimmerX, topCardY]);

    const innerGlowScale = useMemo(
        () => Animated.add(innerGlowScaleBase, Animated.multiply(glowOpacity, glowScaleFactor)),
        [glowOpacity, innerGlowScaleBase, glowScaleFactor]
    );

    const pressIn = useCallback(() => {
        if (!enabled) return;
        Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start();
    }, [enabled, pressScale]);

    const pressOut = useCallback(() => {
        if (!enabled) return;
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
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
