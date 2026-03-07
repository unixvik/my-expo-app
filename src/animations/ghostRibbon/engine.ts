import type { GhostRibbonPreset } from "./presets";

export type Pt = { x: number; y: number };

export type Frame = {
    x: number;
    y: number;
    rotX: number;
    rotZ: number;
    scX: number;
    scY: number;
    lift: number;
    t: number;
};

export function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
}
export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

// smoothstep – useful for opacity envelopes
export function smoothstep(t: number) {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
}

// Ease-out cubic: fast launch, graceful deceleration — ideal for thrown cards.
// Covers ~60% of the path in the first 30% of time, then settles smoothly.
export function easeSilk(t: number) {
    t = clamp(t, 0, 1);
    const inv = 1 - t;
    return 1 - inv * inv * inv;
}

function qbez(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
    const u = 1 - t;
    return {
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
}

type Pose2D = { rz?: number; s?: number };

export function computeClassicSilkFrame(
    from: Pt,
    to: Pt,
    rawT: number,
    isDraw: boolean,
    preset: GhostRibbonPreset,
    fromRotX?: number,
    toRotX?: number,
    fromPose?: Pose2D,
    toPose?: Pose2D,
): Frame {
    const t = clamp(rawT, 0, 1);
    const e = easeSilk(t);

    // ── Arc ────────────────────────────────────────────────────────────────
    // Scale the lift height with flight distance so short hops look natural
    // and long cross-screen flights have more drama.
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const maxLift = Math.min(-preset.arcH, dist * 0.38);          // cap at 38 % of path length
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - maxLift;
    const pos = qbez(from, { x: midX, y: midY }, to, e);

    // sin envelope – peaks at t = 0.5 (midpoint in time, early in space due to ease-out)
    const lift = Math.sin(Math.PI * t);

    // ── Base pose (rz + scale) ─────────────────────────────────────────────
    const fromRz = fromPose?.rz ?? 0;
    const toRz   = toPose?.rz   ?? 0;
    const baseRz = lerp(fromRz, toRz, e);

    const fromS = fromPose?.s ?? 1;
    const toS   = toPose?.s   ?? 1;
    const baseS = lerp(fromS, toS, e);

    // ── rotateX: table tilt → hand flat (or reverse) ──────────────────────
    const aX = fromRotX ?? (isDraw ? preset.tableRotX : preset.handRotX);
    const bX = toRotX   ?? (isDraw ? preset.handRotX  : preset.tableRotX);
    const rotX = lerp(aX, bX, e);

    // ── rotateZ: lateral bank + directional tilt ───────────────────────────
    // Card banks in the direction of horizontal travel (like a thrown frisbee),
    // peaking at the apex of the arc.
    const dx = to.x - from.x;
    const lateralFrac  = clamp(Math.abs(dx) / 600, 0, 1);   // normalise horizontal distance
    const lateralTilt  = lateralFrac * preset.baseRotZ * Math.sign(dx);
    const rotZ = baseRz + lateralTilt * lift;

    // ── Velocity-based stretch ────────────────────────────────────────────
    const ePrev  = easeSilk(clamp(t - 0.01, 0, 1));
    const speedE = (e - ePrev) / 0.01;
    const stretch = 1 + clamp(speedE * 0.018, 0, preset.stretchMax);

    // Y boost at apex gives a sense of lift / weightlessness
    const boost = 1 + lift * preset.scaleBoost;

    const scX = baseS * stretch;
    const scY = baseS * (1 / Math.sqrt(stretch)) * boost;

    return { x: pos.x, y: pos.y, rotX, rotZ, scX, scY, lift, t };
}
