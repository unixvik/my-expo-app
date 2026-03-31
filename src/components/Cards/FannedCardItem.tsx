import {getFanPosition} from "@/state/constants";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    withSequence,
} from "react-native-reanimated";
import React from "react";
import {CardFace} from "@/components/Cards/CardFace";

// Random jitter helper
const randomJitter = (base: number, range: number) => base + (Math.random() - 0.5) * range;

// @ts-ignore
export const FannedCardItem = ({card, index, isClosing, styles, cardWidth}: any) => {
    const {x: fanX, y: fanY, rotation: fanRotation} = getFanPosition(index);

    // Jitter target — fixed per mount (card's resting position)
    const jitteredRotation = React.useRef(randomJitter(fanRotation, 8)).current;
    const jitteredX = React.useRef(randomJitter(fanX, 6)).current;
    const jitteredY = React.useRef(randomJitter(fanY, 6)).current;

    // Start at exact fan position, no jitter yet
    const rotation = useSharedValue(fanRotation);
    const translateX = useSharedValue(fanX);
    const translateY = useSharedValue(fanY);
    const scaleVal = useSharedValue(0.85);
    const brightness = useSharedValue(100);

    // On mount: fade in, scale up, then drift into jittered resting position
    React.useEffect(() => {
        const stagger = index * 40;
        brightness.value = withDelay(stagger, withTiming(50, {duration: 0}));
        scaleVal.value = withDelay(stagger, withSpring(1, {damping: 10, stiffness: 300}));
        rotation.value = withDelay(stagger + 80, withTiming(jitteredRotation, {
            duration: 250,
            easing: Easing.out(Easing.quad)
        }));
        translateX.value = withDelay(stagger + 80, withTiming(jitteredX, {
            duration: 250,
            easing: Easing.out(Easing.quad)
        }));
        translateY.value = withDelay(stagger + 80, withTiming(jitteredY, {
            duration: 250,
            easing: Easing.out(Easing.quad)
        }));
    }, []);

    // ✅ Closing animation with jitter wobble
    React.useEffect(() => {
        if (isClosing) {
            const config = {duration: 350, easing: Easing.out(Easing.quad)};

            // Add a little jitter wobble before settling
            rotation.value = withSequence(
                withTiming(jitteredRotation + 5, {duration: 100}),
                withTiming(jitteredRotation - 3, {duration: 100}),
                withTiming(0, config) // Final settle
            );

            translateX.value = withTiming(0, config);
            translateY.value = withTiming(0, config);
            // opacity.value = withTiming(0, config);
        }
    }, [isClosing, jitteredRotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: translateX.value,
        top: translateY.value,
        filter: `brightness(${brightness.value}%)`,
        zIndex: 10 + index,
        elevation: 10 + index,
        transform: [
            {rotateZ: `${rotation.value+10}deg`},
            // {scale: scaleVal.value},
        ],
        // ...styles.cardSlotDraw
    }));

    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <CardFace
                cardId={card}
                isFacedown={false}
                cardWidth={cardWidth}
                // style={"fanned"}
            />
        </Animated.View>
    );
};