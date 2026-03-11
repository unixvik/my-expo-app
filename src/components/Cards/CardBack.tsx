import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/Common/AppText';
import { createStyles } from './CardBack.styles';
import {useResponsive} from "@/hooks/useResponsive";
import {PLAYER_CARD_WIDTH} from "@/state/constants";

interface CardBackProps {
    cardWidth?: number;
}

export const CardBack = React.memo(({
                                        cardWidth = PLAYER_CARD_WIDTH,
                                    }: CardBackProps) => {
    const theme = useTheme();

    const { scale } = useResponsive();

    const styles = useMemo(() =>
            createStyles(theme, scale, cardWidth),
        [theme, scale, cardWidth]
    );

    // Generate indices for the decorative stripes
    const stripes = useMemo(() => Array.from({ length: 10 }), []);

    const { emblem } = theme.cards.cardBack;

    return (
        <View style={styles.container}>
            {/* 1. Subtle Deep Gradient */}
            <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.2)']}
                style={styles.gradientOverlay}
            />

            {/* 2. Inner Pattern Panel */}
            <View style={styles.patternPanel}>
                {stripes.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.stripe, { top: i * 15 }]}
                    />
                ))}
            </View>

            {/* 3. Center Emblem (The Claim Diamond) */}
            <View style={styles.emblemWrap}>
                <AppText style={styles.emblem}>{emblem.symbol}</AppText>
            </View>

            {/* 4. Specular Highlight (The "Shine") */}
            <View style={styles.specular} />
        </View>
    );
});