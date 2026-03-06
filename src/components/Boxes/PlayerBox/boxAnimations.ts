import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";

const BREATHE_MS = 1600;

export function usePlayerBoxFx(active: boolean) {
    const breatheAnim = useRef(new Animated.Value(1)).current;
    const breatheLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        breatheLoopRef.current?.stop();
        breatheLoopRef.current = null;

        if (!active) {
            breatheAnim.setValue(1);
            return;
        }

        // Single haptic pulse
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const breathe = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1.05,
                    duration: BREATHE_MS / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: BREATHE_MS / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        breatheLoopRef.current = breathe;
        breathe.start();

        return () => {
            breathe.stop();
        };
    }, [active, breatheAnim]);

    return { breatheAnim };
}
