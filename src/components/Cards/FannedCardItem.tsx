import {BASE_CARD_WIDTH, getFanPosition} from "@/state/constants";
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import React from "react";
import {CardFace} from "@/components/Cards/CardFace";
import {useResponsive} from "@/hooks/useResponsive";
// import {GameCard} from "@/components/Cards/GameCard";

// @ts-ignore
export const FannedCardItem = ({card, index, isClosing, styles}) => {
    const {x: fanX, y: fanY, rotation: fanRotation} = getFanPosition(index);
    // console.log("FannedCardItem", card, index);
    const { scale } = useResponsive();
    // Initialize with spread values
    const rotation = useSharedValue(fanRotation);
    const translateX = useSharedValue(fanX);
    const translateY = useSharedValue(fanY);

    // Watch the isClosing prop to trigger "Suck back into pile" animation
    React.useEffect(() => {
        if (isClosing) {
            const config = {duration: 350, easing: Easing.out(Easing.quad)};
            rotation.value = withTiming(0, config);
            translateX.value = withTiming(0, config);
            translateY.value = withTiming(0, config);
        }
    }, [isClosing]);
    const translateXScaled = scale(20);
    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: translateX.value,
        top: translateY.value,
        transform: [{rotateZ: `${rotation.value}deg`}, {translateX: translateXScaled}],
        zIndex: 10 + index,
        elevation: 10 + index,
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
