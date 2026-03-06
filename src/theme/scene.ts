// src/theme/scene.ts

export type Pose3D = { rx: number; ry: number; rz: number; s: number };

export const scene3d = {
    perspective: 850,
    tableTiltX: 33,
    tableYawY: 0,

    // Common pile styling
    pileScale: 0.78,

    // Per-pile Z rotations (keep tiny, so it feels like table dressing not chaos)
    drawRz: 5,
    discardRz: 0,

    // Hand plane (flat)
    handTiltX: 0,
    handYawY: 0,
    handRz: 0,
    handScale: 1,
} as const;

// Convenience poses:
export function poseTablePile(kind: "draw" | "discard"): Pose3D {
    return {
        rx: scene3d.tableTiltX,
        ry: scene3d.tableYawY,
        rz: kind === "draw" ? scene3d.drawRz : scene3d.discardRz,
        s: scene3d.pileScale,
    };
}

export function poseHand(): Pose3D {
    return {
        rx: scene3d.handTiltX,
        ry: scene3d.handYawY,
        rz: scene3d.handRz,
        s: scene3d.handScale,
    };
}