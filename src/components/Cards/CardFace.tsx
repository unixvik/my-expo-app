// src/components/Cards/CardFace.tsx

import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/Common/AppText';
import { convertSuitToSymbol } from '@/utils/suitHelper';
import { createStyles } from './CardFace.style';
import {CardData} from "@/types/game";
import {useResponsive} from "@/hooks/useResponsive";
import {PLAYER_CARD_WIDTH} from "@/state/constants";

interface CardFaceProps {
    card: CardData | null;
    cardWidth?: number;
    isSelected?: boolean;
    style?: StyleProp<ViewStyle>;
}

export const CardFace = React.memo(({
                                        card,
                                        cardWidth = PLAYER_CARD_WIDTH,
                                        isSelected = false,
                                        style
                                    }: CardFaceProps) => {
    const theme = useTheme();

    const { scale, moderateScale, isLandscape } = useResponsive();

    const styles = useMemo(() =>
            createStyles(theme, scale, moderateScale, isLandscape, cardWidth),
        [theme, scale, cardWidth]
    );
    if (!card) return <View style={[styles.cardBase, style]} />;

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