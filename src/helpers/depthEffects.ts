function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export interface DepthConfig {
    yMin: number;
    yMax: number;
}

export interface DepthEffects {
    depth: number;
    tiltX: number;
    scale: number;
    opacity: number;
}

export interface DepthQuantize {
    rows: number;
    mode?: "center" | "floor";
}

export function calculateDepthEffects(
    yPct: number,
    config: DepthConfig,
    baseScale: number = 1,
    quantize?: DepthQuantize
): DepthEffects {
    // ✅ Guard against division by zero
    const range = config.yMax - config.yMin;
    let depth = range === 0 ? 0 : clamp01((yPct - config.yMin) / range);

    if (quantize && quantize.rows > 1) {
        const rows = quantize.rows;
        const mode = quantize.mode ?? "center";

        if (mode === "floor") {
            // ✅ Fixed off-by-one edge case
            const idx = Math.max(0, Math.min(rows - 1, Math.floor(depth * rows)));
            depth = idx / (rows - 1);
        } else {
            const idx = Math.round(depth * (rows - 1));
            depth = idx / (rows - 1);
        }
    }

    // Top seats tilted more (10°), bottom seats flat (0°)
    const tiltX = lerp(10, 0, depth);

    // Top seats smaller (far), bottom seats bigger (close)
    const depthScale = lerp(0.7, 1, depth);

    // Subtle opacity fade for far seats
    const opacity = lerp(0.88, 1.0, depth);

    return {
        depth,
        tiltX,
        scale: baseScale * depthScale,
        opacity,
    };
}

// ✅ Now handles all three device layouts
export function getDepthConfig(
    isMobileLandscape: boolean,
    isDesktop: boolean,
    isNative: boolean,
): DepthConfig {
    if (isDesktop)         return { yMin: 10, yMax: 50 };
    if (isNative) return { yMin: 5,  yMax: 90 };
    return                        { yMin: 1,  yMax: 95 };
}