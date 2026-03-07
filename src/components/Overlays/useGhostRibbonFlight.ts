// src/components/Overlays/useGhostRibbonFlight.ts

import { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";
import { ClassicSilk } from "@/animations/ghostRibbon/presets";
import { clamp, smoothstep, computeClassicSilkFrame } from "@/animations/ghostRibbon/engine";
import type { FlightRequest, AnchorKey } from "@/state/machine/types";
import type { AnchorsRef, AnchorRect, Pose3D } from "./CardFlightOverlay";
import { DISCARD_PEEK } from "@/components/Piles/DiscardPile/discardPileConfig";
import { useCardSize } from "@/hooks/useCardSize";

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
    const { SCALE } = useCardSize();

    // Main card animated values (center coords)
    const tx   = useRef(new Animated.Value(0)).current;
    const ty   = useRef(new Animated.Value(0)).current;
    const rotX = useRef(new Animated.Value(0)).current;
    const rotZ = useRef(new Animated.Value(0)).current;
    const scX  = useRef(new Animated.Value(1)).current;
    const scY  = useRef(new Animated.Value(1)).current;
    const op   = useRef(new Animated.Value(0)).current;

    // Ghost trail — no per-ghost perspective (parent container handles it)
    const ghosts = useMemo(() => {
        return Array.from({ length: preset.ghostCount }, () => ({
            tx:   new Animated.Value(0),
            ty:   new Animated.Value(0),
            rotX: new Animated.Value(0),
            rotZ: new Animated.Value(0),
            scX:  new Animated.Value(1),
            scY:  new Animated.Value(1),
            op:   new Animated.Value(0),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // preset is constant ClassicSilk

    const histRef      = useRef<any[]>([]);
    const rafRef       = useRef<number | null>(null);
    const startRef     = useRef<number | null>(null);
    const activeIdRef  = useRef<number | null>(null);
    const fromRectRef  = useRef<AnchorRect | null>(null);
    const toRectRef    = useRef<AnchorRect | null>(null);

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        if (!flight) {
            activeIdRef.current = null;
            startRef.current    = null;
            histRef.current     = [];
            op.setValue(0);
            ghosts.forEach((g) => g.op.setValue(0));
            return;
        }
        if (activeIdRef.current === flight.id) return;

        const anchors   = anchorsRef.current;
        const fromRect: AnchorRect | undefined =
            (flight.fromRect as any) ?? resolveAnchor(anchors, flight.from);
        const toRect: AnchorRect | undefined = resolveAnchor(anchors, flight.to);
        fromRectRef.current = fromRect ?? null;
        toRectRef.current   = toRect   ?? null;
        if (!fromRect || !toRect) {
            onDone(flight.id);
            return;
        }

        activeIdRef.current = flight.id;
        startRef.current    = null;
        histRef.current     = [];
        op.setValue(1);

        const from       = centerOf(fromRect);
        const baseCenter = centerOf(toRect);
        const isDraw     = flight.kind === "draw";

        // When discarding onto the pile, land at the card's proportional fan position.
        // discardFraction = k/N: card 1 of 2 lands at half-PEEK, card 2 at full PEEK.
        // This means each card arrives exactly where it will sit in the final fan — no snap.
        const isDiscardTo = flight.to === "discard";
        const peekFrac = isDiscardTo ? (flight.discardFraction ?? 1.0) : 1.0;
        const to = isDiscardTo
            ? { x: baseCenter.x + DISCARD_PEEK.x * SCALE * peekFrac, y: baseCenter.y + DISCARD_PEEK.y * SCALE * peekFrac }
            : baseCenter;

        const fromRX = degOf(fromRect.pose?.rx);
        const toRX   = degOf(toRect.pose?.rx);

        // Cards transition from their source rotation to destination size.
        // Seat anchors carry pose.s = scaleMul (0.8 mobile / 0.4 desktop) — the mini-card scale.
        // Read it for origin and destination so the card starts/ends at the correct size.
        const isSeatOrigin = typeof flight.from === "object" && !!flight.from && "seat" in flight.from;
        const isSeatDest   = typeof flight.to   === "object" && !!flight.to   && "seat" in flight.to;

        // s at origin: seats start at mini-card scale; everything else at full scale.
        // s at destination: seats land at mini-card scale; discard pile at full scale;
        //   hand/deck get a slight depth-reduction (0.88).
        const fromPose = {
            rz: fromRect.pose?.rz ?? 0,
            s: isSeatOrigin ? (fromRect.pose?.s ?? 0.8) : 1.0,
        };
        const toPose   = {
            rz: isDiscardTo ? DISCARD_PEEK.rot * peekFrac : (toRect.pose?.rz ?? 0),
            s: isDiscardTo ? 1.0 : (toRect.pose?.s ?? (isSeatDest ? 0.8 : 0.88)),
        };

        const HIST_SIZE = preset.ghostCount * preset.historyStep + 4;

        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now;
            const rawT = clamp((now - startRef.current) / preset.dur, 0, 1);

            const f = computeClassicSilkFrame(
                from, to, rawT, isDraw, preset, fromRX, toRX, fromPose, toPose
            );

            tx.setValue(f.x);
            ty.setValue(f.y);
            rotX.setValue(f.rotX);
            rotZ.setValue(f.rotZ);
            scX.setValue(f.scX);
            scY.setValue(f.scY);

            // history ring
            histRef.current.unshift(f);
            if (histRef.current.length > HIST_SIZE) histRef.current.pop();

            for (let gi = 0; gi < ghosts.length; gi++) {
                const hi = (gi + 1) * preset.historyStep;
                const h  = histRef.current[hi];
                if (!h) {
                    ghosts[gi].op.setValue(0);
                    continue;
                }

                // Smoothstep-based envelope: soft fade-in at launch, soft fade-out at landing.
                const base    = preset.opacity0 * Math.pow(preset.fadePow, gi);
                const inEnv   = smoothstep(clamp(h.t * 8,       0, 1)); // 0→1 over first ~12%
                const outEnv  = smoothstep(clamp((1 - h.t) * 10, 0, 1)); // 1→0 over last ~10%
                const opacity = base * inEnv * outEnv;

                ghosts[gi].tx.setValue(h.x);
                ghosts[gi].ty.setValue(h.y);
                ghosts[gi].rotX.setValue(h.rotX);
                ghosts[gi].rotZ.setValue(h.rotZ);
                ghosts[gi].scX.setValue(h.scX);
                ghosts[gi].scY.setValue(h.scY);
                ghosts[gi].op.setValue(opacity);
            }

            if (rawT < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                // Fire onDone immediately so the pile card appears (via setValue) at PEEK
                // while the flying card is still visible — seamless overlap crossfade.
                activeIdRef.current = null;
                onDone(flight.id);

                // Then fade the flying card out over the now-settled pile card.
                Animated.timing(op, {
                    toValue: 0,
                    duration: 60,
                    useNativeDriver: true,
                }).start(() => {
                    ghosts.forEach((g) => g.op.setValue(0));
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
        ghosts,
        op,
        rotX,
        rotZ,
        scX,
        scY,
        tx,
        ty,
        SCALE,
    ]);

    return { tx, ty, rotX, rotZ, scX, scY, op, ghosts, cardSize, fromRectRef, toRectRef };
}
