// src/components/Overlays/CardFlightOverlay.tsx

import React, { memo, useMemo } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { CardBack } from "@/components/Cards/CardBack";
import { CardFace } from "@/components/Cards/CardFace";
import { useGameSelector } from "@/state/machine/useGameSelector";
import { useGameCommands } from "@/state/machine/useGameCommands";
import { useCardSize } from "@/hooks/useCardSize";
import type { FlightRequest } from "@/state/machine/types";
import type { HandCard } from "@/types/game";
import { useGhostRibbonFlight } from "./useGhostRibbonFlight";

export type Pose3D = { rx?: number | string; ry?: number | string; rz?: number; s?: number };
export type AnchorRect = { x: number; y: number; w: number; h: number; pose?: Pose3D };

export type AnchorsRef = React.RefObject<{
    deck?: AnchorRect;
    discard?: AnchorRect;
    hand?: AnchorRect;
    stage?: AnchorRect;
    seats: Record<string, AnchorRect | undefined>;
}>;

// Match the pile's perspective so rotateX foreshortening looks identical on landing.
import { scene3d } from "@/theme/scene";
const CARD_PERSPECTIVE = scene3d.perspective; // 850

export const CardFlightOverlay = memo(function CardFlightOverlay({
    anchorsRef,
}: {
    anchorsRef: AnchorsRef;
}) {
    const flight = useGameSelector((s) => s.ui.flightQueue[0] as FlightRequest | undefined);
    const { animFlightDone } = useGameCommands();

    const { CARD_W, CARD_H } = useCardSize();
    const cardSize = useMemo(() => ({ w: CARD_W, h: CARD_H }), [CARD_W, CARD_H]);

    const faceCard =
        flight?.kind === "discard" && flight.card
            ? (flight.card as HandCard)
            : flight?.kind === "draw" && flight.from === "discard"
                ? ((flight.card as HandCard | undefined) ?? null)
                : null;

    const showFace = !!faceCard;

    // Hook must be called every render (Rules of Hooks)
    const fx = useGhostRibbonFlight({
        flight,
        anchorsRef,
        cardSize,
        onDone: (id) => animFlightDone(id),
    });

    if (!flight) return null;

    const toR = fx.toRectRef?.current;
    // Seat anchors report wrapper dimensions (not card dimensions), so use
    // full cardSize and let toPose.s handle the scale-down to mini-card size.
    const isSeatDest = typeof flight.to === "object" && !!flight.to && "seat" in flight.to;
    const W = isSeatDest ? cardSize.w : Math.round(toR?.w ?? cardSize.w);
    const H = isSeatDest ? cardSize.h : Math.round(toR?.h ?? cardSize.h);

    const halfW = W / 2;
    const halfH = H / 2;

    return (
        // Plain View — no animated perspective here (perspective on plain View doesn't animate).
        // Each Animated.View carries its own perspective as the first transform entry.
        <View className={"z-[100]"} pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Ghost ribbon — rendered behind the main card (lower z-index) */}
            {fx.ghosts.map((g, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.cardWrap,
                        {
                            width: W,
                            height: H,
                            opacity: g.op,
                            // zIndex decreases for older ghosts so they render behind newer ones
                            zIndex: fx.ghosts.length - i,
                            transform: [
                                { translateX: Animated.subtract(g.tx, halfW) },
                                { translateY: Animated.subtract(g.ty, halfH) },
                                // perspective MUST come before rotateX to take effect
                                { perspective: CARD_PERSPECTIVE },
                                {
                                    rotateX: g.rotX.interpolate({
                                        inputRange: [-90, 90],
                                        outputRange: ["-90deg", "90deg"],
                                    }) as any,
                                },
                                {
                                    rotateZ: g.rotZ.interpolate({
                                        inputRange: [-180, 180],
                                        outputRange: ["-180deg", "180deg"],
                                    }) as any,
                                },
                                { scaleX: g.scX },
                                { scaleY: g.scY },
                            ],
                        },
                    ]}
                >
                    {showFace ? <CardFace card={faceCard!} scaleMul={1} /> : <CardBack scaleMul={1} />}
                </Animated.View>
            ))}

            {/* Main flying card — always on top */}
            <Animated.View
                style={[
                    styles.cardWrap,
                    {
                        zIndex: 99999,
                        width: W,
                        height: H,
                        opacity: fx.op,
                        transform: [
                            { translateX: Animated.subtract(fx.tx, halfW) },
                            { translateY: Animated.subtract(fx.ty, halfH) },
                            // perspective MUST come before rotateX
                            { perspective: CARD_PERSPECTIVE },
                            {
                                rotateX: fx.rotX.interpolate({
                                    inputRange: [-90, 90],
                                    outputRange: ["-90deg", "90deg"],
                                }) as any,
                            },
                            {
                                rotateZ: fx.rotZ.interpolate({
                                    inputRange: [-180, 180],
                                    outputRange: ["-180deg", "180deg"],
                                }) as any,
                            },
                            { scaleX: fx.scX },
                            { scaleY: fx.scY },
                        ],
                    },
                ]}
            >
                {showFace ? <CardFace card={faceCard!} scaleMul={1} /> : <CardBack scaleMul={1} />}
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    cardWrap: { position: "absolute", left: 0, top: 0 },
});
