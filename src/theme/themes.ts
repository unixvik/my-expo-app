// src/theme/themes.ts

export type ThemeId =
    | "emeraldVelvet"
    | "nordicFrost"
    | "moltenAmber"
    | "neonTokyo"
    | "gildedBaroque"
    | "monochromeInk"
    | "deepOcean"
    | "roseGoldLuxe"
    | "solarPunk"
    | "silverDeco"
// ✅ NEW from HTML
    | "emeraldCathedral"
    | "arcticGlass"
    | "infernoNoir"
    | "neonSynthwave"
    | "bourbonLeather";


export type ColorPair = { primary: string; secondary: string };


export type ThemeSpec = {
    id: ThemeId;
    name: string;
    pair: ColorPair;

    neutrals: {
        bg0: string;   // app background
        bg1: string;   // table felt base / surfaces
        ink0: string;  // primary text
        ink1: string;  // secondary text
        line: string;  // borders / rails
    };

    piles: {
        drawGlow: string;
        discardGlow: string;
        counterBg: string;
        ghostPaper: string; // discard stack paper layers
    };

    table: {
        felt: string;      // tint over table surface / image
        vignette: string;  // vignette overlay (rgba string)
        rail: string;      // table border/rail
        rim: string;       // thin inner rim highlight
        rimGradient?: [string, string, string,string?,string?];     // metallic rim gradient (3 stops)
        surfaceGradient?: [string, string, string?]; // felt gradient (3 stops)
        centerRing?: string;                        // oval ring line
        gridColor?: string;                         // grid line color
        gridOpacity?: number;                       // 0..1
        shadowOpacity?: number;                     // 0..1
    };

    card: {
        paperTop: string;
        paperBottom: string;
        border: string;
        cornerPlateBg: string;
        pipRed: string;
        pipBlack: string;
        selectedRing: string;
        pendingGlow: string;
        // NEW: “material model” colors (move your RGBA constants here)
        depthSheetColor: string;       // e.g. "rgba(0,0,0,1)" (opacity applied separately)
        cornerPlateBorder: string;     // e.g. t.semantic.border
        rimLight: string;              // e.g. "rgba(255,255,255,0.30)"
        bevelHighlight: string;        // e.g. "rgba(255,255,255,0.62)"
        bevelShadow: string;           // e.g. "rgba(0,0,0,0.06)"
        watermarkBorder: string;       // e.g. "rgba(0,0,0,0.04)"
        watermarkRedBg: string;        // e.g. "rgba(198,40,40,0.05)"
        watermarkBlackBg: string;      // e.g. "rgba(15,23,42,0.04)"
        bigSuitTextShadow: string;     // e.g. "rgba(0,0,0,0.14)"
    };

    cardBack: {
        top: string;
        bottom: string;
        border: string;
        pattern: string;
        emblem: string;
    };

    semantic: {
        text: string;
        textMuted: string;
        bg: string;
    };

    danger: string;
    success: string;

    // ✅ NEW (optional): “HTML table” chrome
    rimGradient?: string[];        // e.g. ["#4a3206","#7a5010","#4a3206"]
    surfaceGradient?: string[];    // base surface gradient
    railStroke?: string;           // thin rail stroke color
    centerRing?: string;           // ellipse ring stroke
    gridColor?: string;            // grid / weave overlay tint
    gridOpacity?: number;          // 0..1
    feltTintOpacity?: number;      // 0..1 overlay over the table_bg image
    shadowOpacity?: number;        // 0..1 for the table shadow blob
};


type CardMaterial = Pick<
    ThemeSpec["card"],
    | "depthSheetColor"
    | "cornerPlateBorder"
    | "rimLight"
    | "bevelHighlight"
    | "bevelShadow"
    | "watermarkBorder"
    | "watermarkRedBg"
    | "watermarkBlackBg"
    | "bigSuitTextShadow"
