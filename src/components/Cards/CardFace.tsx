// src/components/Cards/CardFace.tsx

import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/Common/AppText';
import { convertSuitToSymbol } from '@/utils/suitHelper';
import { CardData } from "@/types/game";
import {
    PLAYER_CARD_WIDTH,
    CARD_PLAYER_SCALE_RATIO,
    CARD_ASPECT_RATIO,
    TABLE_OVAL_RATIO,
    rnShadow
} from "@/state/constants";

interface CardFaceProps {
    card: CardData | null;
    isSelected?: boolean;
    isFacedown?: boolean;
    style?: StyleProp<ViewStyle>;
}

export const CardFace = React.memo(({
                                        card,
                                        isSelected = false,
                                        isFacedown = false,
                                        style
                                    }: CardFaceProps) => {
    const theme = useTheme();
    const { scale, moderateScale } = useResponsive();

    // Card's intrinsic width (used for both sizing and internal proportions)
    const cardWidth = PLAYER_CARD_WIDTH * CARD_PLAYER_SCALE_RATIO;

    const styles = useMemo(() => StyleSheet.create({
        cardBase: {
            // 🌟 INTRINSIC DIMENSIONS - CardFace owns its size
            width: scale(cardWidth),
            height: scale(cardWidth) * CARD_ASPECT_RATIO,
            borderRadius: scale(8),
            backgroundColor: isFacedown
                ? theme.cards.cardBack.backgroundColor
                : theme.cards.cardFront.backgroundColor,
            borderWidth: scale(1),
            borderColor: 'rgba(0,0,0,0.51)',
            ...rnShadow("heavy"),
            overflow: 'hidden',
        },
        selected: {
            borderColor: theme.cards.selectedBorder,
            borderWidth: scale(2),
        },
        cornerTopLeft: {
            position: 'absolute',
            top: scale(cardWidth * 0.07),
            left: scale(cardWidth * 0.07),
            alignItems: 'center',
            lineHeight: 1,
        },
        cornerBottomRight: {
            position: 'absolute',
            bottom: scale(cardWidth * 0.07),
            right: scale(cardWidth * 0.07),
            alignItems: 'center',
            transform: [{ rotate: '180deg' }],
        },
        cornerRank: {
            fontSize: moderateScale(cardWidth * 0.33),
            fontWeight: '800'
        },
        cornerSuit: {
            fontSize: moderateScale(cardWidth * 0.23),
            transform: [{
                translateY: moderateScale(cardWidth * -0.04) * TABLE_OVAL_RATIO,
            }]
        },
        centerWrap: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center'
        },
        centerSuit: {
            fontSize: scale(cardWidth * 0.5),
        },
    }), [theme, scale, moderateScale, cardWidth, isFacedown]);

    // Handle facedown cards
    if (isFacedown) {
        return (
            <View style={[styles.cardBase, isSelected && styles.selected, style]}>
                {/* Add your card back pattern here if needed */}
            </View>
        );
    }

    // Handle empty/null cards
    if (!card) {
        return <View style={[styles.cardBase, isSelected && styles.selected, style]} />;
    }

    // Render face-up card
    const isRed = ['hearts', 'diamonds', 'H', 'D', '♥', '♦'].includes(card.suit.toLowerCase());
    const ink = isRed ? theme.cards.suitRed : theme.cards.suitBlack;
    const symbol = convertSuitToSymbol(card.suit);

    return (
        <View style={[styles.cardBase, isSelected && styles.selected, style]}>
            <View style={styles.cornerTopLeft}>
                <AppText style={[styles.cornerRank, { color: ink }]}>{card.rank}</AppText>
                <AppText style={[styles.cornerSuit, { color: ink }]}>{symbol}</AppText>
            </View>

            <View style={styles.centerWrap} pointerEvents="none">
                <AppText style={[styles.centerSuit, { color: ink }]}>{symbol}</AppText>
            </View>

            <View style={styles.cornerBottomRight}>
                <AppText style={[styles.cornerRank, { color: ink }]}>{card.rank}</AppText>
                <AppText style={[styles.cornerSuit, { color: ink }]}>{symbol}</AppText>
            </View>
        </View>
    );
});