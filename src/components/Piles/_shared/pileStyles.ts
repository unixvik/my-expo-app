// src/components/Piles/_shared/pileStyles.ts
import { Platform, StyleSheet } from "react-native";
import { rnShadow, tokens } from "@/theme/tokens";

export function makePileStaticStyles() {
    return StyleSheet.create({
        stackCard: { position: "absolute", left: 0, top: 0 },
        ghostCard: {
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.910)",
            ...rnShadow(tokens.shadow.soft),
        },
        shimmer: { position: "absolute", top: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.16)" },
        edgeHighlight: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
    });
}

export function makeDiscardStyles(opts: {
    W: number;
    H: number;
    R: number;
    glowPad: number;
    glowColor: string;
    labelColor: string;
    emptyBorder: string;
}) {
    const { W, H, R, glowPad, glowColor, labelColor, emptyBorder } = opts;

    return StyleSheet.create({
        root: { alignItems: "center", justifyContent: "center" },

        glow: {
            position: "absolute",
            width: W+10,
            height: H+10,
            borderRadius: R,

            borderWidth: 3,
            borderColor: emptyBorder,
            shadowColor: glowColor,
            // shadowOffset: { width: 0, height: 0 },
            // shadowOpacity: Platform.OS === "ios" ? 0.955 : 0.8,
            // shadowOpacity: 0.5,
            shadowRadius: 22,
            // elevation: 18,
            // ...rnShadow(tokens.shadow.heavy),
        },

        emptySlot: {
            borderWidth: 2,
            borderColor: emptyBorder,
            backgroundColor: "rgba(0,0,0,0.18)",
            borderStyle: "dashed",
            justifyContent: "center",
            alignItems: "center",
            ...rnShadow(tokens.shadow.soft),
        },

        emptyGlyph: {
            textAlign: "center",
            fontWeight: "900",
        },

        label: {
            marginTop: 10,
            fontWeight: "800",
            letterSpacing: 4,
            color: labelColor,
        },
    });
}
