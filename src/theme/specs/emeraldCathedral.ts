// src/theme/specs/emeraldCathedral.ts
import {sem, ThemeSpec, withCardMat} from "../themes";

export const emeraldCathedral: ThemeSpec = {
    id: "emeraldCathedral",
    name: "Emerald Cathedral",
    pair: { primary: "#C9A84C", secondary: "#B478FF" },

    neutrals: {
        bg0: "#020C05",
        bg1: "#0C3A1D",
        ink0: "#EAF2FF",
        ink1: "rgba(201,168,76,0.52)",
        line: "rgba(201,168,76,0.18)",
    },

    table: {
        felt: "#0c3a1d",
        rail: "rgba(201,168,76,.18)",
        rimGradient: ["#4a3206", "#7a5010", "#4a3206"],
        surfaceGradient: ["#092d16", "#0c3a1d", "#082b14"],
        centerRing: "rgba(201,168,76,.09)",
        gridColor: "rgba(0,0,0,.045)",
        gridOpacity: 0.18,
        shadowOpacity: 0.52,
        vignette: "",
        rim: ""
    },

    piles: {
        drawGlow: "rgba(180,120,255,1)",
        discardGlow: "rgba(201,168,76,1)",
        counterBg: "rgba(100,60,200,0.90)",
        ghostPaper: "rgba(255,250,248,0.90)",
    },

    card: withCardMat({
        paperTop: "#fff8ee",
        paperBottom: "#fdf3e0",
        border: "rgba(201,168,76,.2)",
        pipRed: "#8b1a1a",
        pipBlack: "#16162a",
        depthSheetColor: "#000000",
        cornerPlateBorder: "rgba(0,0,0,0.10)",
        rimLight: "rgba(255,255,255,0.35)",
        bevelHighlight: "rgba(255,255,255,0.70)",
        bevelShadow: "rgba(0,0,0,0.06)",
        watermarkBorder: "rgba(0,0,0,0.04)",
        watermarkRedBg: "rgba(198,40,40,0.05)",
        watermarkBlackBg: "rgba(15,23,42,0.04)",
        bigSuitTextShadow: "rgba(0,0,0,0.14)",
    }),

    cardBack: {
        top: "#18082a",
        bottom: "#2a1450",
        border: "rgba(140,70,240,.38)",
        pattern: "rgba(160,90,255,.15)",
        emblem: "rgba(180,120,255,0.55)",
    },

    semantic: sem("#EAF2FF", "rgba(234,242,255,0.55)", "#020C05"),
    danger: "#FF4D6D",
    success: "#2EE59D",

    rimGradient: ["#4a3206", "#7a5010", "#4a3206"],
    railStroke: "rgba(201,168,76,0.18)",
    centerRing: "rgba(201,168,76,0.09)",
    gridColor: "rgba(0,0,0,1)",
    gridOpacity: 0.06,
    feltTintOpacity: 0.85,
    shadowOpacity: 0.9,
};
