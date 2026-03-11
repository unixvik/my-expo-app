// src/components/Cards/CardFace.style.ts

import { StyleSheet } from 'react-native';
import { GameTheme } from '@/theme/themeTokens';
import {rnShadow} from "@/state/constants";

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
        backgroundColor: theme.cards.cardFront.backgroundColor,
        borderRadius: scale(8),
        borderWidth: scale(1),
        borderColor: 'rgba(0,0,0,0.1)',
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
        top: scale(cardWidth * 0.04),
        left: scale(cardWidth * 0.07),
        alignItems: 'center',
        lineHeight: 10,
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: scale(cardWidth * 0.04),
        right: scale(cardWidth * 0.07),
        alignItems: 'center',
        transform: [{ rotate: '180deg' }],
    },
    cornerRank: {
        fontSize: moderateScale(cardWidth * 0.5),
        fontWeight: '800'
    },
    cornerSuit: {
        fontSize: moderateScale(cardWidth * 0.375),
        transform: [ {
            translateY: -6
        }]
    },
    centerWrap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center'
    },
    centerSuit: {
        fontSize: scale(cardWidth * 0.625),
    },
});