import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    useAnimatedRef,
    useDerivedValue,
    SharedValue,
} from 'react-native-reanimated';
import { CardFace } from './CardFace';
import { calculateCardFan } from '@/utils/animations';
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import { updateLayout } from "@/utils/helpers";
import { Pressable } from "react-native-gesture-handler";

interface AnimatedHandCardProps {
    card: any;
    index: number;
    totalCards: number;
    cardWidth: number;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    hoveredCardId: SharedValue<string | null>;
}

export const AnimatedHandCard = ({
                                     card,
                                     index,
                                     totalCards,
                                     cardWidth,
                                     isSelected,
                                     onToggleSelect,
                                     hoveredCardId,
                                 }: AnimatedHandCardProps) => {

    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);

    const isMouseHovered = useSharedValue(false);
    const isSelectedSV = useSharedValue(isSelected);
    const playerRef = useAnimatedRef<View>();

    React.useEffect(() => {
        // 🌟 Trigger a fun "pop" animation when selection changes
        if (isSelected) {
            // Overshoot then settle - feels playful but controlled
            isSelectedSV.value = withSequence(
                withSpring(1.15, { damping: 8, stiffness: 300 }), // Quick pop
                withSpring(1, { damping: 12, stiffness: 200 })     // Settle back
            );
        } else {
            // Smooth deselection
            isSelectedSV.value = withSpring(0, { damping: 15, stiffness: 180 });
        }
    }, [isSelected]);

    const isActive = useDerivedValue(() => {
        return isMouseHovered.value || hoveredCardId.value === card.id;
    });

    const springConfig = { damping: 14, stiffness: 150, mass: 0.8 };

    const animatedStyle = useAnimatedStyle(() => {
        const target = calculateCardFan(index, totalCards, cardWidth, isSelected, isActive.value);

        // 🌟 Selection scale: interpolate from the sequenced animation value
        const selectionScale = isSelected ? isSelectedSV.value : 1;

        // 🌟 Hover scale (only when NOT selected)
        const hoverScale = isActive.value && !isSelected ? 1.1 : 1;

        // 🌟 Combine both scales
        const finalScale = selectionScale * hoverScale;

        return {
            transform: [
                { translateX: withSpring(target.translateX, springConfig) },
                { translateY: withSpring(target.translateY + (isActive.value ? -20 : 0), springConfig) },
                { rotateZ: withSpring(`${target.rotateZ}deg`, springConfig) },
                { scale: finalScale } // No spring here - isSelectedSV already animated
            ],
            zIndex: isSelected || isActive.value ? 100 : index,
        };
    });

    // 🌟 Shadow and glow animation for selection
    const selectionGlowStyle = useAnimatedStyle(() => {
        const glowIntensity = isSelected ? isSelectedSV.value : 0;

        return {
            // Dramatic shadow increase
            elevation: withSpring(isSelected ? 24 : 8, { damping: 15, stiffness: 200 }),
            shadowOpacity: 0.3 + (glowIntensity * 0.3), // 0.3 → 0.6
            shadowRadius: 6 + (glowIntensity * 10),      // 6 → 16
            shadowColor: isSelected ? theme.cards.selectedBorder : '#000',

            // Subtle glow effect
            backgroundColor: `rgba(255, 255, 255, ${glowIntensity * 0.08})`,
        };
    });

    return (
        <Animated.View style={[styles.playerCardWrapper, animatedStyle, selectionGlowStyle]}>
            <Pressable
                ref={playerRef}
                onLayout={() => updateLayout('player', playerRef, card.id)}
                onPressOut={Platform.OS === 'web' ? () => {
                    onToggleSelect(card.id)
                } : undefined}
                style={StyleSheet.absoluteFill}
                onMouseEnter={() => { isMouseHovered.value = true; }}
                onMouseLeave={() => { isMouseHovered.value = false; }}
            >
                <CardFace
                    card={card}
                    isSelected={isSelected}
                />
            </Pressable>
        </Animated.View>
    );
};