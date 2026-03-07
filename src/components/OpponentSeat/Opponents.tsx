// src/components/OpponentSeat/Opponents.tsx
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { OpponentSeat } from "./OpponentSeat";
import { getArcSeats } from "@/helpers/arcSeats";
import { calculateDepthEffects, getDepthConfig } from "@/helpers/depthEffects";
import { useDevice } from "@/hooks/useDevice";
import type { Opponent } from "@/types/game";

type Rect = { x: number; y: number; w: number; h: number; pose?: { s?: number; rx?: number; ry?: number; rz?: number } };

interface OpponentsProps {
    mockOpponents: Opponent[];
    onSeatOrigins?: (map: Record<string, { x: number; y: number }>) => void;

    // Turn topology
    turnOrder: string[];
    currentTurnIndex: number | null;
    myPlayerId: string | null; // ✅ stableId

    fxDisabled?: boolean;

    // ✅ reports global rect for each opponent seat (keyed by stableId)
    onSeatAnchor?: (id: string, r: Rect) => void;
}

type Seat = { xPct: number; yPct: number };
type Depth = ReturnType<typeof calculateDepthEffects>;

const SEAT_HALF_W = 100;
const SEAT_HALF_H = 50;

// -----------------------------
// Small pure helpers
// -----------------------------
function rotateAfter(order: string[], anchorId: string) {
    const idx = order.indexOf(anchorId);
    if (idx < 0) return null;
    return order.slice(idx + 1).concat(order.slice(0, idx));
}

function buildOrderedOpponents(
    opponents: Opponent[],
    turnOrder: string[],
    myPlayerId: string | null
): { ordered: Opponent[]; orderedIds: string[]; missing: string[]; ok: boolean } {
    if (!turnOrder?.length || !myPlayerId) {
        return {
            ordered: opponents,
            orderedIds: opponents.map((o) => o.id),
            missing: [],
            ok: false,
        };
    }

    const rotated = rotateAfter(turnOrder, myPlayerId);
    if (!rotated) {
        return {
            ordered: opponents,
            orderedIds: opponents.map((o) => o.id),
            missing: [],
            ok: false,
        };
    }

    const orderedIds = rotated.filter((id) => id !== myPlayerId);
    const byId = new Map(opponents.map((o) => [o.id, o]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Opponent[];

    const missing = orderedIds.filter((id) => !byId.has(id));

    // fallback: keep what we can, then append remaining
    if (ordered.length !== opponents.length) {
        const used = new Set(ordered.map((o) => o.id));
        const rest = opponents.filter((o) => !used.has(o.id));
        return { ordered: ordered.concat(rest), orderedIds, missing, ok: false };
    }

    return { ordered, orderedIds, missing, ok: true };
}

// -----------------------------
// Seat wrapper (memoized)
// -----------------------------
type WrapperProps = {
    opponent: Opponent;
    seat: Seat;
    depth: Depth;
    isActive: boolean;
    isNext: boolean;
    isMobileLandscape: boolean;
    fxDisabled: boolean;
    onSeatAnchor?: (id: string, r: Rect) => void;
};

const OpponentSeatWrapperImpl = ({
                                     opponent,
                                     seat,
                                     depth,
                                     isActive,
                                     isNext,
                                     isMobileLandscape,
                                     fxDisabled,
                                     onSeatAnchor,
                                 }: WrapperProps) => {
    const ref = useRef<View>(null);

    const wrapStyle = useMemo(
        () => ({
            position: "absolute" as const,
            left: `${seat.xPct}%`,
            top: `${seat.yPct}%`,
            zIndex: Math.round(seat.yPct),
            opacity: depth.opacity,
            transform: [
                { translateX: -SEAT_HALF_W },
                { translateY: -SEAT_HALF_H },
                { scale: depth.scale },
            ],
        }),
        [seat.xPct, seat.yPct, depth.opacity, depth.scale]
    );

    const { isDesktop } = useDevice();
    // scaleMul matches FloatingCard's scaleMul — mini cards are 0.8 on mobile, 0.4 on desktop
    const scaleMul = isDesktop ? 0.4 : 0.8;

    const report = useCallback(() => {
        if (!onSeatAnchor) return;
        const node: any = ref.current;
        if (!node?.measureInWindow) return;

        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w > 0 && h > 0) onSeatAnchor(opponent.id, { x, y, w, h, pose: { s: scaleMul } });
        });
    }, [onSeatAnchor, opponent.id, scaleMul]);

    // Measure on mount and whenever the seat meaningfully moves/scales
    useEffect(() => {
        requestAnimationFrame(report);
    }, [report, seat.xPct, seat.yPct, depth.scale, depth.opacity]);

    return (
        <View
            ref={ref} // ✅ attach ref so measureInWindow works
            pointerEvents="box-none"
            style={wrapStyle}
            onLayout={() => {
                // ✅ wait one frame so percent layout + transforms settle
                requestAnimationFrame(report);
            }}
        >
            <OpponentSeat
                id={opponent.id}
                name={opponent.name}
                cardCount={opponent.cardCount}
                isTurnActive={isActive}
                revealedCards={opponent.cards}
                handValue={opponent.handValue}
                isTurnNext={isNext}
                fxDisabled={fxDisabled}
                // cardsAbove={isMobileLandscape}
            />
        </View>
    );
};

