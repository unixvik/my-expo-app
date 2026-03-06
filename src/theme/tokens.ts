// src/theme/tokens.ts
export const palette = {
    // Neutrals (OLED-friendly)
    black: "#050510",
    ink: "#EDEBFF",
    inkDim: "rgba(237,235,255,0.72)",
    hairline: "rgba(255,255,255,0.10)",

    // Frame / background
    frame: "#3A1B74",
    frameDeep: "#240F53",

    // Felt greens (slightly cool)
    felt: "#0D3B2E",
    feltDeep: "#07281F",
    feltGlow: "rgba(90,220,160,0.10)",

    // Accents
    violet: "#A75AFF",
    cyan: "#5EEAD4",
    pink: "#FF5AC8",
    gold: "#E3B64B",
};

export const tokens = {
    bg: {
        app: palette.black,
        frame: palette.frame,
    },

    text: {
        primary: palette.ink,
        secondary: palette.inkDim,
        disabled: "rgba(237,235,255,0.40)",
    },

    surface: {
        panel: "rgba(255,255,255,0.06)",
        panel2: "rgba(255,255,255,0.04)",
        stroke: palette.hairline,
        strokeStrong: "rgba(255,255,255,0.16)",
    },

    table: {
        felt: palette.felt,
        feltDeep: palette.feltDeep,
        vignette: "rgba(0,0,0,0.30)",
        bounce: palette.feltGlow,
    },

    state: {
        active: palette.violet,
        next: "rgba(200,180,255,0.22)",
        danger: palette.gold, // CLAIM
    },

    glow: {
        active: "rgba(167,90,255,0.35)",
        tubePink: "rgba(255,0,200,0.30)",
        tubeCyan: "rgba(0,255,220,0.28)",
        claim: "rgba(227,182,75,0.28)",
    },

    shadow: {
        color: "rgba(0,0,0,1)",

        // global presets
        soft:   { opacity: 0.28, radius: 14, offsetY: 10, elevation: 10 },
        medium: { opacity: 0.40, radius: 16, offsetY: 12, elevation: 12 },
        heavy:  { opacity: 0.65, radius: 22, offsetY: 16, elevation: 18 },

        // contact shadow (tight + dark)
        contact:{ opacity: 0.50, radius: 4,  offsetY: 10,  elevation: 3  },
        glow: { opacity: 0.55, radius: 14,  offsetY: 10,  elevation: 3  },
    },
};

export function rnShadow(p: { opacity: number; radius: number; offsetY: number; elevation: number }) {
    return {
        shadowColor: tokens.shadow.color,
        shadowOpacity: p.opacity,
        shadowRadius: p.radius,
        shadowOffset: { width: 0, height: p.offsetY },
        elevation: p.elevation,
        color: p.color
    } as const;
}
