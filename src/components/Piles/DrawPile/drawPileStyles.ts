// src/components/Piles/DrawPile/drawPileStyles.ts
import { StyleSheet } from "react-native";
import { rnShadow, tokens } from "@/theme/tokens";

export function makeDrawPileStyles(opts: {
    cardW: number;
    cardH: number;
    cardR: number;
    wrapPad: number;
    glowPad: number;
    innerPad: number;
    glowColor: string;
}) {
    const { cardW, cardH, cardR, wrapPad, glowPad, innerPad, glowColor } = opts;

    return StyleSheet.create({
        wrapper: {
            alignItems: "center",
            justifyContent: "center",
            width: cardW + wrapPad * 2,
            left: "20%",
            overflow: "visible",
        },

        // ===== Atmospheric glow =====
        atmosphericGlowShadow: {
            position: "absolute",
            width: cardW + glowPad * 1.2,
            height: cardH + glowPad * 1.2,
            borderRadius: Math.round(cardR * 2),
            overflow: "visible",

            ...rnShadow(tokens.shadow.glow),
            shadowColor: glowColor,
        },

        atmosphericGlowFill: {
            flex: 1,
            borderRadius: Math.round(cardR * 2),
            backgroundColor: "rgba(0,0,0,0.01)", // iOS needs a rendered layer
        },

        // ===== Inner glow =====
        innerGlowShadow: {
            position: "absolute",
            width: cardW + innerPad * 1.2,
            height: cardH + innerPad * 1.2,
            borderRadius: Math.round(cardR * 1.4),
            overflow: "visible",

            ...rnShadow(tokens.shadow.soft),
            shadowColor: glowColor,
        },

        innerGlowFill: {
            flex: 1,
            borderRadius: Math.round(cardR * 1.4),
            backgroundColor: "rgba(0,0,0,0.01)",
        },

        deck: {
            width: cardW,
            height: cardH,
            position: "relative",
            overflow: "visible",
        },

        card: {
            position: "absolute",
            left: 0,
            top: 0,
            width: cardW,
            height: cardH,
            borderRadius: cardR,
            overflow: "hidden",

            ...rnShadow(tokens.shadow.soft),
        },
    });
}
