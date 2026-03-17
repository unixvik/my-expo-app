import React, {useCallback, useMemo} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    LinearTransition,
    FadeIn,
    useAnimatedRef,
    useDerivedValue, SharedValue,
} from 'react-native-reanimated';
import { GameCard } from './GameCard';
import { calculateCardFan } from '@/utils/animations';
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import { useVisualStore } from "@/state/useVisualStore";
import { updateLayout } from "@/utils/helpers";
import {Gesture, GestureDetector,Pressable} from "react-native-gesture-handler";

interface AnimatedHandCardProps {
    card: any;
    index: number;
    totalCards: number;
    cardWidth: number;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    hoveredCardId:SharedValue<string | null>;
}

export const AnimatedHandCard = ({
                                     card, index, totalCards, cardWidth, isSelected, onToggleSelect, hoveredCardId,
                                 }: AnimatedHandCardProps) => {

    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);

    const isMouseHovered = useSharedValue(false); // Hover-ul de mouse (Web)
    const isSelectedSV = useSharedValue(isSelected);

    const playerRef = useAnimatedRef<View>();


    React.useEffect(() => { isSelectedSV.value = isSelected; }, [isSelected]);

    // ✅ Aceasta este cheia: Combinăm starea de mouse cu starea de swipe
    const isActive = useDerivedValue(() => {
        // E activ dacă e mouse-ul deasupra SAU dacă ID-ul de swipe coincide
        return isMouseHovered.value || hoveredCardId.value === card.id;
    });

    const springConfig = { damping: 14, stiffness: 150, mass: 0.8 };

    const animatedStyle = useAnimatedStyle(() => {
        // Folosim isActive.value peste tot în loc de isHovered.value
        const target = calculateCardFan(index, totalCards, cardWidth, isSelectedSV.value, isActive.value);

        return {
            transform: [
                { translateX: withSpring(target.translateX, springConfig) },
                // Ridicăm cartea cu 20px extra când e activă (swipe sau mouse)
                { translateY: withSpring(target.translateY + (isActive.value ? -20 : 0), springConfig) },
                { rotateZ: withSpring(`${target.rotateZ}deg`, springConfig) },
                { scale: withSpring(isActive.value && !isSelectedSV.value ? 1.1 : 1, springConfig) }
            ],
            // Ridicăm zIndex-ul ca să fie deasupra celorlalte când e "hovered"
            zIndex: isSelectedSV.value || isActive.value ? 100 : index,
        };
    });

    // @ts-ignore
    return (
        <Animated.View style={[styles.playerCardWrapper, styles.playerCard, animatedStyle]}>
            <Pressable
                ref={playerRef}
                onLayout={() => updateLayout('player', playerRef, card.id)}
                onPressOut={Platform.OS === 'web' ? () => {
                    // console.log('onPress',card.id);
                    onToggleSelect(card.id)

                } : undefined}
                style={StyleSheet.absoluteFill}
                // Evenimente pentru WEB
                onMouseEnter={() => { isMouseHovered.value = true; }}
                onMouseLeave={() => { isMouseHovered.value = false; }}
                // onHoverIn={() => { isMouseHovered.value = true; }}
                // onHoverOut={() => { isMouseHovered.value = false; }}
            >
                <GameCard
                    card={card}
                    isSelected={isSelected}
                    cardWidth={cardWidth}
                    style={styles.playerCardArtwork}
                />
            </Pressable>
        </Animated.View>
    );
};
