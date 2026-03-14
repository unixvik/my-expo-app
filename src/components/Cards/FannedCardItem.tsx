import {BASE_CARD_WIDTH, DISCARD_OFFSET} from "@/state/constants";
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import React from "react";
import {GameCard} from "@/components/Cards/GameCard";

// @ts-ignore
export const FannedCardItem = ({ card, index, isClosing, scale, styles }) => {
    // Current fan spread positions
    const fanRotation = (index * 8) + 12;
    const fanX = scale(DISCARD_OFFSET.x + (index * 12));
    const fanY = scale(DISCARD_OFFSET.y - (index * 2));

    // Initialize with spread values
    const rotation = useSharedValue(fanRotation);
    const translateX = useSharedValue(fanX);
    const translateY = useSharedValue(fanY);

    // Watch the isClosing prop to trigger "Suck back into pile" animation
    React.useEffect(() => {
        if (isClosing) {
            const config = { duration: 350, easing: Easing.out(Easing.quad) };
            rotation.value = withTiming(0, config);
            translateX.value = withTiming(0, config);
            translateY.value = withTiming(0, config);
        }
    }, [isClosing]);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: translateX.value,
        top: translateY.value,
        transform: [{ rotateZ: `${rotation.value}deg` }],
        zIndex: 10 + index,
        elevation: 10 + index,
        ...styles.cardSlot
    }));

    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <GameCard
                card={card}
                cardWidth={BASE_CARD_WIDTH}
                style={styles.tableCardArtwork}
            />
        </Animated.View>
    );
};
