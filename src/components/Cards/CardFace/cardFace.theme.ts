// src/components/Cards/CardFace/cardFace.theme.ts
export type CardTheme = {
    face: string;
    border: string;

    pipRed: string;
    pipBlack: string;

    selectedRing: string;
    pendingGlow: string;

    paperTop: string;
    paperBottom: string;

    // material model
    depthSheetColor: string;
    cornerPlateBg: string;
    cornerPlateBorder: string;

    rimLight: string;
    bevelHighlight: string;
    bevelShadow: string;

    bigSuitTextShadow: string; // still used for text shadow if you keep it
    textMuted: string;
};

// Safe fallbacks so you can land this refactor before updating theme everywhere.
export function getCardTheme(t: any): CardTheme {
    const c = t.components?.card ?? {};
    const sem = t.semantic ?? {};

    return {
        face: c.face ?? "#F7F7F7",
        border: c.border ?? "rgba(0,0,0,0.10)",

        pipRed: c.pipRed ?? "#C62828",
        pipBlack: c.pipBlack ?? "#0F172A",

        selectedRing: c.selectedRing ?? "#7C3AED",
        pendingGlow: c.pendingGlow ?? "#22C55E",

        paperTop: c.paperTop ?? "rgba(255,255,255,0.92)",
        paperBottom: c.paperBottom ?? "rgba(0,0,0,0.03)",

        depthSheetColor: c.depthSheetColor ?? "rgba(0,0,0,1)",
        cornerPlateBg: c.cornerPlateBg ?? "rgba(255,255,255,0.56)",
        cornerPlateBorder: c.cornerPlateBorder ?? sem.border ?? "rgba(0,0,0,0.10)",

        rimLight: c.rimLight ?? "rgba(255,255,255,0.30)",
        bevelHighlight: c.bevelHighlight ?? "rgba(255,255,255,0.62)",
        bevelShadow: c.bevelShadow ?? "rgba(0,0,0,0.06)",

        bigSuitTextShadow: c.bigSuitTextShadow ?? "rgba(0,0,0,0.14)",
        textMuted: sem.textMuted ?? "rgba(255,255,255,0.55)",
    };
}
