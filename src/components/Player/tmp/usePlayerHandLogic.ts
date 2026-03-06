// src/components/PlayerHand/usePlayerHandLogic.native.ts
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import {
    makeMutable,
    withTiming,
    withSpring,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    cancelAnimation,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

export interface  HandCard {
    id: string;
    rank: string;
    [key: string]: unknown;
}

interface GeoSlot {
    angle: number; // degrees
    x: number;
    y: number;
}

function buildGeo(count: number, handW: number, isDesktop: boolean): GeoSlot[] {
    const spreadDeg = isDesktop ? 25 : 20;
    const xStep     = handW * (isDesktop ? 0.75 : 1.65);
    const start     = -(spreadDeg * (count - 1)) / 2;
    const mid       = (count - 1) / 2;
    const nudge     = -handW * 0.45;

    return Array.from({ length: count }, (_, i) => {
        const angle = start + i * spreadDeg;
        return {
            angle,
            x: (i - mid) * xStep + nudge,
            y: Math.abs(angle) * (handW * -0.0101),
        };
    });
}

export interface HandLocalPoint { x: number; y: number }

export interface CardAnimatedValues {
    x:       SharedValue<number>;
    yBase:   SharedValue<number>;
    yFloat:  SharedValue<number>;
    rotate:  SharedValue<number>;
    scale:   SharedValue<number>;
    opacity: SharedValue<number>;
    rotateY: SharedValue<number>;
    rotateX: SharedValue<number>;
}

// ─── Spring presets ──────────────────────────────────────────────────────────
// BASE    – general repositioning, reliable
// ELASTIC – entrance / fan spread, bouncy personality
// LIFT    – hover/select raise, quick and snappy
// SETTLE  – overshoot landing, damped
// SNAPPY  – deselect / snap-back, tight
const SPRING_BASE    = { damping: 14, stiffness: 180, mass: 1.0 } as const;
const SPRING_ELASTIC = { damping:  7, stiffness: 110, mass: 0.85 } as const;
const SPRING_LIFT    = { damping: 12, stiffness: 260, mass: 0.9  } as const;
const SPRING_SETTLE  = { damping: 11, stiffness: 150, mass: 0.9  } as const;
const SPRING_SNAPPY  = { damping: 18, stiffness: 300, mass: 0.8  } as const;

// ─── Hover / selection constants ─────────────────────────────────────────────
const HOVER_Y     = -36;
const HOVER_SCALE =  1.07;
const SELECT_Y    = -42;
const SELECT_SCALE=  1.06;

// ─── Float personality per-card index ────────────────────────────────────────
// Each card gets a slightly different float rhythm so they feel alive independently
function floatParams(index: number) {
    // amplitude: gentle, between 1.8 and 3.2 px
    const amp      = 1.8 + Math.sin(index * 1.3 + 0.7) * 0.7 + (index % 3) * 0.25;
    // period: 1.6s–2.4s, staggered so adjacent cards don't sync
    const period   = 1650 + index * 95 + Math.sin(index * 0.8) * 150;
    // phase delay so the hand doesn't all rise/fall together
    const phaseDelay = index * 130;
    return { amp, period, phaseDelay };
}

function createAnimEntry(): CardAnimatedValues {
    return {
        x:       makeMutable(0),
        yBase:   makeMutable(0),
        yFloat:  makeMutable(0),
        rotate:  makeMutable(0),
        scale:   makeMutable(1),
        opacity: makeMutable(0),   // start invisible, entrance anim reveals
        rotateY: makeMutable(0),
        rotateX: makeMutable(0),
    };
}

// ─── Float loop helper ───────────────────────────────────────────────────────
function startFloat(sv: CardAnimatedValues, index: number, initialDelay = 0) {
    const { amp, period, phaseDelay } = floatParams(index);
    const totalDelay = initialDelay + phaseDelay;

    sv.yFloat.value = withDelay(
        totalDelay,
        withRepeat(
            withSequence(
                withTiming( amp, { duration: period, easing: Easing.inOut(Easing.sin) }),
                withTiming(-amp, { duration: period, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        )
    );

    // Subtle rotateX bob — card gently tips toward/away from viewer
    sv.rotateX.value = withDelay(
        totalDelay + period * 0.25, // offset from yFloat
        withRepeat(
            withSequence(
                withTiming( 0.8, { duration: period * 1.1, easing: Easing.inOut(Easing.sin) }),
                withTiming(-0.8, { duration: period * 1.1, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        )
    );
}

function stopFloat(sv: CardAnimatedValues) {
    cancelAnimation(sv.yFloat);
    cancelAnimation(sv.rotateX);
    sv.yFloat.value  = withTiming(0, { duration: 100 });
    sv.rotateX.value = withTiming(0, { duration: 100 });
}

// ─── Discard flight helper ───────────────────────────────────────────────────
// Called externally via the returned `animateDiscard` to throw a card offscreen
export function animateCardDiscard(
    sv: CardAnimatedValues,
    targetX: number,
    targetY: number,
    index: number,
) {
    const stagger = index * 55;
    stopFloat(sv);

    // Brief "wind-up" scale punch before flight
    sv.scale.value = withDelay(stagger,
        withSequence(
            withSpring(1.14, { damping: 10, stiffness: 320, mass: 0.7 }),
            withSpring(0.82, { damping:  8, stiffness: 220, mass: 0.8 }),
        )
    );

    sv.x.value = withDelay(stagger,
        withSequence(
            withTiming(targetX * 0.15, { duration: 80, easing: Easing.out(Easing.quad) }),
            withSpring(targetX, { damping: 9, stiffness: 130, mass: 0.9 }),
        )
    );

    sv.yBase.value = withDelay(stagger,
        withSequence(
            withTiming(-20, { duration: 80 }),
            withSpring(targetY, { damping: 9, stiffness: 130, mass: 0.9 }),
        )
    );

    // Spin as it flies — direction based on which side of hand
    const spinDir = targetX > 0 ? 1 : -1;
    sv.rotate.value = withDelay(stagger,
        withSpring(spinDir * 35, { damping: 6, stiffness: 80, mass: 1 })
    );

    sv.opacity.value = withDelay(stagger + 180,
        withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) })
    );
}

// ─── Main hook ───────────────────────────────────────────────────────────────
export function usePlayerHandLogic(
    cards: HandCard[],
    onDiscard?: (ids: string[], origins: Array<{ id: string; card: HandCard | undefined }>) => void,
    drawPileLocal?: HandLocalPoint | null,
    layout?: { handW: number; isDesktop: boolean }
) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingIds,  setPendingIds]  = useState<Set<string>>(new Set());

    const selectedIdsRef = useRef<Set<string>>(new Set());
    const pendingIdsRef  = useRef<Set<string>>(new Set());
    useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
    useEffect(() => { pendingIdsRef.current  = pendingIds;  }, [pendingIds]);

    const [reduceMotion, setReduceMotion] = useState(false);
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
        const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
        return () => sub.remove();
    }, []);

    const handW     = layout?.handW     ?? 80;
    const isDesktop = layout?.isDesktop ?? false;

    const geo     = useMemo(() => buildGeo(cards.length, handW, isDesktop), [cards.length, handW, isDesktop]);
    const handSig = useMemo(() => cards.map(c => c.id).join("|"), [cards]);

    const animMap    = useRef<Map<string, CardAnimatedValues>>(new Map());
    const prevIdsRef = useRef<Set<string>>(new Set());

    // Ensure SharedValue entries exist before any render
    for (const c of cards) {
        if (!animMap.current.has(c.id)) animMap.current.set(c.id, createAnimEntry());
    }

    // ── snapToBase ─────────────────────────────────────────────────────────
    const snapToBase = useCallback((id: string, immediate = false) => {
        const sv    = animMap.current.get(id);
        const index = cards.findIndex(c => c.id === id);
        if (!sv || index === -1) return;

        const g = geo[index];
        stopFloat(sv);

        if (immediate) {
            sv.x.value       = g.x;
            sv.yBase.value   = -g.y;
            sv.rotate.value  = g.angle;
            sv.scale.value   = 1;
            sv.opacity.value = 1;
            sv.rotateY.value = 0;
            sv.rotateX.value = 0;
            return;
        }

        sv.x.value       = withSpring(g.x,     SPRING_SNAPPY);
        sv.yBase.value   = withSpring(-g.y,     SPRING_SNAPPY);
        sv.rotate.value  = withSpring(g.angle,  SPRING_SNAPPY);
        sv.scale.value   = withSpring(1,        SPRING_SNAPPY);
        sv.rotateY.value = withSpring(0, { damping: 10, stiffness: 200 });
        sv.opacity.value = withTiming(1, { duration: 120 });

        // Restart float after snapping back
        if (!reduceMotion) startFloat(sv, index, 350);
    }, [cards, geo, reduceMotion]);

    // ── lift (select) ──────────────────────────────────────────────────────
    const lift = useCallback((id: string) => {
        const sv = animMap.current.get(id);
        if (!sv || pendingIdsRef.current.has(id)) return;

        stopFloat(sv);

        sv.yBase.value   = withSpring(SELECT_Y,    SPRING_LIFT);
        sv.scale.value   = withSpring(SELECT_SCALE, SPRING_LIFT);
        // Slight forward tilt — card leans toward player when selected
        sv.rotateX.value = withSpring(-2.5, { damping: 10, stiffness: 200 });
        // Subtle rotateY wobble — feels like picking up a physical card
        sv.rotateY.value = withSequence(
            withSpring( 4, { damping: 6, stiffness: 280, mass: 0.7 }),
            withSpring(-2, { damping: 8, stiffness: 200, mass: 0.8 }),
            withSpring( 0, { damping: 12, stiffness: 220 }),
        );
    }, []);

    const applySelectionVisuals = useCallback((sel: Set<string>) => {
        for (const c of cards) {
            if (sel.has(c.id)) lift(c.id);
            else snapToBase(c.id);
        }
    }, [cards, lift, snapToBase]);

    // ── main entrance / re-slot layout effect ─────────────────────────────
    useLayoutEffect(() => {
        const prev    = prevIdsRef.current;
        const current = new Set(cards.map(c => c.id));

        const added: string[] = [];
        for (const id of current) if (!prev.has(id)) added.push(id);

        const indexById = new Map<string, number>();
        for (let i = 0; i < cards.length; i++) indexById.set(cards[i].id, i);

        // 1) Re-slot existing cards ─────────────────────────────────────────
        for (const c of cards) {
            if (added.includes(c.id)) continue;

            const sv    = animMap.current.get(c.id);
            const index = indexById.get(c.id);
            if (!sv || index === undefined) continue;

            const g     = geo[index];
            const delay = reduceMotion ? 0 : index * 25;

            if (selectedIdsRef.current.has(c.id) || pendingIdsRef.current.has(c.id)) continue;

            stopFloat(sv);

            const spring = reduceMotion ? SPRING_BASE : SPRING_ELASTIC;
            sv.x.value       = withDelay(delay, withSpring(g.x,    spring));
            sv.yBase.value   = withDelay(delay, withSpring(-g.y,   spring));
            sv.rotate.value  = withDelay(delay, withSpring(g.angle, spring));
            sv.scale.value   = withDelay(delay, withSpring(1, SPRING_BASE));
            sv.opacity.value = withTiming(1, { duration: 150 });

            if (!reduceMotion) startFloat(sv, index, delay + 500);
            else sv.yFloat.value = 0;
        }

        // 2) Entrance for newly drawn cards ───────────────────────────────
        for (const id of added) {
            const sv    = animMap.current.get(id);
            const index = indexById.get(id);
            if (!sv || index === undefined) continue;

            const g     = geo[index];
            // Cascade stagger: earlier cards land first
            const delay = reduceMotion ? 0 : index * 60;

            stopFloat(sv);

            const fromX = drawPileLocal?.x ?? g.x;
            const fromY = drawPileLocal?.y ?? (-g.y + 80);

            if (reduceMotion) {
                sv.x.value       = g.x;
                sv.yBase.value   = -g.y;
                sv.rotate.value  = g.angle;
                sv.scale.value   = 1;
                sv.opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
            } else {
                // Start: at draw pile, invisible, slightly rotated
                const launchRotOffset = (Math.random() * 18 - 9) + (index % 2 === 0 ? 8 : -8);

                sv.x.value       = fromX;
                sv.yBase.value   = fromY;
                sv.yFloat.value  = 0;
                sv.opacity.value = 0;
                sv.scale.value   = 0.7;
                sv.rotate.value  = g.angle + launchRotOffset;
                sv.rotateY.value = launchRotOffset * 1.5; // starts tilted in 3D

                // ── Fade in
                sv.opacity.value = withDelay(delay,
                    withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
                );

                // ── Fly to slot X
                sv.x.value = withDelay(delay,
                    withSpring(g.x, SPRING_ELASTIC)
                );

                // ── Rotate to final angle (settle via overshoot)
                sv.rotate.value = withDelay(delay,
                    withSequence(
                        withSpring(g.angle - 3, SPRING_ELASTIC),
                        withSpring(g.angle,     SPRING_SETTLE),
                    )
                );

                // ── 3D tilt unwind as card "faces" player
                sv.rotateY.value = withDelay(delay,
                    withSequence(
                        withSpring(launchRotOffset * 0.3, { damping: 7, stiffness: 180, mass: 0.9 }),
                        withSpring(0, { damping: 12, stiffness: 200 }),
                    )
                );

                // ── Y: arc up past slot then settle (feels like a toss)
                sv.yBase.value = withDelay(delay,
                    withSequence(
                        withSpring(-g.y - 30, SPRING_ELASTIC),  // overshoot up
                        withSpring(-g.y,      SPRING_SETTLE),   // land
                    )
                );

                // ── Scale: pop in, land with a little squash
                sv.scale.value = withDelay(delay,
                    withSequence(
                        withSpring(1.18, { damping:  8, stiffness: 240, mass: 0.75 }), // pop
                        withSpring(0.95, { damping: 10, stiffness: 200, mass: 0.85 }), // squash on land
                        withSpring(1.0,  SPRING_SETTLE),                                // settle
                    )
                );

                // ── Begin floating after entrance lands
                startFloat(sv, index, delay + 750);
            }
        }

        prevIdsRef.current = current;
    }, [handSig, geo, drawPileLocal, reduceMotion]);

    // ── Hover ──────────────────────────────────────────────────────────────
    const onCardHoverIn = useCallback((id: string) => {
        if (reduceMotion) return;
        if (selectedIdsRef.current.has(id) || pendingIdsRef.current.has(id)) return;

        const sv = animMap.current.get(id);
        if (!sv) return;

        stopFloat(sv);
        sv.scale.value   = withSpring(HOVER_SCALE, SPRING_LIFT);
        sv.yBase.value   = withSpring(HOVER_Y,     SPRING_LIFT);
        // Gentle forward tip — card tilts toward the player on hover
        sv.rotateX.value = withSpring(-1.5, { damping: 12, stiffness: 220 });
        // Micro-wobble on rotateY: like nudging a physical card
        sv.rotateY.value = withSequence(
            withSpring( 3, { damping: 7, stiffness: 300, mass: 0.6 }),
            withSpring(-1.5, { damping: 9, stiffness: 250 }),
            withSpring( 0,   { damping: 14, stiffness: 260 }),
        );
    }, [reduceMotion]);

    const onCardHoverOut = useCallback((id: string) => {
        if (pendingIdsRef.current.has(id) || selectedIdsRef.current.has(id)) return;
        snapToBase(id);
    }, [snapToBase]);

    // ── Press ──────────────────────────────────────────────────────────────
    const onCardPress = useCallback((id: string) => {
        if (pendingIdsRef.current.has(id)) return;

        const clicked = cards.find(c => c.id === id);
        if (!clicked) return;

        setSelectedIds(prev => {
            const next    = new Set(prev);
            const firstId = prev.values().next().value as string | undefined;
            const firstCard = firstId ? cards.find(c => c.id === firstId) : undefined;
            const curRank = firstCard?.rank ?? null;

            if (curRank && curRank !== clicked.rank) {
                next.clear();
                next.add(id);
            } else {
                next.has(id) ? next.delete(id) : next.add(id);
            }

            applySelectionVisuals(next);
            return next;
        });
    }, [cards, applySelectionVisuals]);

    // ── Discard ────────────────────────────────────────────────────────────
    const handleDiscard = useCallback(() => {
        if (!onDiscard || selectedIdsRef.current.size === 0) return;

        const ids     = Array.from(selectedIdsRef.current);
        const origins = ids.map(id => ({ id, card: cards.find(c => c.id === id) }));

        setSelectedIds(new Set());
        setPendingIds(new Set(ids));
        onDiscard(ids, origins);
    }, [onDiscard, cards]);

    // ── Prune removed ids ──────────────────────────────────────────────────
    useEffect(() => {
        const currentIds = new Set(cards.map(c => c.id));
        for (const id of Array.from(animMap.current.keys())) {
            if (!currentIds.has(id)) animMap.current.delete(id);
        }
    }, [cards]);

    const getAnimValues = useCallback((id: string) => animMap.current.get(id), []);

    return {
        selectedIds,
        pendingIds,
        geo,
        getAnimValues,
        onCardPress,
        onCardHoverIn,
        onCardHoverOut,
        handleDiscard,
        lift,
        snapToBase,
        animateCardDiscard,
    };
}