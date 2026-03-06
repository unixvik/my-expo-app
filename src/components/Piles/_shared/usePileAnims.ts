// src/components/Piles/_shared/usePileAnims.ts
import { useEffect, useMemo, useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";

export function usePileAnims(opts: {
    enabled: boolean;
    floatY: number;
    glowMin: number;
    glowMax: number;
    glowDur: number;
}) {
    const { enabled, floatY, glowMin, glowMax, glowDur } = opts;

    const float = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(glowMin)).current;
    const pressScale = useRef(new Animated.Value(1)).current;
    const shakeX = useRef(new Animated.Value(0)).current;

    const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
    const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    const stop = useCallback(() => {
        try { floatLoopRef.current?.stop(); } catch {}
        try { glowLoopRef.current?.stop(); } catch {}
        floatLoopRef.current = null;
        glowLoopRef.current = null;
    }, []);

    useEffect(() => {
        if (!enabled) {
            stop();
            float.setValue(0);
            glowOpacity.setValue(glowMin);
            shakeX.setValue(0);
            return;
        }

        floatLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(float, { toValue: -floatY, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        floatLoopRef.current.start();

        glowLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, { toValue: glowMax, duration: glowDur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: glowMin, duration: glowDur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        glowLoopRef.current.start();

        return () => stop();
    }, [enabled, floatY, glowMin, glowMax, glowDur, stop, float, glowOpacity, shakeX]);

    const pressIn = useCallback(() => {
        if (!enabled) return;
        Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, speed: 28 }).start();
    }, [enabled, pressScale]);

    const pressOut = useCallback(() => {
        if (!enabled) return;
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 18 }).start();
    }, [enabled, pressScale]);

    const impactShake = useCallback(() => {
        if (!enabled) return;
        Animated.sequence([
            Animated.timing(shakeX, { toValue: 6, duration: 35, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -5, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 2, duration: 35, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
    }, [enabled, shakeX]);

    return { float, glowOpacity, pressScale, shakeX, pressIn, pressOut, impactShake };
}
