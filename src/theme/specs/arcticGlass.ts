// src/theme/specs/arcticGlass.ts
import {ThemeSpec, withCardMat} from "../themes";

export const arcticGlass: ThemeSpec = {
    id: "arcticGlass",
    name: "Arctic Glass",
    pair: { primary: "#1c3150", secondary: "#8EC6F0" },
    neutrals: {
        bg0: "#595959",
        bg1: "#d0dfe9",
        ink0: "#132236",
        ink1: "#35506E",
        line: "#9FB4C9",
    },
    table: {
        felt: "#0892ec",
        rail: "rgba(90,130,170,0.16)",
        rim: "rgba(255,255,255,0.55)",
        vignette: "rgba(90,130,170,0.12)",
        rimGradient: ["#deeaf6", "#365c83", "#d8e8f4"],
        surfaceGradient: ["rgba(13,80,227,0.39)", "rgba(11,73,112,0.92)"],
        railStroke: "rgba(90,130,170,0.16)",
        centerRing: "rgba(90,130,170,0.13)",
        gridColor: "rgba(255,255,255,1)",
        gridOpacity: 0.10,
        feltTintOpacity: 0.08,
        shadowOpacity: 0.28,

    },
    cardBack: {
        top: "#284468",
        bottom: "#1c3050",
        border: "rgba(255,255,255,.25)",
        pattern: "rgba(160,200,255,0.30)",
        emblem: "rgba(142,198,240,0.55)",
    },
    card: withCardMat({
        cornerPlateBg: "", pendingGlow: "", selectedRing: "",
        paperTop: "#fff",
        paperBottom: "#fff",
        border: "rgba(90,130,170,.15)",
        pipRed: "#be3020",
        pipBlack: "#1c3050",
        depthSheetColor: "#000000",
        cornerPlateBorder: "rgba(0,0,0,0.10)",
        rimLight: "rgba(255,255,255,0.35)",
        bevelHighlight: "rgba(255,255,255,0.70)",
        bevelShadow: "rgba(0,0,0,0.96)",
        watermarkBorder: "rgba(0,0,0,0.04)",
        watermarkRedBg: "rgba(198,40,40,0.05)",
        watermarkBlackBg: "rgba(15,23,42,0.04)",
        bigSuitTextShadow: "rgba(0,0,0,1)"
    }),

    piles: { drawGlow: "#1c3150", discardGlow: "#8EC6F0", counterBg: "rgba(44,74,110,0.14)", ghostPaper: "rgba(255,255,255,0.90)" },
    semantic: { text: "#132236", textMuted: "#35506E", bg: "#c4d6e6" },
    danger: "#C0392B",
    success: "#2E9D78",
};
