import React, {useEffect, useMemo} from 'react';
import {StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { GameCard } from './GameCard';
import { calculateCardFan } from '@/utils/animations';
import {useTheme} from "@/hooks/useTheme";
import {useResponsive} from "@/hooks/useResponsive";
import {createStyles} from "@/components/Screens/GameBoard.styles";

interface AnimatedHandCardProps {
    card: any;
    index: number;
    totalCards: number;
    cardWidth: number;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

export const AnimatedHandCard = ({
                                     card, index, totalCards, cardWidth, isSelected, onToggleSelect
                                 }: AnimatedHandCardProps) => {

    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);



    // Local Interaction State
    const isHovered = useSharedValue(false);

    // Spring physics for that premium cinematic feel
    const springConfig = { damping: 14, stiffness: 150, mass: 0.8 };

    // The core style engine
    const animatedStyle = useAnimatedStyle(() => {
        // Run the math on the UI thread for 60fps performance
        const target = calculateCardFan(index, totalCards, cardWidth, isSelected, isHovered.value);

        return {
            transform: [
                { translateX: withSpring(target.translateX, springConfig) },
                { translateY: withSpring(target.translateY, springConfig) },
                { rotateZ: withSpring(target.rotateZ, springConfig) },
                { scale: withSpring(isHovered.value && !isSelected ? 1.05 : 1, springConfig) }
            ],
            // Dynamically elevate the Z-index so hovered/selected cards pop over their neighbors
            zIndex: isSelected || isHovered.value ? 100 : index,
        };
    }, [index, totalCards, cardWidth, isSelected]); // Re-run if hand changes

    return (
        <Animated.View style={[styles.playerCardWrapper, animatedStyle, { position: 'absolute' }]}>
            <Pressable
                onPress={() => onToggleSelect(card.id)}
                onPressIn={() => { isHovered.value = true; }}
                onPressOut={() => { isHovered.value = false; }}
                style={StyleSheet.absoluteFill} // Make the touch area fill the Physics Box
            >
                <GameCard
                    card={card}
                    isSelected={isSelected}
                    // Pass the canvas style down to the actual visual component
                    style={styles.playerCardArtwork}
                />
            </Pressable>
        </Animated.View>
    );
};