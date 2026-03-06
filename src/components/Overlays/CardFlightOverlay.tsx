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

export const CardFlightOverlay = memo(function CardFlightOverlay({
                                                                     anchorsRef,
                                                                 }: {
    anchorsRef: AnchorsRef;
}) {
    const flight = useGameSelector((s) => s.ui.flightQueue[0] as FlightRequest | undefined);
    const { animFlightDone } = useGameCommands();

    // ✅ Use actual card dimensions from the hook
    const { CARD_W, CARD_H } = useCardSize();
    const cardSize = useMemo(() => ({ w: CARD_W, h: CARD_H }), [CARD_W, CARD_H]);

    // decide face/back (same rules)
    const faceCard =
        flight?.kind === "discard" && flight.card
            ? (flight.card as HandCard)
            : flight?.kind === "draw" && flight.from === "discard"
                ? ((flight.card as HandCard | undefined) ?? null)
                : null;

    const showFace = !!faceCard;

    // ✅ hook must be called every render, even when flight is undefined
    const fx = useGhostRibbonFlight({
        flight,
        anchorsRef,
        cardSize,
        onDone: (id) => animFlightDone(id),
    });

    // ✅ early return AFTER all hooks
    if (!flight) return null;

    // ✅ NO hooks here - use the destination rect size if available, otherwise use base card size
    const toR = fx.toRectRef?.current;
    const W = Math.round(toR?.w ?? cardSize.w);
    const H = Math.round(toR?.h ?? cardSize.h);

    return (
        <View className={"z-[100]"} pointerEvents="none" style={[
            StyleSheet.absoluteFill,
             { transform: [{ perspective: fx.persp }] }
        ]}>
            {/* Ghost ribbon */}
            {fx.ghosts.map((g, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.cardWrap,
                        {
                            width: W,
                            height: H,
                            opacity: g.op,
                            transform: [
                                { translateX: Animated.subtract(g.tx, W / 2) },
                                { translateY: Animated.subtract(g.ty, H / 2) },
                                { perspective: g.persp },
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

            {/* Main flying card */}
            <Animated.View
                style={[
                    styles.cardWrap,
                    {
                        zIndex: 99999,
                        width: W,
                        height: H,
                        opacity: fx.op,
                        transform: [
                            { translateX: Animated.subtract(fx.tx, W / 2) },
                            { translateY: Animated.subtract(fx.ty, H / 2) },

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