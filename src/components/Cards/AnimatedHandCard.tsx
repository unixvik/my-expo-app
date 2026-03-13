import React, { useMemo, useRef } from 'react';
import { StyleSheet, Pressable, View, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    LinearTransition,
    FadeIn,
    FadeOut,
    useAnimatedRef,
} from 'react-native-reanimated';
import { GameCard } from './GameCard';
import {calculateCardFan, createDiscardAnimation} from '@/utils/animations';
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import {useGameStore} from "@/state/useGameStore";

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
    // Plain ref on a child view — works reliably on both native and web
    // (animatedRef.current doesn't expose measureInWindow on web)
    const measureRef = useRef<View>(null);
    const setHandPosition = useGameStore(s => s.setHandPosition);
    const handPositions = useGameStore(s => s.handPositions);

    const updatePos = () => {
        measureRef.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
            setHandPosition(card.id, { x: x + w / 2, y: y + h / 2 });
        });
    };

    return (
        <Animated.View
            ref={animatedRef}
            layout={LinearTransition.springify().damping(15)}
            entering={FadeIn.duration(300)}
            exiting={Platform.OS === 'web'
                ? FadeOut.duration(300)
                : createDiscardAnimation(discardTarget, handPositions[card.id] ?? null)}
            style={[styles.playerCardWrapper, animatedStyle, { position: 'absolute', zIndex: 1000 }]}
        >
            {/* Transparent overlay used only for cross-platform measureInWindow */}
            <View ref={measureRef} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <Pressable
                onPress={() => {
                    updatePos();
                    onToggleSelect(card.id);
                }}
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