const OpponentSeatWrapper = React.memo(OpponentSeatWrapperImpl, (a, b) => {
    return (
        a.opponent.id === b.opponent.id &&
        a.opponent.name === b.opponent.name &&
        a.opponent.cardCount === b.opponent.cardCount &&
        a.opponent.cards === b.opponent.cards &&
        a.seat.xPct === b.seat.xPct &&
        a.seat.yPct === b.seat.yPct &&
        a.depth.opacity === b.depth.opacity &&
        a.depth.scale === b.depth.scale &&
        a.isActive === b.isActive &&
        a.isNext === b.isNext &&
        a.isMobileLandscape === b.isMobileLandscape &&
        a.fxDisabled === b.fxDisabled &&
        a.onSeatAnchor === b.onSeatAnchor
    );
});

// -----------------------------
// Main
// -----------------------------
export default function Opponents({
                                      mockOpponents,
                                      turnOrder,
                                      currentTurnIndex,
                                      myPlayerId,
                                      fxDisabled = false,
                                      onSeatOrigins,
                                      onSeatAnchor,
                                  }: OpponentsProps) {
    const { isMobileLandscape, isDesktop, isNative } = useDevice();
    const { width: vw, height: vh } = useWindowDimensions();

    // scale for depth effects (kept from your original)
    const globalScale = useMemo(() => Math.max(0.65, Math.min(1, vw / 1440)), [vw]);

    // Seats (order depends on arcSeats.ts; make sure it's clockwise)
    const seats: Seat[] = useMemo(() => {
        const config = {
            centerXPct: isDesktop ? 50 : isNative ? 38 : 50,
            centerYPct: isDesktop ? 55 : isNative ? 50 : 50,
            radiusXPct: isDesktop ? 40 : isNative ? 37 : 40,
            radiusYPct: isDesktop ? 50 : isNative ? 38 : 40,
            bottomGapPct: isMobileLandscape ? 8 : 8,
        };

        if (!myPlayerId || !turnOrder?.length) {
            return getArcSeats(mockOpponents.length, config);
        }

        const rotated = rotateAfter(turnOrder, myPlayerId);
        if (!rotated) {
            return getArcSeats(mockOpponents.length, config);
        }

        // rotated is already "after me", and does not include me
        // Defensive dedupe (in case server turnOrder ever duplicates)
        const orderedOpponentIds = Array.from(new Set(rotated));

        return getArcSeats(orderedOpponentIds.length, config);
    }, [mockOpponents.length, turnOrder, myPlayerId, isDesktop, isMobileLandscape, isNative]);

    const depthConfig = useMemo(
        () => getDepthConfig(isMobileLandscape, isDesktop, isNative),
        [isMobileLandscape, isDesktop, isNative]
    );

    const seatDepths: Depth[] = useMemo(
        () =>
            seats.map((s) =>
                calculateDepthEffects(s.yPct, depthConfig, globalScale, {
                    rows: 3,
                    mode: "center",
                })
            ),
        [seats, depthConfig, globalScale]
    );

    // Order opponents based on turnOrder (anchored to me)
    const orderInfo = useMemo(
        () => buildOrderedOpponents(mockOpponents, turnOrder, myPlayerId),
        [mockOpponents, turnOrder, myPlayerId]
    );
    const orderedOpponents = orderInfo.ordered;

    // Active/next ids
    const activeTurnId =
        currentTurnIndex != null && turnOrder?.length ? turnOrder[currentTurnIndex] ?? null : null;

    const nextTurnId =
        currentTurnIndex != null && turnOrder?.length
            ? turnOrder[(currentTurnIndex + 1) % turnOrder.length] ?? null
            : null;

    // -----------------------------
    // Seat origins callback (stable)
    // -----------------------------
    const onSeatOriginsRef = useRef(onSeatOrigins);
    useEffect(() => {
        onSeatOriginsRef.current = onSeatOrigins;
    }, [onSeatOrigins]);

    const prevOriginsKey = useRef("");
    useEffect(() => {
        const cb = onSeatOriginsRef.current;
        if (!cb) return;

        const key =
            `${vw}x${vh}|` +
            orderedOpponents.map((o, i) => `${o.id}:${seats[i]?.xPct},${seats[i]?.yPct}`).join("|");

        if (key === prevOriginsKey.current) return;
        prevOriginsKey.current = key;

        const origins: Record<string, { x: number; y: number }> = {};
        for (let i = 0; i < orderedOpponents.length; i++) {
            const opp = orderedOpponents[i];
            const s = seats[i];
            if (!s) continue;
            origins[opp.id] = { x: (s.xPct / 100) * vw, y: (s.yPct / 100) * vh };
        }
        cb(origins);
    }, [seats, orderedOpponents, vw, vh]);

    // -----------------------------
    // Render
    // -----------------------------
    return (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill} className="z-[10]">
            {orderedOpponents.map((opponent, i) => {
                const seat = seats[i];
                if (!seat) return null;

                return (
                    <OpponentSeatWrapper
                        key={opponent.id}
                        opponent={opponent}
                        seat={seat}
                        depth={seatDepths[i]}
                        isActive={opponent.id === activeTurnId}
                        isNext={opponent.id === nextTurnId}
                        isMobileLandscape={isMobileLandscape}
                        fxDisabled={fxDisabled}
                        onSeatAnchor={onSeatAnchor} // ✅ pass through
                    />
                );
            })}
        </View>
    );
}