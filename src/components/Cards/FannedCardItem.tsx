import {BASE_CARD_WIDTH, getFanPosition} from "@/state/constants";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from "react-native-reanimated";
import React from "react";
import {CardFace} from "@/components/Cards/CardFace";
import {useResponsive} from "@/hooks/useResponsive";

// @ts-ignore
export const FannedCardItem = ({card, index, isClosing, styles}) => {
    const {x: fanX, y: fanY, rotation: fanRotation} = getFanPosition(index);
    // console.log("FannedCardItem", card, index);
    const { scale } = useResponsive();
    const translateXScaled = scale(0);
    // Initialize with spread value
    const rotation = useSharedValue(fanRotation);
    const translateX = useSharedValue(fanX+translateXScaled);
    const translateY = useSharedValue(fanY);
    const scaleX = useSharedValue(0.9); // Start small
    // const opacity = useSharedValue(0); // ✅ Start invisible

    // ✅ Fade in when mounted
    React.useEffect(() => {
        const delay = index * 20;
        scaleX.value = withDelay(
            delay,
            withSpring(1, { damping: 8, stiffness: 1300 }) // Bouncy entrance
        );
    }, []);


    // Watch the isClosing prop to trigger "Suck back into pile" animation
    React.useEffect(() => {
        if (isClosing) {
            const config = {duration: 350, easing: Easing.out(Easing.quad)};
            rotation.value = withTiming(0, config);
            translateX.value = withTiming(0, config);
            translateY.value = withTiming(0, config);

        }
    }, [isClosing]);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: translateX.value,
        top: translateY.value,

        zIndex: 10 + index,
        elevation: 10 + index,
        transform: [
            {rotateZ: `${rotation.value}deg`},
            {scale: scaleX.value}, // ✅ Add scale
        ],

        ...styles.cardSlotDraw
    }));
    // console.log("[BEFORE RETURN]FannedCardItem", card, index);
    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <CardFace
                cardId={card}
                isFacedown={false}
                // cardWidth={BASE_CARD_WIDTH}
                style={styles.tableCardArtwork}
            />
        </Animated.View>
    );
};
