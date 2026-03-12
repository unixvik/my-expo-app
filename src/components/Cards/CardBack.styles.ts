import { StyleSheet } from "react-native";
import { GameTheme } from "@/theme/themeTokens";

export const createStyles = (
    theme: GameTheme,
    scale: (size: number) => number,
    cardWidth: number,
) => {

    const emblem = theme.cards.cardBack.emblem;

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return StyleSheet.create({

        container: {
            width: "100%",
            height: "100%",
            borderRadius: scale(8),
            backgroundColor: theme.cards.cardBack.backgroundColor,
            overflow: "hidden",
            borderWidth: scale(1),
            borderColor: "rgba(255,255,255,0.1)",
        },

        gradientOverlay: {
            ...StyleSheet.absoluteFillObject,
            opacity: 0.2,
        },

        patternPanel: {
            position: "absolute",
            top: theme.cards.cardBack.pattern.margins,
            left: theme.cards.cardBack.pattern.margins,
            right: theme.cards.cardBack.pattern.margins,
            bottom: theme.cards.cardBack.pattern.margins,
            borderRadius: scale(theme.cards.cardBack.pattern.borderRadius),
            borderWidth: scale(theme.cards.cardBack.pattern.borderWidth),
            borderColor: theme.cards.cardBack.pattern.borderColor,
            backgroundColor: theme.cards.cardBack.pattern.backgroundColor,
            overflow: "hidden",
        },

        stripe: {
            position: "absolute",
            width: "200%",
            height: scale(theme.cards.cardBack.stripe.height),
            backgroundColor: theme.cards.cardBack.stripe.backgroundColor,
            opacity: theme.cards.cardBack.stripe.opacity,
            transform: theme.cards.cardBack.stripe.transform,
        },

        emblemWrap: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: "center",
            alignItems: "center",
        },

        emblem: {
            fontSize: scale(cardWidth * 0.625),
            color: emblem.color,
            opacity: emblem.opacity,
            fontWeight: emblem.fontWeight as any,
        },

        specular: {
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: "140%",
            height: "40%",
            backgroundColor: "rgba(255,255,255,0.08)",
            transform: [{ rotate: "-15deg" }],
        },

    });
};