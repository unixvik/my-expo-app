// src/components/Overlays/useGhostRibbonFlight.ts

import { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";
import { ClassicSilk } from "@/animations/ghostRibbon/presets";
import { clamp, computeClassicSilkFrame } from "@/animations/ghostRibbon/engine";
import { scene3d } from "@/theme/scene";
import type { FlightRequest, AnchorKey } from "@/state/machine/types";
import type { AnchorsRef, AnchorRect, Pose3D } from "./CardFlightOverlay";

function centerOf(r: AnchorRect) {
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function degOf(v: Pose3D["rx"]): number | undefined {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
        const m = v.match(/-?\d+(\.\d+)?/);
        return m ? Number(m[0]) : undefined;
    }
    return undefined;
}

function resolveAnchor(anchors: AnchorsRef["current"], key: AnchorKey): AnchorRect | undefined {
    if (!anchors) return undefined;
    if (key === "deck") return anchors.deck;
    if (key === "discard") return anchors.discard;
    if (key === "hand") return anchors.hand;
    if (key === "stage") return anchors.stage;
    if (typeof key === "object" && key && "seat" in key) return anchors.seats[(key as any).seat];
    return undefined;
}

export function useGhostRibbonFlight(params: {
    flight?: FlightRequest;
    anchorsRef: AnchorsRef;
    cardSize: { w: number; h: number };
    onDone: (flightId: number) => void;
}) {
    const { flight, anchorsRef, cardSize, onDone } = params;
    const preset = ClassicSilk;

    // Main anim values (center coords)
    const tx = useRef(new Animated.Value(0)).current;
    const ty = useRef(new Animated.Value(0)).current;
    const rotX = useRef(new Animated.Value(0)).current;
    const rotZ = useRef(new Animated.Value(0)).current;
    const scX = useRef(new Animated.Value(1)).current;
    const scY = useRef(new Animated.Value(1)).current;
    const op = useRef(new Animated.Value(0)).current;
    const persp = useRef(new Animated.Value(0)).current;

    // Ghost arrays
    const ghosts = useMemo(() => {
        return Array.from({ length: preset.ghostCount }, () => ({
            tx: new Animated.Value(0),
            ty: new Animated.Value(0),
            rotX: new Animated.Value(0),
            rotZ: new Animated.Value(0),
            scX: new Animated.Value(1),
            scY: new Animated.Value(1),
            op: new Animated.Value(0),
            persp: new Animated.Value(0),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // preset is constant ClassicSilk

    // History ring buffer
    const histRef = useRef<any[]>([]);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);
    const activeIdRef = useRef<number | null>(null);
    const fromRectRef = useRef<AnchorRect | null>(null);
    const toRectRef = useRef<AnchorRect | null>(null);

    useEffect(() => {
        // Always cancel previous RAF when flight changes/unmounts
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        if (!flight) {
            activeIdRef.current = null;
            startRef.current = null;
            histRef.current = [];
            op.setValue(0);
            ghosts.forEach((g) => g.op.setValue(0));
            return;
        }
        if (activeIdRef.current === flight.id) return;

        const anchors = anchorsRef.current;
        const fromRect: AnchorRect | undefined =
            (flight.fromRect as any) ?? resolveAnchor(anchors, flight.from);
        const toRect: AnchorRect | undefined = resolveAnchor(anchors, flight.to);
        fromRectRef.current = fromRect;
        toRectRef.current = toRect;
        if (!fromRect || !toRect) {
            onDone(flight.id);
            return;
        }

        activeIdRef.current = flight.id;
        startRef.current = null;
        histRef.current = [];
        op.setValue(1);
        persp.setValue(1000);

        const from = centerOf(fromRect);
        const to = centerOf(toRect);

        const isDraw = flight.kind === "draw";

        // ✅ pose rx can be number OR "45deg"
        const fromRX = degOf(fromRect.pose?.rx);
        const toRX = degOf(toRect.pose?.rx);

        // ✅ Scale from 1.0 to 0.7
        const fromPose = { rz: fromRect.pose?.rz ?? 0, s: 1.0 };
        const toPose = { rz: toRect.pose?.rz ?? 0, s: 0.6 };

        const HIST_SIZE = preset.ghostCount * preset.historyStep + 6;

        // ✅ Target perspective value
        const targetPerspective = scene3d.perspective ??   1200;

        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now;
            const rawT = clamp((now - startRef.current) / preset.dur, 0, 1);

            const f = computeClassicSilkFrame(
                from,
                to,
                rawT,
                isDraw,
                preset,
                fromRX, // can be undefined -> engine uses preset defaults
                toRX,
                fromPose,
                toPose
            );

            // main
            tx.setValue(f.x);
            ty.setValue(f.y);
            rotX.setValue(f.rotX);
            rotZ.setValue(f.rotZ);
            scX.setValue(f.scX);
            scY.setValue(f.scY);

            // ✅ Animate perspective from 0 to target
            persp.setValue(rawT * targetPerspective);

            // history
            histRef.current.unshift(f);
            if (histRef.current.length > HIST_SIZE) histRef.current.pop();

            // ghosts
            for (let gi = 0; gi < ghosts.length; gi++) {
                const hi = (gi + 1) * preset.historyStep;
                const h = histRef.current[hi];
                if (!h) {
                    ghosts[gi].op.setValue(0);
                    continue;
                }

                const base = preset.opacity0 * Math.pow(preset.fadePow, gi);
                const inFlight = clamp(h.t * 12, 0, 1) * clamp((1 - h.t) * 12, 0, 1);
                const opacity = base * inFlight;

                ghosts[gi].tx.setValue(h.x);
                ghosts[gi].ty.setValue(h.y);
                ghosts[gi].rotX.setValue(h.rotX);
                ghosts[gi].rotZ.setValue(h.rotZ);
                ghosts[gi].scX.setValue(h.scX);
                ghosts[gi].scY.setValue(h.scY);
                ghosts[gi].op.setValue(opacity);

                // ✅ Ghost perspective follows main card's timeline
                ghosts[gi].persp.setValue(h.t * targetPerspective);
            }

            if (rawT < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                Animated.timing(op, { toValue: 0, duration: 10, useNativeDriver: true }).start(() => {
                    ghosts.forEach((g) => g.op.setValue(0));
                    activeIdRef.current = null;
                    onDone(flight.id);
                });
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [
        flight,
        anchorsRef,
        onDone,
        preset.dur,
        preset.ghostCount,
        preset.historyStep,
        preset.opacity0,
        preset.fadePow,
        ghosts,
        op,
        persp,
        rotX,
        rotZ,
        scX,
        scY,
        tx,
        ty,
    ]);

    return { tx, ty, rotX, rotZ, scX, scY, op, persp, ghosts, cardSize, fromRectRef, toRectRef };
}