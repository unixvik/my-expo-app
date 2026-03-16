import React, { useMemo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    LinearTransition,
    FadeIn,
    useAnimatedRef,
    useDerivedValue,
} from 'react-native-reanimated';
import { GameCard } from './GameCard';
import { calculateCardFan } from '@/utils/animations';
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import { useVisualStore } from "@/state/useVisualStore";
import { updateLayout } from "@/utils/helpers";

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

    const isHovered = useSharedValue(false);
// 1. Create a standard shared value
    const isSelectedSV = useSharedValue(isSelected);

    // 2. EXPLICITLY sync React state to the UI thread.
    // The React Compiler cannot break this.
    React.useEffect(() => {
        isSelectedSV.value = isSelected;
    }, [isSelected]);

    const springConfig = { damping: 14, stiffness: 150, mass: 0.8 };

    const animatedStyle = useAnimatedStyle(() => {
        const target = calculateCardFan(index, totalCards, cardWidth, isSelectedSV.value, isHovered.value);

        return {
            transform: [
                { translateX: withSpring(target.translateX, springConfig) },
                { translateY: withSpring(target.translateY, springConfig) },
                // FIX: Put the string inside the spring!
                { rotateZ: withSpring(`${target.rotateZ}deg`, springConfig) },
                { scale: withSpring(isHovered.value && !isSelectedSV.value ? 1.05 : 1, springConfig) }
            ],
            zIndex: isSelectedSV.value || isHovered.value ? 10 : index,
        };
    });
    const handlePress = () => {
        onToggleSelect(card.id);
    };

    return (
        <Animated.View style={[styles.playerCardWrapper, animatedStyle]}>
            <Pressable
                onPress={handlePress}
                onPressIn={() => { isHovered.value = true; }}
                onPressOut={() => { isHovered.value = false; }}
                style={StyleSheet.absoluteFill}
            >
                <GameCard
                    card={card}
                    isSelected={isSelected}
                    style={styles.playerCardArtwork}
                />

            </Pressable>
        </Animated.View>
    );
};