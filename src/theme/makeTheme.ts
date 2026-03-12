import { ThemeTokens, GameTheme } from "./themeTokens"

export function makeTheme(tokens: ThemeTokens): GameTheme {
    return {
        id: "midnight",

        background: tokens.background,
        surface: tokens.surface,
        accent: tokens.accent,

        cards: {
            cardBack: {
                backgroundColor: tokens.cardBackColor,

                pattern: {
                    borderRadius: 3,
                    borderWidth: 0.05,
                    borderColor: "rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    margins: "5%",
                },

                stripe: {
                    backgroundColor: tokens.accent,
                    opacity: 0.1,
                    height: 2,
                    transform: [{ rotate: "45deg" }],
                },

                emblem: {
                    symbol: tokens.cardSymbol,
                    fontSize: 25,
                    color: tokens.accent,
                    opacity: 0.2,
                    fontWeight: "300",
                },
            },

            cardFront: {
                backgroundColor: "#F8FAFC",
            },

            suitRed: tokens.suitRed,
            suitBlack: tokens.suitBlack,
            selectedBorder: tokens.suitRed,
        },

        text: {
            primary: tokens.text.primary,
            secondary: tokens.text.secondary,
        },

        shadow: tokens.shadow,

        table: tokens.table,

        playerZone: tokens.playerZone
    }
}