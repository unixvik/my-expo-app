// src/components/Cards/CardFace/cardFace.styles.ts
import { Platform, StyleSheet } from "react-native";
import { tokens, rnShadow } from "@/theme/tokens";
import type { CardTheme } from "./cardFace.theme";
import type { CardMetrics } from "./cardFace.metrics";

export const cardFaceStatic = StyleSheet.create({
    empty: { fontSize: 14 },

    depthSheet: {
        position: "absolute",
    },

    cardBody: {
        overflow: "hidden",
    },

    rimLight: {
        // ...StyleSheet.absoluteFillObject,
        borderWidth: 10,

    },

    innerBevel: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 1.5,
    },

    rot180: {
        transform: [{ rotate: "180deg" }],
    },

    rankTextBase: {
        fontWeight: "900",
        letterSpacing: -0.5,
        ...(Platform.OS === "ios"
            ? { fontFamily: "Avenir Next" }
            : { fontFamily: "sans-serif-condensed" }),
    },

    suitSmallBase: {
        marginTop: -2,
        fontWeight: "900",
        opacity: 0.9,
    },
});

function glowStyleIOS(color: string, glowR: number, yMul: number, opacity: number) {
    return {
        shadowColor: color,
        shadowOpacity: opacity,
        shadowRadius: glowR,
        shadowOffset: { width: 0, height: Math.round(glowR * yMul) },
    } as const;
}

function glowStyleAndroid(glowR: number, k: number, min: number) {
    return { elevation: Math.max(min, Math.round(glowR * k)) } as const;
}

export type CardFaceDyn = ReturnType<typeof createCardFaceStyles>;

export function createCardFaceStyles(args: {
    tCard: CardTheme;
    m: CardMetrics;
    isSelected: boolean;
    isPending: boolean;
    ink: string;
}) {
    const { tCard, m, isSelected, isPending, ink } = args;

    const liftShadow = rnShadow(tokens.shadow.heavy);
    const contactShadow = rnShadow(tokens.shadow.contact);

    // 1. ✨ NEW PURPLE GLOW LOGIC

    const selectionGlow =
        isSelected
            ? Platform.OS === "ios" || Platform.OS === "web"
                ? glowStyleIOS(tCard.selectedRing, m.selGlowR, 0.15, 0.98)
                : glowStyleAndroid(m.selGlowR, 0.85, 10)
            : null;

    // pending glow only when not selected (keep your original rule)
    const pendingGlow =
        !isSelected && isPending
            ? Platform.OS === "ios"
                ? glowStyleIOS(tCard.pendingGlow, m.pendGlowR, 0.25, 0.26)
                : glowStyleAndroid(m.pendGlowR, 0.35, 6)
            : null;

    return {
        outerBox: { width: m.W, height: m.H, opacity: isPending ? 0.45 : 1 },

        sheetBase: {
            width: m.W,
            height: m.H,
            borderRadius: m.R,
            backgroundColor: tCard.depthSheetColor,
        },

        liftWrap: [{ width: m.W, height: m.H, borderRadius: m.R }, liftShadow, selectionGlow, pendingGlow],

        contactWrap: [{ width: m.W, height: m.H, borderRadius: m.R }, contactShadow],

        body: {
            width: m.W,
            height: m.H,
            borderRadius: m.R,
            borderWidth: m.borderW,
            backgroundColor: tCard.face,
            borderColor: isSelected ? tCard.selectedRing : tCard.border,
            overflow: "hidden" as const,
            // 2. ✨ MATCH THE BORDER TO THE GLOW
            // borderColor: isSelected ? PURPLE_GLOW : tCard.border,
            // overflow: "hidden" as const,
        },

        centerSuitWrap: {
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
        },

        centerSuitText: {
            fontSize: m.bigSuitSize,
            color: ink,
            fontWeight: "900",
            opacity: 0.9,
            textAlign: "center",
            textShadowColor: tCard.bigSuitTextShadow,
            textShadowOffset: { width: 0, height: m.bigSuitShadowY },
            textShadowRadius: m.bigSuitShadowBlur,
        },



        paperGrad: [StyleSheet.absoluteFillObject, { borderRadius: m.R }],

        rimLight: [
            cardFaceStatic.rimLight,
            { borderRadius: m.R, borderColor: tCard.rimLight },
        ],

        innerBevel: [
            cardFaceStatic.innerBevel,
            {
                borderRadius: Math.max(0, m.R - 2),
                margin: 2,
                borderColor: tCard.bevelHighlight,
                borderRightColor: tCard.bevelShadow,
                borderBottomColor: tCard.bevelShadow,
            },
        ],

        content: { flex: 1, padding: m.pad },

        cornerPlateTL: {
            position: "absolute" as const,
            top: m.cornerInset,
            left: m.cornerInset,
            borderRadius: m.cornerRadius,
            paddingHorizontal: m.cornerPadX,
            paddingVertical: m.cornerPadY,
            backgroundColor: tCard.cornerPlateBg,
            borderWidth: 0,
            borderColor: tCard.cornerPlateBorder,
        },

        cornerPlateBR: {
            position: "absolute" as const,
            right: m.cornerInset,
            bottom: m.cornerInset,
            borderRadius: m.cornerRadius,
            paddingHorizontal: m.cornerPadX,
            paddingVertical: m.cornerPadY,
            backgroundColor: tCard.cornerPlateBg,
            borderWidth: 0,
            borderColor: tCard.cornerPlateBorder,
        },

        rankText: [
            cardFaceStatic.rankTextBase,
            { fontSize: m.rankSize, lineHeight: m.rankLine, color: ink },
        ],

        suitSmall: [
            cardFaceStatic.suitSmallBase,
            { fontSize: m.suitSmallSize, lineHeight: m.suitSmallLine, color: ink },
        ],

        selectedKiss: isSelected
            ? {
                position: "absolute" as const,
                inset: 6,
                borderRadius: Math.max(0, m.R - 6),
                borderWidth: 1,
                borderColor: tCard.selectedRing,
                opacity: 0.12,
                pointerEvents: "none" as const,
            }
            : null,
    } as const;
}
