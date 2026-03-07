// src/components/Cards/useAtuCinematic.ts
import { useRef, useState, useCallback } from "react";
import { Animated, Easing } from "react-native";

export function useAtuCinematic() {
    const liftAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // We must control zIndex outside of the native driver
    const [atuZIndex, setAtuZIndex] = useState(10);

    const triggerAtuReveal = useCallback(() => {
        // Reset states
        setAtuZIndex(10);
        liftAnim.setValue(0);
        flipAnim.setValue(0);
        slideAnim.setValue(0);

        // Phase 1: Lift off the deck and move to the side
        Animated.timing(liftAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {

            // Phase 2: Flip the card
            Animated.timing(flipAnim, {
                toValue: 1,
                duration: 450,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }).start(() => {

                // Swap Z-index while the card is clear of the deck
                setAtuZIndex(-1);

                // Phase 3: Slide under the deck into final position
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }).start();
            });
        });
    }, [liftAnim, flipAnim, slideAnim]);

    return {
        liftAnim,
        flipAnim,
        slideAnim,
        atuZIndex,
        triggerAtuReveal
    };
}