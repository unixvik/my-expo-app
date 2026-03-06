// src/components/Piles/_shared/usePileStack.ts
import { useMemo } from "react";

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

/**
 * Stable pseudo-random jitter in [-range, +range]
 * (cheap, deterministic, no allocations)
 */
function jitter(seed: number, range: number): number {
    // integer hash → 0..1 → [-range, +range]
    const x = (seed * 1103515245 + 12345) >>> 0;
    const t = (x & 0xffff) / 0xffff; // 0..1
    return (t * 2 - 1) * range;
}

export type PileLayer = {
    translateX: number;
    translateY: number;
    rotate: string;
    scale: number;
    opacity: number;
    isTop: boolean;
    zIndex: number;
};

export function usePileStack(opts: {
    count: number;
    scale: number;
    mul: number;
    maxVisible?: number; // default 8
    depthY?: number; // stacking down
    spreadX?: number;
    spreadY?: number;
    rotateRangeDeg?: number;

    /**
     * When count exceeds maxVisible, this adds a subtle extra base lift
     * so the pile still feels like it’s growing.
     */
    overflowLiftPerCard?: number; // default 0.25
}) {
    const {
        count,
        scale,
        mul,
        maxVisible = 5,
        depthY = 9,
        spreadX = 4.5,
        spreadY = 2.0,
        rotateRangeDeg = 15,
        overflowLiftPerCard = 0.525,
    } = opts;

    return useMemo<PileLayer[]>(() => {
        if (count <= 0) return [];

        // how many layers we actually render
        const visible = clamp(count, 1, maxVisible);

        // ✅ drop from the bottom, keep newest on top
        const startIndex = Math.max(0, count - visible);

        // optional “mass hint” after cap
        const overflow = Math.max(0, count - visible);
        const overflowLift = overflow * (overflowLiftPerCard * scale * mul);

        // precompute common multipliers
        const sxRange = spreadX * scale * mul;
        const syRange = spreadY * scale * mul;
        const dyStep = depthY * scale * mul;

        const layers: PileLayer[] = new Array(visible);

        for (let i = 0; i < visible; i++) {
            const realIndex = startIndex + i; // ✅ ties visuals to actual history
            const isTop = realIndex === count - 1;

            // 0 = top, larger = deeper
            const depth = (visible - 1) - i;

            const sx = jitter(realIndex * 3, sxRange);
            const sy = jitter(realIndex * 7 + 1, syRange) + depth * dyStep + overflowLift;

            const rot = jitter(realIndex * 11 + 3, rotateRangeDeg);
            const layerScale = 1 - depth * 0.018;
            // const opacity = isTop ? 1 : clamp(1 - depth * 0.15, 0.68, 1);
const opacity=1;
            layers[i] = {
                translateX: sx,
                translateY: sy,
                rotate: `${rot}deg`,
                scale: layerScale,
                opacity,
                isTop,
                zIndex: i,
            };
        }

        return layers;
    }, [
        count,
        scale,
        mul,
        maxVisible,
        depthY,
        spreadX,
        spreadY,
        rotateRangeDeg,
        overflowLiftPerCard,
    ]);
}
