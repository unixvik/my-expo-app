// src/components/Piles/DiscardPile/discardPileConfig.ts
// ─── Tune all discard-pile visual behaviour here ───────────────────────────

/**
 * How far the top-of-pile card is offset when it first lands ("peek" position).
 *   x / y  – pixel offset (before SCALE × mul), positive = right / down
 *   rot    – clockwise rotation in degrees
 */
export const DISCARD_PEEK = { x: 80, y: 20, rot: 25 } as const;

/**
 * Fan spread.
 *   FAN_BASE_ROT – rotation of the oldest (bottom) fan card in degrees.
 *                  Newest (top) card is always at DISCARD_PEEK.rot.
 *                  Intermediate cards interpolate linearly between the two.
 */
export const FAN_BASE_ROT = 15;

/**
 * Spring physics configs — all use useNativeDriver: true (60 FPS, native thread).
 *
 *   land      – card snaps into the peek position after landing.
 *               Medium tension + low friction = noticeable but not over-the-top bounce.
 *
 *   slideBack – card springs back to center when drawn or mandatory-draw window closes.
 *               High tension + moderate friction = fast, decisive, slight overshoot.
 */
export const DISCARD_SPRING = {
    land:      { tension: 120, friction: 6  },
    slideBack: { tension: 280, friction: 12 },
} as const;

/**
 * Card-stack depth stubs.
 *   STACK_STEP      – how many px each successive stub is shifted upward
 *                     (in the slot's rotateX space → looks deeper into the table).
 *   MAX_STACK_LAYERS – max number of stub cards rendered behind the pile.
 *   stackLayerJitter – deterministic pseudo-random x/rot per layer so stubs
 *                      don't stack perfectly; simulates cards dropped from hand.
 */
export const STACK_STEP = 7;
export const MAX_STACK_LAYERS = 17;

export function stackLayerJitter(i: number): { x: number; rot: number } {
    const n = (Math.imul(i + 1, 0x9E3779B9) >>> 0);
    return {
        x:   ((n & 0xFF) / 255 - 0.5) * 8,
        rot: (((n >> 8) & 0xFF) / 255 - 0.5) * 10,
    };
}
