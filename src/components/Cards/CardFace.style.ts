// src/components/Cards/CardFace.style.ts

import { StyleSheet } from 'react-native';
import { GameTheme } from '@/theme/themeTokens';
import {
    CARD_ASPECT_RATIO,
    CARD_PLAYER_SCALE_RATIO,
    PLAYER_CARD_WIDTH,
    rnShadow,
    TABLE_OVAL_RATIO
} from "@/state/constants";

export const createStyles = (
    theme: GameTheme,
    scale: (size: number) => number,
    moderateScale: (size: number) => number,
    isLandscape: boolean,
    cardWidth: number,
) => StyleSheet.create({

    cardBase: {
        width: '100%',
        height: '100%',
        // width: scale(PLAYER_CARD_WIDTH*CARD_PLAYER_SCALE_RATIO),
        // height: scale(PLAYER_CARD_WIDTH*CARD_PLAYER_SCALE_RATIO) * CARD_ASPECT_RATIO,
        // backgroundColor: theme.cards.cardFront.backgroundColor,
        borderRadius: scale(10),
        borderWidth: scale(0),
        borderColor: 'rgba(0,0,0,0.91)',
        // borderRadius: scale(16),
        backgroundColor: theme.cards.cardFront.backgroundColor,
        ...rnShadow("heavy"),
        overflow: 'hidden',
    },
    // 🌟 This is the highlight logic
    selected: {
        borderColor: theme.cards.selectedBorder,
        borderWidth: scale(3),
        // Lift effect scales with device height
        transform: [{ translateY: -scale(15) }],
        elevation: scale(12),
        ...rnShadow("heavy"),
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
        transform: [ {
            translateY: moderateScale(cardWidth * -0.04)*TABLE_OVAL_RATIO,
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
});