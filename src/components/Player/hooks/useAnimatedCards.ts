import { useCallback, useEffect, useMemo, useRef } from "react";
import {useAnimatedStyle, withRepeat, withSpring, withTiming, useSharedValue,Easing} from "react-native-reanimated";

interface FanPosition {
    translateX: any;
    translateY: any;
    rotate: any;
    scale: any;
}

const LIFT_Y = -50;
const LIFT_SCALE = 1.2;

export const useAnimatedCards = (fanPosition: FanPosition, isSelected: boolean, isDiscarding:boolean) => {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    // idle breathe
    const breathe = useSharedValue(0);
    useEffect(() => {
        breathe.value = withRepeat(
            withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);


    // ✅ prevents hover-out race after click
    const isSelectedRef = useRef(isSelected);
    const isDiscardingRef = useRef(isDiscarding);

    useEffect(() => {
        isSelectedRef.current = isSelected;
        isDiscardingRef.current = isDiscarding;
    }, [isSelected]);

    // ✅ selection is the universal truth (mobile + desktop)
    useEffect(() => {
        if (isSelected) {
            translateY.value = withSpring(LIFT_Y);
            scale.value = withSpring(LIFT_SCALE);
        } else {
            translateY.value = withSpring(0);
            scale.value = withSpring(1);
        }
    }, [isSelected, translateY, scale]);

    // ✅ hover only affects non-selected
    const handleHoverIn = useCallback(() => {
        if (isSelectedRef.current || isDiscardingRef.current) return;

        translateY.value = withSpring(LIFT_Y);
        scale.value = withSpring(LIFT_SCALE);
    }, [translateY, scale]);

    const handleHoverOut = useCallback(() => {
        if (isSelectedRef.current || isDiscardingRef.current) return;
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
    }, [translateY, scale]);

    // ========== STYLES =================
    const animatedStyle = useAnimatedStyle(() => {
        const b = breathe.value;            // 0..1
        const breathScale = !isSelected ? (1 + 0.055 * b): 1;  // tiny!
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value * breathScale },
            ],
        };
    });
    const transformStyle = useMemo(
        () => ({
            transform: [
                { translateX: fanPosition.translateX },
                { translateY: fanPosition.translateY },
                { rotate: `${fanPosition.rotate}deg` },
                { scale: fanPosition.scale },
            ],
        }),
        [fanPosition]
    );

    return { animatedStyle, handleHoverIn, handleHoverOut, transformStyle}
};
