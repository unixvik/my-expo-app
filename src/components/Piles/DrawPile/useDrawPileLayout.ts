// src/components/Piles/DrawPile/useDrawPileLayout.ts
import { useMemo, useCallback } from "react";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function useDrawPileLayout(opts: {
    drawCount: number;
    scale: number;
    cardW: number;
    cardH: number;
    cardR: number;
    perspective: number;
}) {
    const { drawCount, scale, cardW, cardH, cardR, perspective } = opts;

    const dims = useMemo(() => {
        const WRAP_PAD = Math.round(20 * scale);
        const GLOW_PAD = Math.round(30 * scale);
        const INNER_PAD = Math.round(10 * scale);

        const SHIMMER_W = Math.round(40 * scale);
        const BADGE_OFF = Math.round(10 * scale);
        const BADGE_FONT = Math.round(20 * scale);
        const LABEL_FONT = Math.round(10 * scale);

        const FLOAT_Y = Math.round(6 * scale);
        const TOP_LIFT = Math.round(4 * scale);

        const DX = 1.2 * scale;
        const DY = 3.0 * scale;

        return {
            WRAP_PAD, GLOW_PAD, INNER_PAD, SHIMMER_W,
            BADGE_OFF, BADGE_FONT, LABEL_FONT,
            FLOAT_Y, TOP_LIFT, DX, DY,
            PERSPECTIVE: Math.round(perspective * 0.85),
            PILE_TILT_X: "33deg" as const,
            PILE_TILT_Y: "6deg" as const,
            PILE_Z: "5deg" as const,
        };
    }, [scale, perspective]);

    const visible = useMemo(() => {
        if (drawCount <= 0) return 0;
        const v = Math.ceil(drawCount / 5);
        return clamp(v, 1, 7);
    }, [drawCount]);

    const jitter = useCallback((n: number) => (((n * 37) % 7) - 3) * -0.2, []);

    const offsets = useMemo(() => {
        if (visible <= 0) return [];
        return Array.from({ length: visible }).map((_, i) => {
            const depth = visible - 1 - i;
            return {
                rotate: `${(depth - visible / 2) * -1.8 + jitter(depth)}deg`,
                translateX: depth * dims.DX + jitter(depth),
                translateY: depth * dims.DY + jitter(depth),
                scale: 1 - depth * (0.01 * scale),
                opacity: 1 - depth * 0.08,
                isTop: i === visible - 1,
            };
        });
    }, [visible, dims.DX, dims.DY, scale, jitter]);

    return { dims, visible, offsets, cardW, cardH, cardR };
}