import {ThemeTokens, GameTheme} from "./themeTokens"

export function makeTheme(tokens: ThemeTokens): GameTheme {
    return {
        shadow: "",
        id: "casino",

        background: tokens.background,
        surface: tokens.surface,
        accent: tokens.accent,

        cards: {
            cardBack: {
                backgroundColor: tokens.cards.cardBack.backgroundColor,
                image: tokens.cards.cardBack.image,

                emblem: {
                    symbol: tokens.cards.cardBack.emblem.symbol,
                    fontSize: 25,
                    color: tokens.accent,
                    opacity: 0.2,
                    fontWeight: "300",
                },
            },

            cardFront: {
                backgroundColor: tokens.cards.cardFront.backgroundColor,
                suitRed: tokens.cards.cardFront.suitRed,
                suitBlack: tokens.cards.cardFront.suitBlack,
                image: tokens.cards.cardFront.image
            },
            cardBorders: {
                selectedBorder: tokens.cards.cardBorders.selectedBorder,
                defaultBorder: tokens.cards.cardBorders.defaultBorder,
                borderSize: tokens.cards.cardBorders.borderSize,
                borderRadius: tokens.cards.cardBorders.borderRadius,
            }
        },
        text: {
            primary: tokens.text.primary,
            secondary: tokens.text.secondary,
        },

        table: tokens.table,

        playerZone: tokens.playerZone
    }
}