>;
const CARD_MAT_DEFAULTS: CardMaterial = {
    depthSheetColor: "rgba(0,0,0,1)",
    cornerPlateBorder: "rgba(0,0,0,0.10)",
    rimLight: "rgba(255,255,255,0.30)",
    bevelHighlight: "rgba(255,255,255,0.62)",
    bevelShadow: "rgba(0,0,0,0.06)",
    watermarkBorder: "rgba(0,0,0,0.04)",
    watermarkRedBg: "rgba(198,40,40,0.05)",
    watermarkBlackBg: "rgba(15,23,42,0.04)",
    bigSuitTextShadow: "rgba(0,0,0,0.14)",
};
export const withCardMat = (
    card: Omit<ThemeSpec["card"], keyof CardMaterial> & Partial<CardMaterial>
): ThemeSpec["card"] => ({
    ...CARD_MAT_DEFAULTS,
    ...card,
});
// Helpers: keep the file readable
export const sem = (text: string, textMuted: string, bg: string) => ({ text, textMuted, bg });

export const THEME_SPECS: Record<ThemeId, ThemeSpec> = {
    // 01 — EMERALD VELVET (deep green felt + violet backs + gold rail)
    emeraldVelvet: {
        id: "emeraldVelvet",
        name: "Emerald Velvet",
        pair: { primary: "#C9A84C", secondary: "#B478FF" },

        neutrals: {
            bg0: "#070A08",
            bg1: "#0D3D22",
            ink0: "#EAF2FF",
            ink1: "#9FB0C9",
            line: "#1E3B2A",
        },

        table: {
            felt: "rgba(13, 61, 34, 0.85)",
            vignette: "rgba(0,0,0,0.35)",
            rail: "rgba(201,168,76,0.25)",
            rim: "rgba(255,255,255,0.910)",
            rimGradient: ["#4a3206", "#7a5010", "#4a3206"],
            surfaceGradient: ["#092d16", "#0c3a1d", "#082b14"],

            centerRing: "rgba(201,168,76,0.09)",
            gridColor: "rgba(0,0,0,1)",
            gridOpacity: 0.045,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(180,120,255,1)",
            discardGlow: "rgba(201,168,76,1)",
            counterBg: "rgba(100,60,200,0.90)",
            ghostPaper: "rgba(255,250,248,0.90)", // discard “paper” stack in HTML is warm white
        },

        card: withCardMat({
            cornerPlateBg: "", pendingGlow: "", selectedRing: "",
            paperTop: "#fff8ee",
            paperBottom: "#fdf3e0",
            border: "rgba(201,168,76,0.2)",
            pipRed: "#8b1a1a",
            pipBlack: "#16162a",
            // material model fields (recommended defaults — keep same across themes unless you want to tune)
            depthSheetColor: "#000000",
            cornerPlateBorder: "rgba(0,0,0,0.10)",
            rimLight: "rgba(255,255,255,0.35)",
            bevelHighlight: "rgba(255,255,255,0.70)",
            bevelShadow: "rgba(0,0,0,0.06)",
            watermarkBorder: "rgba(0,0,0,0.04)",
            watermarkRedBg: "rgba(198,40,40,0.05)",
            watermarkBlackBg: "rgba(15,23,42,0.04)",
            bigSuitTextShadow: "rgba(0,0,0,0.14)"
        }),
        cardBack: {
            top: "#1a0a2e",
            bottom: "#2d1654",
            border: "rgba(100,60,200,0.3)",
            pattern: "rgba(150,80,255,0.12)",
            emblem: "rgba(0,0,0,0.25)",
        },

        semantic: sem("#EAF2FF", "rgba(234,242,255,0.55)", "#070A08"),
        danger: "#FF4D6D",
        success: "#2EE59D",
    },

    // 02 — NORDIC FROST (clean ice table + navy backs)
    nordicFrost: {
        id: "nordicFrost",
        name: "Nordic Frost",
        pair: { primary: "#2C4A6E", secondary: "#8EC6F0" },

        neutrals: {
            bg0: "#C8D6E0",
            bg1: "#D4DFE8",
            ink0: "#132236",
            ink1: "#35506E",
            line: "#9FB4C9",
        },

        table: {
            felt: "rgba(212,223,232,1)",
            vignette: "rgba(255,255,255,1)",
            rail: "rgba(150,180,210,1)",
            rim: "rgba(255,255,255,1)",
            rimGradient: ["#deeaf6", "#c8d8e8", "#d8e8f4"],
            surfaceGradient: ["rgba(255,255,255,0.88)", "rgba(232,246,255,0.92)"],

            centerRing: "rgba(90,130,170,0.13)",
            gridOpacity: 0, // the “glass” prototype doesn’t use a grid; keep it clean
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(44,74,110,1)",
            discardGlow: "rgba(142,198,240,1)", // label tint
            counterBg: "rgba(44,74,110,0.90)",
            ghostPaper: "rgba(255,255,255,0.92)",
        },

        card: withCardMat({
            paperTop: "#ffffff",
            paperBottom: "#ffffff",
            border: "rgba(170,60,40,0.2)",
            pipRed: "#be3020",
            pipBlack: "#1e3352",
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
            top: "#284468",
            bottom: "#1c3050",
            border: "rgba(255,255,255,0.22)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(90,160,220,0.18)",
        },

        semantic: sem("#132236", "rgba(19,34,54,0.55)", "#C8D6E0"),
        danger: "#C0392B",
        success: "#2E9D78",
    },

    // 03 — MOLTEN AMBER (warm wood + aged paper)
    moltenAmber: {
        id: "moltenAmber",
        name: "Molten Amber",
        pair: { primary: "#C87820", secondary: "#E8C870" },

        neutrals: {
            bg0: "#0B0502",
            bg1: "#5C2D08",
            ink0: "#FFF2DE",
            ink1: "#D8BFA0",
            line: "#3C200D",
        },

        table: {
            felt: "rgba(92,45,8,0.88)",
            vignette: "rgba(0,0,0,0.42)",
            rail: "rgba(200,120,30,0.22)",
            rim: "rgba(255,255,255,0.08)",
            rimGradient: ["#180502", "#2c0806", "#180502"],
            surfaceGradient: ["#0b0303", "#100404", "#090202"],

            centerRing: "rgba(170,35,25,0.10)",
            gridColor: "rgba(170,35,25,1)",
            gridOpacity: 0.024,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(200,120,30,1)",
            discardGlow: "rgba(232,200,112,1)",
            counterBg: "rgba(100,60,20,0.90)",
            ghostPaper: "rgba(245,230,200,0.90)",
        },

        card: withCardMat({
            paperTop: "#fff4f4",
            paperBottom: "#ffe5e5",
            border: "rgba(170,35,25,0.18)",
            pipRed: "#cc2820",
            pipBlack: "#0f0f18",
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
            top: "#0e0303",
            bottom: "#1a0606",
            border: "rgba(170,35,25,0.22)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(170,28,18,0.22)",
        },

        semantic: sem("#FFF2DE", "rgba(255,242,222,0.55)", "#0B0502"),
        danger: "#8B1A1A",
        success: "#31D07A",
    },

    // 04 — NEON TOKYO (cyber grid + cyan/magenta)
    neonTokyo: {
        id: "neonTokyo",
        name: "Neon Tokyo",
        pair: { primary: "#00CCFF", secondary: "#FF00CC" },

        neutrals: {
            bg0: "#050510",
            bg1: "#0A0520",
            ink0: "#F1F5FF",
            ink1: "#A6B3E6",
            line: "#1B1F44",
        },

        table: {
            felt: "rgba(10,5,32,0.94)",
            vignette: "rgba(255,0,200,0.10)",
            rim: "rgba(0,200,255,0.18)",
            rimGradient: ["#080018", "#140030", "#080018"],
            surfaceGradient: ["#03000c", "#05000f", "#020008"],
            rail: "rgba(255,0,200,0.26)",
            centerRing: "rgba(255,0,200,0.13)",
            gridColor: "rgba(0,200,255,1)", // cyan grid tint
            gridOpacity: 0.05,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(0,204,255,1)",
            discardGlow: "rgba(255,0,200,1)",
            counterBg: "rgba(0,200,255,0.15)", // matches HTML badge feel
            ghostPaper: "rgba(26,5,32,0.35)",  // dark “paper” in neon vibe
        },

        card: withCardMat({
            cornerPlateBg: "", pendingGlow: "", selectedRing: "",
            paperTop: "#180028",
            paperBottom: "#1e0038",
            border: "rgba(255,0,200,0.45)",
            pipRed: "#ff00cc",
            pipBlack: "#00ccff",
            depthSheetColor: "#000000",
            cornerPlateBorder: "rgba(0,0,0,0.10)",
            rimLight: "rgba(255,255,255,0.35)",
            bevelHighlight: "rgba(255,255,255,0.70)",
            bevelShadow: "rgba(0,0,0,0.06)",
            watermarkBorder: "rgba(0,0,0,0.04)",
            watermarkRedBg: "rgba(198,40,40,0.05)",
            watermarkBlackBg: "rgba(15,23,42,0.04)",
            bigSuitTextShadow: "rgba(0,0,0,0.14)"
        }),

        cardBack: {
            top: "#05001a",
            bottom: "#0a002c",
            border: "rgba(0,200,255,0.36)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(0,200,255,0.25)",
        },

        semantic: sem("#F1F5FF", "rgba(241,245,255,0.55)", "#050510"),
        danger: "#FF3B7A",
        success: "#00F5A0",
    },

    // 05 — GILDED BAROQUE (crimson table + ornate gold)
    gildedBaroque: {
        id: "gildedBaroque",
        name: "Gilded Baroque",
        pair: { primary: "#C9A84C", secondary: "#8B1A1A" },

        neutrals: {
            bg0: "#0A0606",
            bg1: "#5A0D0D",
            ink0: "#FFF7EA",
            ink1: "#D2C1A6",
            line: "#2B1616",
        },

        table: {
            felt: "rgba(90,13,13,0.90)",
            vignette: "rgba(0,0,0,0.45)",
            rim: "rgba(201,168,76,0.18)",
            rimGradient: ["#2a0e06", "#440e04", "#2a0e06"],
            surfaceGradient: ["#3a1c08", "#482509", "#381a07"],
            rail: "rgba(200,118,28,0.26)",
            centerRing: "rgba(200,118,28,0.10)",
            gridColor: "rgba(200,135,45,1)",
            gridOpacity: 0.022,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(201,168,76,1)",
            discardGlow: "rgba(139,26,26,1)",
            counterBg: "rgba(139,26,26,0.90)",
            ghostPaper: "rgba(255,249,240,0.92)",
        },

        card: withCardMat({
            paperTop: "#f8ecd4",
            paperBottom: "#ecdbb0",
            border: "rgba(200,138,45,0.18)",
            pipRed: "#8b1818",
            pipBlack: "#18182a",
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
            top: "#180802",
            bottom: "#261005",
            border: "rgba(200,118,28,0.26)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(175,90,22,0.18)",
        },

        semantic: sem("#FFF7EA", "rgba(255,247,234,0.55)", "#0A0606"),
        danger: "#FF3B3B",
        success: "#31D07A",
    },

    // 06 — MONOCHROME INK (sumi minimal)
    monochromeInk: {
        id: "monochromeInk",
        name: "Monochrome Ink",
        pair: { primary: "#1A1612", secondary: "#4A3E32" },

        neutrals: {
            bg0: "#1e1e1e",
            bg1: "#dca112",
            ink0: "#1A1612",
            ink1: "#4A3E32",
            line: "#D8D0C2",
        },

        table: {
            felt: "#dc082f",
            // surfaceGradient: ["#f5f0e8", "#ede8dc"],
            // felt: "#041428",
            vignette: "rgba(0,20,60,0.35)",
            rail: "rgba(0,180,255,0.62)",
            rim: "rgba(0,180,255,0.1)",
            surfaceGradient: ["#1d477c", "#2662ae", "#133873"],
            rimGradient: [

                "rgba(50,40,30,0.91)",
                "rgba(50,40,30,0.15)",
                "rgba(50,40,30,0.91)",

            ],
            gridOpacity: 0.0,
            shadowOpacity: 0.45,

        },

        piles: {
            drawGlow: "rgba(26,22,18,1)",
            discardGlow: "rgb(255,127,0)",
            counterBg: "rgba(26,22,18,0.90)",
            ghostPaper: "rgba(255,255,255,0.94)",
        },

        card: withCardMat({
            cornerPlateBg: "", pendingGlow: "",
            selectedRing: "#C62828",
            paperTop: "#ffffff",
            paperBottom: "#ffffff",
            border: "rgba(0,0,0,0.31)",
            pipRed: "#C62828",
            pipBlack: "#1a1612",
            depthSheetColor: "#d50000",
            cornerPlateBorder: "rgba(0,0,0,0.10)",
            rimLight: "rgba(237,15,224,0.95)",
            bevelHighlight: "rgba(255,255,255,0.70)",
            bevelShadow: "rgba(0,0,0,0.06)",
            watermarkBorder: "rgba(0,0,0,0.04)",
            watermarkRedBg: "rgba(198,40,40,0.05)",
            watermarkBlackBg: "rgba(15,23,42,0.04)",
            bigSuitTextShadow: "rgba(0,0,0,0.94)"
        }),

        cardBack: {
            top: "#1a1612",
            bottom: "#4a3e32",
            border: "rgba(255,255,255,0.18)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(0,0,0,0.22)",
        },

        semantic: sem("#1A1612", "rgba(26,22,18,0.55)", "#F5F0E8"),
        danger: "#8B1A1A",
        success: "#2E9D78",
    },

    // 07 — DEEP OCEAN (bioluminescent)
    deepOcean: {
        id: "deepOcean",
        name: "Deep Ocean",
        pair: { primary: "#00B4D8", secondary: "#00D4D4" },

        neutrals: {
            bg0: "#020C18",
            bg1: "#041428",
            ink0: "#EAF6FF",
            ink1: "#9BC3D8",
            line: "#0F2A45",
        },

        table: {
            felt: "#041428",
            vignette: "rgba(0,20,60,0.35)",
            rail: "rgba(0,180,255,0.22)",
            rim: "rgba(0,180,255,0.12)",
            surfaceGradient: ["#020c18", "#041428", "#030e1f"],
            gridOpacity: 0.0,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(0,180,216,1)",
            discardGlow: "rgba(0,212,212,1)",
            counterBg: "rgba(0,160,255,0.15)",
            ghostPaper: "rgba(8,21,32,0.45)", // dark-tinted stack like HTML discard
        },

        card: withCardMat({
            paperTop: "#ffffff",
            paperBottom: "#ffffff",
            border: "rgba(0,0,0,0.08)",
            pipRed: "#C62828",
            pipBlack: "#020c18",
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
            top: "#041428",
            bottom: "#020c18",
            border: "rgba(0,180,216,0.32)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(0,180,216,0.18)",
        },

        semantic: sem("#EAF6FF", "rgba(234,246,255,0.55)", "#020C18"),
        danger: "#FF4D6D",
        success: "#2EE59D",
    },

    // 08 — ROSE GOLD LUXE (blush velvet)
    roseGoldLuxe: {
        id: "roseGoldLuxe",
        name: "Rose Gold Luxe",
        pair: { primary: "#D4828E", secondary: "#F8EAEC" },

        neutrals: {
            bg0: "#0D070A",
            bg1: "#3D1D28",
            ink0: "#FFF4F6",
            ink1: "#D8B7BE",
            line: "#2A141C",
        },

        table: {

            vignette: "rgba(0,0,0,0.35)",
            rail: "rgba(220,150,150,0.18)",
            rim: "rgba(220,150,150,0.12)",

            felt: "#243d14",
            surfaceGradient: ["#1a2e10", "#243d14", "#1c3012"],
            gridOpacity: 0.0,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(212,130,142,1)",
            discardGlow: "rgba(192,96,112,1)",
            counterBg: "rgba(192,96,112,0.90)",
            ghostPaper: "rgba(248,234,236,0.92)",
        },

        card: withCardMat({
            paperTop: "#ffffff",
            paperBottom: "#ffffff",
            border: "rgba(0,0,0,0.08)",
            pipRed: "#C06070",
            pipBlack: "#0d070a",
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
            top: "#3d1d28",
            bottom: "#0d070a",
            border: "rgba(212,130,142,0.28)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(212,130,142,0.20)",
        },

        semantic: sem("#FFF4F6", "rgba(255,244,246,0.55)", "#0D070A"),
        danger: "#C06070",
        success: "#31D07A",
    },

    // 09 — SOLAR PUNK (earthy greens + warm paper)
    solarPunk: {
        id: "solarPunk",
        name: "Solar Punk",
        pair: { primary: "#78C840", secondary: "#C8E8A0" },

        neutrals: {
            bg0: "#060A05",
            bg1: "#243D14",
            ink0: "#F0FFE8",
            ink1: "#B6D6A2",
            line: "#14260F",
        },

        table: {
            felt: "rgba(36,61,20,0.92)",
            vignette: "rgba(0,0,0,0.28)",
            rail: "rgba(100,180,50,0.22)",
            rim: "rgba(100,180,50,0.12)",
        },

        piles: {
            drawGlow: "rgba(120,200,64,1)",
            discardGlow: "rgba(200,232,160,1)",
            counterBg: "rgba(60,120,30,0.90)",
            ghostPaper: "rgba(245,240,224,0.90)",
        },

        card: withCardMat({
            paperTop: "#ffffff",
            paperBottom: "#ffffff",
            border: "rgba(0,0,0,0.08)",
            pipRed: "#E74C3C",
            pipBlack: "#060a05",
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
            top: "#243d14",
            bottom: "#060a05",
            border: "rgba(120,200,64,0.30)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(120,200,64,0.18)",
        },

        semantic: sem("#F0FFE8", "rgba(240,255,232,0.55)", "#060A05"),
        danger: "#E74C3C",
        success: "#2ECC71",
    },

    // 10 — SILVER DECO (platinum geometry)
    silverDeco: {
        id: "silverDeco",
        name: "Silver Deco",
        pair: { primary: "#C0C0DC", secondary: "#A8A8C8" },

        neutrals: {
            bg0: "#0E0E14",
            bg1: "#141420",
            ink0: "#F2F2FF",
            ink1: "#B9B9D6",
            line: "#232334",
        },

        table: {
            felt: "#141420",
            rail: "rgba(192,192,220,0.2)",
            surfaceGradient: ["#0e0e14", "#141420", "#0c0c12"],
            centerRing: "rgba(192,192,220,0.08)",
            gridOpacity: 0.0,
            shadowOpacity: 0.52,
        },

        piles: {
            drawGlow: "rgba(192,192,220,1)",
            discardGlow: "rgba(168,168,200,1)",
            counterBg: "rgba(192,192,220,0.15)",
            ghostPaper: "rgba(232,232,240,0.92)",
        },

        card: withCardMat({
            paperTop: "#ffffff",
            paperBottom: "#ffffff",
            border: "rgba(0,0,0,0.08)",
            pipRed: "#FF4D6D",
            pipBlack: "#0e0e14",
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
            top: "#141420",
            bottom: "#0e0e14",
            border: "rgba(192,192,220,0.28)",
            pattern: "rgba(255,255,255,0.12)",
            emblem: "rgba(192,192,220,0.18)",
        },

        semantic: sem("#F2F2FF", "rgba(242,242,255,0.55)", "#0E0E14"),
        danger: "#FF4D6D",
        success: "#2EE59D",
    },
};
