import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";

type Options = {
    breatheMs?: number;
    breatheTo?: number; // scale peak
    hapticOnActivate?: boolean;
    hapticStyle?: Haptics.ImpactFeedbackStyle;
};

export function useTurnActiveFx(active: boolean, opts: Options = {}) {
    const {
        breatheMs = 1600,
        breatheTo = 1.05,
        hapticOnActivate = false,
        hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    } = opts;

    const breatheAnim = useRef(new Animated.Value(1)).current;
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);
    const wasActiveRef = useRef(false);

    useEffect(() => {
        // Stop any existing loop
        loopRef.current?.stop();
        loopRef.current = null;

        if (!active) {
            breatheAnim.setValue(1);
            wasActiveRef.current = false;
            return;
        }

        // One-shot haptic on rising edge
        if (hapticOnActivate && !wasActiveRef.current) {
            // fire-and-forget (don't await in effects)
            Haptics.impactAsync(hapticStyle);
        }
        wasActiveRef.current = true;

        const breathe = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: breatheTo,
                    duration: breatheMs / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: breatheMs / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        loopRef.current = breathe;
        breathe.start();

        return () => {
            breathe.stop();
            loopRef.current = null;
        };
    }, [active, breatheMs, breatheTo, hapticOnActivate, hapticStyle, breatheAnim]);

    return { breatheAnim };
}
