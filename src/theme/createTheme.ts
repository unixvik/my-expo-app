// src/theme/createTheme.ts
import type { ThemeSpec, ThemeId } from "./themes";

/**
 * Central idea:
 * - spec contains raw palette + pair
 * - buildTheme outputs semantic + component tokens
 * Components should only read from the output object.
 */
export function createTheme(spec: ThemeSpec) {
    const { pair, neutrals } = spec;

    const semantic = {
        bg: neutrals.bg0,
        surface: neutrals.bg1,
        text: neutrals.ink0,
        textMuted: neutrals.ink1,
        border: neutrals.line,

        accent: pair.primary,
        accent2: pair.secondary,

        danger: spec.danger ?? "#FF4D4D",
        success: spec.success ?? "#2EE59D",
    };

    const tableFelt = spec.table?.felt ?? semantic.surface;

    // Component tokens (this is where you stop “random hex creep”)
    const components = {
        table: {
            felt: spec.table?.felt ?? semantic.surface,
            vignette: spec.table?.vignette ?? "rgba(0,0,0,0.55)",
            rail: spec.table?.rail ?? semantic.border,
            highlight: semantic.accent,
            rim: spec.table?.rim ?? "",
            rimGradient: spec.table?.rimGradient ?? [
                "rgba(20,20,28,1)",
                "rgba(40,40,56,1)",
                "rgba(20,20,28,1)",
            ],
            surfaceGradient: spec.table?.surfaceGradient ?? [
                tableFelt,
                tableFelt,
                tableFelt,
            ],
            centerRing: spec.table?.centerRing ?? "rgba(255,255,255,0.08)",
            gridColor: spec.table?.gridColor ?? semantic.accent2,
            gridOpacity: spec.table?.gridOpacity ?? 0, // default OFF so old look stays clean
            shadowOpacity: spec.table?.shadowOpacity ?? 0.52,

        },


        card: {
            // face paper (themeable now)
            face: "#FFFFFF",
            paperTop: spec.card?.paperTop ?? "rgba(255,255,255,0.92)",
            paperBottom: spec.card?.paperBottom ?? "rgba(235,235,235,0.94)",
            border: spec.card?.border ?? "rgba(0,0,0,0.12)",
            cornerPlateBg: spec.card?.cornerPlateBg ?? "rgba(255,255,255,0.56)",

            pipRed: spec.card?.pipRed ?? "#C62828",
            pipBlack: spec.card?.pipBlack ?? "#0F172A",

            selectedRing: spec.card?.selectedRing ?? semantic.accent,
            pendingGlow: spec.card?.pendingGlow ?? semantic.accent2,
        },

        cardBack: {
            top: spec.cardBack?.top ?? semantic.bg,
            bottom: spec.cardBack?.bottom ?? semantic.surface,
            border: spec.cardBack?.border ?? semantic.border,
            pattern: spec.cardBack?.pattern ?? semantic.accent2,
            emblem: spec.cardBack?.emblem ?? semantic.accent,
        },

        // ✅ now theme-driven + overrideable
        piles: {
            drawGlow: spec.piles?.drawGlow ?? semantic.accent,
            discardGlow: spec.piles?.discardGlow ?? semantic.accent2,
            counterBg: spec.piles?.counterBg ?? "rgba(0,0,0,0.35)",
        },


        ui: {
            buttonBg: semantic.accent,
            buttonText: "#061018",
            popupBg: "rgba(10,14,22,0.92)",
            popupBorder: semantic.border,
            hudText: semantic.text,
            hudMuted: semantic.textMuted,
        },
    };

    // Shadows/lift levels: keep them “themeable” but mostly stable
    // (you already have rnShadow tokens — you can wire those here)
    const elevation = {
        lift1: { shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
        lift2: { shadowOpacity: 0.26, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
    };

    return {
        id: spec.id as ThemeId,
        name: spec.name,
        spec,
        semantic,
        components,
        elevation,
    } as const;
}

export type Theme = ReturnType<typeof createTheme>;
