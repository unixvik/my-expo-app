// src/components/Cards/CardFace.tsx

import React, {useMemo} from 'react';
import {View, StyleProp, ViewStyle, StyleSheet, ImageBackground} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {useResponsive} from '@/hooks/useResponsive';
import {AppText} from '@/Common/AppText';
import {convertSuitToSymbol, parseStringCardsToUI, parseStringCardToUI} from '@/utils/suitHelper';
import {CardData} from "@/types/game";
import {
    PLAYER_CARD_WIDTH,
    CARD_PLAYER_SCALE_RATIO,
    CARD_ASPECT_RATIO,
    TABLE_OVAL_RATIO,
    rnShadow
} from "@/state/constants";
import {CardBack} from "@/components/Cards/CardBack";

interface CardFaceProps {
    cardId: string | null;
    isSelected?: boolean;
    isFacedown?: boolean;
    style?: string
    cardWidth?: number; // override default size (design units)
}

export const CardFace = React.memo(({
                                        cardId,
                                        isSelected = false,
                                        isFacedown = false,
                                        style,
                                        cardWidth: cardWidthProp,
                                    }: CardFaceProps) => {
    const theme = useTheme();
    const {scale, moderateScale} = useResponsive();

    // Card's intrinsic width (used for both sizing and internal proportions)
    const cardWidth = cardWidthProp ?? PLAYER_CARD_WIDTH * CARD_PLAYER_SCALE_RATIO;

    const styles = useMemo(() => StyleSheet.create({
        cardSize: {
            width: scale(cardWidth),
            height: scale(cardWidth) * CARD_ASPECT_RATIO,
        },
        cardBase: {
            // 🌟 INTRINSIC DIMENSIONS - CardFace owns its size
            width: scale(cardWidth),
            height: scale(cardWidth) * CARD_ASPECT_RATIO,

            borderRadius: scale(theme.cards.cardBorders.borderRadius),
            borderWidth: scale(theme.cards.cardBorders.borderSize),
            ...rnShadow("contact"),
            overflow: "hidden",
            borderColor: theme.cards.cardBorders.defaultBorder,
            filter: (style=="fanned" ? 'brightness(60%) opacity(1)': ''),

        },
        selected: {
            borderColor: theme.cards.cardBorders.selectedBorder,
            // borderWidth: scale(2),
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
            transform: [{rotate: '180deg'}],
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


    const card = parseStringCardToUI(typeof cardId === "string" ? cardId :"");

    // Handle empty/null cards
    if (!card) {
        return <View style={[styles.cardBase, isSelected && styles.selected]}/>;
    }

// console.log("Cardface card:",card);
    // Render face-up card
    const isRed = ['hearts', 'diamonds', 'H', 'D', '♥', '♦'].includes(card?.suit.toLowerCase());
    const ink = isRed ? theme.cards.cardFront.suitRed : theme.cards.cardFront.suitBlack;
    const symbol = convertSuitToSymbol(card.suit);

    return (
        <View style={[styles.cardBase, isSelected && styles.selected]}>

            <ImageBackground
                source={isFacedown ? theme.cards.cardBack.image  : theme.cards.cardFront.image}
                resizeMode="cover"
                style={[styles.cardSize]}
                // imageStyle={{ borderRadius: scale(8) }}
            />
            {!isFacedown && (
                <>
                    <View style={styles.cornerTopLeft}>
                        <AppText style={[styles.cornerRank, {color: ink}]}>{card.rank}</AppText>
                        <AppText style={[styles.cornerSuit, {color: ink}]}>{symbol}</AppText>
                    </View>

                    <View style={styles.centerWrap} pointerEvents="none">
                        <AppText style={[styles.centerSuit, {color: ink}]}>{symbol}</AppText>
                    </View>

                    <View style={styles.cornerBottomRight}>
                        <AppText style={[styles.cornerRank, {color: ink}]}>{card.rank}</AppText>
                        <AppText style={[styles.cornerSuit, {color: ink}]}>{symbol}</AppText>
                    </View>
                </>
            )}
        </View>
    );
});