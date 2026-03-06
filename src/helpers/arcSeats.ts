export type EllipseSeat = { xPct: number; yPct: number; angleDeg: number };

interface EllipseSeatsOpts {
    centerXPct?: number;      // horizontal mid
    centerYPct?: number;      // vertical mid
    radiusXPct?: number;      // horizontal radius
    radiusYPct?: number;      // vertical radius
    bottomGapPct?: number;    // keep seats above this Y%
}

export function getArcSeats(
    count: number,
    opts?: EllipseSeatsOpts
): EllipseSeat[] {
    const {
        centerXPct = 50,
        centerYPct = 50,
        radiusXPct = 40,
        radiusYPct = 35,
        bottomGapPct = 20,
    } = opts ?? {};

    if (count <= 0) return [];

    // We want the seats along the upper arc (avoid bottom area)
    // The arc spans from 180° (left) to 0° (right) by default:
    const startDeg = 200;
    const endDeg = -20;

    const seats: EllipseSeat[] = Array.from({ length: count }, (_, i) => {
        // distribute evenly between start & end
        const t = count === 1 ? 0.5 : i / (count - 1);
        const angleDeg = startDeg + (endDeg - startDeg) * t;
        const rad = (angleDeg * Math.PI) / 180;

        // ellipse parametric
        const rawX = centerXPct + Math.cos(rad) * radiusXPct;
        const rawY = centerYPct - Math.sin(rad) * radiusYPct;

        // clamp so you don’t float into UI zone at bottom
        const yPct = Math.max(rawY, bottomGapPct);

        return {
            xPct: rawX,
            yPct,
            angleDeg,
        };
    });

    return seats;
}
