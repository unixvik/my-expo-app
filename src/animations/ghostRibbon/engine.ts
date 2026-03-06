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

// cubic-bezier(.37,0,.17,1) approximation
export function easeSilk(t: number) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
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
    fromPose?: Pose2D, // ✅ new: inherit start rz/scale
    toPose?: Pose2D    // ✅ new: inherit end rz/scale
): Frame {
    const t = clamp(rawT, 0, 1);
    const e = easeSilk(t);

    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - preset.arcH;
    const pos = qbez(from, { x: midX, y: midY }, to, e);

    const lift = Math.sin(Math.PI * t);

    // ─────────────────────────────────────────────
    // 1) Inherit base pose (rotateZ + scale)
    // ─────────────────────────────────────────────
    const fromRz = fromPose?.rz ?? 0;
    const toRz = toPose?.rz ?? 0;
    const baseRz = lerp(fromRz, toRz, e);

    const fromS = fromPose?.s ?? 1;
    const toS = toPose?.s ?? 1;
    const baseS = lerp(fromS, toS, e);

    // ─────────────────────────────────────────────
    // 2) Classic Silk "accent" on top of base pose
    // ─────────────────────────────────────────────
    const dir = isDraw ? 1 : -1;

    // Z accent peaks at arc top
    const rotZ = baseRz + dir * preset.baseRotZ * lift;

    // rotateX blends table tilt -> flat (or reverse for discard)
    const aX = fromRotX ?? (isDraw ? preset.tableRotX : preset.handRotX);
    const bX = toRotX ?? (isDraw ? preset.handRotX : preset.tableRotX);
    const rotX = lerp(aX, bX, e);

    // ─────────────────────────────────────────────
    // 3) Velocity-based stretch around base scale
    // ─────────────────────────────────────────────
    const ePrev = easeSilk(clamp(t - 0.01, 0, 1));
    const speedE = (e - ePrev) / 0.01;

    const stretch = 1 + clamp(speedE * 0.018, 0, preset.stretchMax);

    // scaleBoost bumps at peak (applied on Y to feel "lift")
    const boost = 1 + lift * preset.scaleBoost;

    const scX = baseS * stretch;
    const scY = baseS * (1 / Math.sqrt(stretch)) * boost;

    return { x: pos.x, y: pos.y, rotX, rotZ, scX, scY, lift, t };
}