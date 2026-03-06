// src/components/Table/TableSurface/tableStyles.ts
import { StyleSheet, Platform } from "react-native";
import type { Theme } from "@/theme";
import { rnShadow, tokens } from "@/theme/tokens";

export function makeTableStyles(t: any, box: { w: number; h: number }) {
    const radius = box.w && box.h ? Math.min(box.w, box.h) / 2 : 100;
    // const radius=1;
    // NOTE: These paths match what you already use: t.components.table.*
    const felt = t.components.table.felt;
    const rail = t.components.table.rail;
    const vignette = t.components.table.vignette ?? "rgba(0,0,0,0.55)";
    const rimStroke = t.components.table.rim ?? "rgba(255,255,255,0.10)";

    // If your createTheme doesn’t provide gradients yet, fall back gracefully
    const rimGradient = t.components.table.rimGradient ?? ["#121018", "#1b1430", "#121018"];
    const surfaceGradient = t.components.table.surfaceGradient ?? [felt, felt, felt];
    const centerRing = t.components.table.centerRing ?? "rgba(255,255,255,0.08)";
    const gridOpacity = t.components.table.gridOpacity ?? 0.08;

    const shadowOpacity = t.components.table.shadowOpacity ?? 0.52;

    const rimInset = 13; // matches HTML-ish (-13 inset) vibe via bigger layer
    const railInset = 9;

    return StyleSheet.create({
        shadow: {
            position: "absolute",
            bottom: "-8%",
            left: "1%",
            right: "1%",
            height: "100%",
            borderRadius: 9999,
            backgroundColor: `rgba(0,0,0,${shadowOpacity})`,
            // opacity: 0.7,
            ...rnShadow(tokens.shadow.soft),
        },

        rim: {
            position: "absolute",
            inset: -rimInset,
            borderRadius: 9999,
            // carry gradient payload via style (TableRim reads rimGradient)
            ...( { rimGradient } as any ),
            borderWidth: 12,
            borderColor: rimStroke,
            ...rnShadow(tokens.shadow.medium),
        },

        surfaceClip: {
            position: "absolute",
            inset: 0,
            borderRadius: 200,
            overflow: "hidden",
        },

        felt: {
            ...StyleSheet.absoluteFillObject,

            ...( { surfaceGradient } as any ),
        },

        grid: {
            opacity: gridOpacity,
        },

        centerRing: {
            position: "absolute",
            top: "22%",
            left: "21%",
            right: "21%",
            bottom: "22%",
            borderRadius: 220,
            borderWidth: 2,
            borderColor: centerRing,
        },

        rail: {
            position: "absolute",
            inset: railInset,
            borderRadius: 9999,
            borderWidth: 2,
            borderColor: rail,
            backgroundColor: "transparent",
        },

        iosLift: Platform.select({
            ios: {
                position: "absolute",
                inset: 0,
                borderRadius: radius,
                shadowColor: "#000",
                shadowOpacity: 0.35,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 16 },
            },
            default: {},
        }) as any,

        androidLift: Platform.select({
            android: { position: "absolute", inset: 0, borderRadius: radius, elevation: 14 },
            default: {},
        }) as any,
    });
}
