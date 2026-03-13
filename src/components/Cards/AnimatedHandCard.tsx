import React, { useMemo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    LinearTransition,
    FadeIn, useAnimatedRef, measure // Adăugat pentru o intrare fluidă
} from 'react-native-reanimated';
import { GameCard } from './GameCard';
import { calculateCardFan, createDiscardAnimation } from '@/utils/animations';
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import {useGameStore} from "@/state/useGameStore";
import {runOnJS} from "react-native-worklets";

interface AnimatedHandCardProps {
    card: any;
    index: number;
    totalCards: number;
    cardWidth: number;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    discardTarget: { x: number; y: number; width: number; height: number } | null;
}

export const AnimatedHandCard = ({
                                     card, discardTarget, index, totalCards, cardWidth, isSelected, onToggleSelect
                                 }: AnimatedHandCardProps) => {

    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);

    const isHovered = useSharedValue(false);
    const springConfig = { damping: 14, stiffness: 150, mass: 0.8 };

    const animatedStyle = useAnimatedStyle(() => {
        const target = calculateCardFan(index, totalCards, cardWidth, isSelected, isHovered.value);

        return {
            transform: [
                { translateX: withSpring(target.translateX, springConfig) },
                { translateY: withSpring(target.translateY, springConfig) },
                { rotateZ: withSpring(target.rotateZ, springConfig) },
                { scale: withSpring(isHovered.value && !isSelected ? 1.05 : 1, springConfig) }
            ],
            zIndex: isSelected || isHovered.value ? 10 : index,
        };
    }, [index, totalCards, cardWidth, isSelected]);

    const animatedRef = useAnimatedRef<Animated.View>();
    const setHandPosition = useGameStore(s => s.setHandPosition);

    const updatePos = () => {
        'worklet';
        const m = measure(animatedRef);
        if (m) {
            runOnJS(setHandPosition)(card.id, {
                x: m.pageX + m.width / 2, // Centrul global X
                y: m.pageY + m.height / 2  // Centrul global Y
            });
        }
    };




    return (
        <Animated.View
            layout={LinearTransition.springify().damping(15)}
            entering={FadeIn.duration(300)}
            // exiting={discardAnimation}
            style={[styles.playerCardWrapper, animatedStyle, { position: 'absolute',zIndex: 1000 }]}
        >
            <Pressable
                onPress={() => onToggleSelect(card.id)}
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
