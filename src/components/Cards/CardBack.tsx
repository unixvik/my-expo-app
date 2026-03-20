import React, {useMemo} from 'react';
import {ImageBackground, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@/hooks/useTheme';
import {AppText} from '@/Common/AppText';
import {createStyles} from './CardBack.styles';
import {useResponsive} from "@/hooks/useResponsive";
import {CARD_ASPECT_RATIO, PLAYER_CARD_WIDTH, rnShadow} from "@/state/constants";

interface CardBackProps {
    cardWidth?: number;
}

export const CardBack = React.memo(({
                                        cardWidth = PLAYER_CARD_WIDTH,
                                    }: CardBackProps) => {
    const theme = useTheme();
    // const theme = useTheme();
    const {scale} = useResponsive();

    const styles = useMemo(() =>
            createStyles(theme, scale, cardWidth),
        [theme, scale, cardWidth]
    );

    // Generate indices for the decorative stripes
    const stripes = useMemo(() => Array.from({length: 10}), []);

    const {emblem} = theme.cards.cardBack;


    const backImage = theme.cards.cardBack.image;
    return (
        <View style={styles.container}>
            {backImage && (

                <ImageBackground
                    source={backImage}
                    resizeMode="cover"
                    style={[styles.cardBase]}
                    // imageStyle={{borderRadius: scale(8)}}
                />
            )}
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
                        style={[styles.stripe, {top: i * 15}]}
                    />
                ))}
            </View>

            {/* 3. Center Emblem (The Claim Diamond) */}
            <View style={styles.emblemWrap}>
                <AppText style={styles.emblem}>{emblem.symbol}</AppText>
            </View>

            {/* 4. Specular Highlight (The "Shine") */}
            <View style={styles.specular}/>

        </View>
    );

});

