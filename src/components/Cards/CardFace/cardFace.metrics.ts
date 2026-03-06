// src/components/Cards/CardFace/cardFace.metrics.ts
const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

export type CardMetrics = {
    W: number;
    H: number;
    R: number;

    pad: number;
    borderW: number;

    rankSize: number;
    suitSmallSize: number;

    rankLine: number;
    suitSmallLine: number;

    cornerInset: number;
    cornerRadius: number;
    cornerPadX: number;
    cornerPadY: number;

    sheet1: { top: number; left: number; opacity: number };
    sheet2: { top: number; left: number; opacity: number };

    selGlowR: number;
    pendGlowR: number;

    // ✅ NEW — center big suit
    bigSuitSize: number;
    bigSuitLine: number;
    bigSuitOpacity: number;

    bigSuitShadowY: number;
    bigSuitShadowBlur: number;
};

export function computeCardMetrics(args: {
    CARD_W: number;
    CARD_H: number;
    CARD_RADIUS: number;
    SCALE: number;
    isMini: boolean;
    scaleMul: number;
}): CardMetrics {
    const { CARD_W, CARD_H, CARD_RADIUS, SCALE, isMini, scaleMul } = args;

    const s = clamp(SCALE, 0.85, 1.55);
    const mul = clamp(scaleMul, 0.55, 1.25);

    const base = isMini
        ? { w: Math.round(28 * s), h: Math.round(36 * s), r: Math.max(3, Math.round(4 * s)) }
        : { w: CARD_W, h: CARD_H, r: CARD_RADIUS };

    const W = Math.round(base.w * mul);
    const H = Math.round(base.h * mul);
    const R = Math.round(base.r * mul);

    const pad = Math.max(3, Math.round(W * 0.085));
    const borderW = Math.max(1, Math.round(W * 0.012));

    const rankSize = Math.max(9, Math.round(H * 0.18));
    const suitSmallSize = Math.max(8, Math.round(H * 0.12));

    const rankLine = Math.round(rankSize * 1.02);
    const suitSmallLine = Math.round(suitSmallSize * 1.02);

    const cornerInset = Math.max(3, Math.round(W * 0.08));

    const sheet1 = {
        top: Math.round(H * 0.040),
        left: Math.round(W * 0.018),
        opacity: 0.10,
    };
    const sheet2 = {
        top: Math.round(H * 0.022),
        left: Math.round(W * 0.010),
        opacity: 0.14,
    };

    const selGlowR = Math.max(10, Math.round(W * 0.16));
    const pendGlowR = Math.max(8, Math.round(W * 0.12));

    const cornerRadius = Math.max(6, Math.round(W * 0.07));
    const cornerPadX = Math.max(6, Math.round(W * 0.06));
    const cornerPadY = Math.max(4, Math.round(H * 0.025));

    // ✅ NEW — center suit sizing (scales with real card size)
    // - normal: big + confident
    // - mini: still visible but not a blob
    const bigSuitSize = isMini
        ? Math.max(10, Math.round(H * 0.34))
        : Math.max(10, Math.round(H * 0.30));

    const bigSuitLine = Math.round(bigSuitSize * 1.0);

    // keep it readable but not screaming; you can theme this later if you want
    const bigSuitOpacity = isMini ? 0.82 : 0.92;

    // text shadow metrics (theme provides color)
    const bigSuitShadowY = Math.max(1, Math.round(2 * s * mul));
    const bigSuitShadowBlur = Math.max(2, Math.round(4 * s * mul));

    return {
        W,
        H,
        R,

        pad,
        borderW,

        rankSize,
        suitSmallSize,
        rankLine,
        suitSmallLine,

        cornerInset,
        cornerRadius,
        cornerPadX,
        cornerPadY,

        sheet1,
        sheet2,

        selGlowR,
        pendGlowR,

        bigSuitSize,
        bigSuitLine,
        bigSuitOpacity,
        bigSuitShadowY,
        bigSuitShadowBlur,
    };
}
