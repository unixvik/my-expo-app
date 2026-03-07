// src/components/Piles/DiscardPile/DiscardFan.tsx
//
// Renders the intermediate cards in a discard batch as an animated fan.
// Every card uses Animated.multiply / animRot.interpolate so they spring
// in sync with the top card — all on the native thread (60 FPS, no JS).

import React, { memo } from "react";
import { Animated, StyleSheet } from "react-native";
import { CardFace } from "@/components/Cards/CardFace/CardFace";
import { DISCARD_PEEK, FAN_BASE_ROT } from "./discardPileConfig";
import type { FaceCard } from "@/types/game";

type Props = {
    cards: FaceCard[];
    batchCount: number;
    scaleMul: number;
    animOffsetX: Animated.Value;
    animOffsetY: Animated.Value;
    animRot: Animated.Value;
};

export const DiscardFan = memo(function DiscardFan({
    cards,
    batchCount,
    scaleMul,
    animOffsetX,
    animOffsetY,
    animRot,
}: Props) {
    if (!cards.length) return null;

    return (
        <>
            {cards.map((card, i) => {
                // t ∈ (0, 1) — fraction of the full PEEK offset for this card.
                // i=0 (oldest) → t = 1/N  …  i=N-2 (second-newest) → t = (N-1)/N
                // The animated top card occupies t = 1 (full PEEK).
                const t = (i + 1) / batchCount;

                // Target rotation for this fan card when fully at peek.
                const fanRotTarget = FAN_BASE_ROT + (DISCARD_PEEK.rot - FAN_BASE_ROT) * t;

                return (
                    <Animated.View
                        key={card.id}
                        style={[
                            styles.cardWrap,
                            {
                                transform: [
                                    // X / Y: scale the shared animated value by t.
                                    // Animated.multiply runs on the native thread.
                                    { translateX: Animated.multiply(animOffsetX, t) },
                                    { translateY: Animated.multiply(animOffsetY, t) },
                                    // Rotation: map animRot (0 → PEEK.rot) to (0° → fanRotTarget°).
                                    // extrapolate:'extend' preserves the spring overshoot feel.
                                    {
                                        rotateZ: animRot.interpolate({
                                            inputRange:  [0, DISCARD_PEEK.rot],
                                            outputRange: ["0deg", `${fanRotTarget}deg`],
                                            extrapolate: "extend",
                                        }) as any,
                                    },
                                ],
                            },
                        ]}
                    >
                        <CardFace card={card as any} scaleMul={scaleMul} />
                    </Animated.View>
                );
            })}
        </>
    );
});

const styles = StyleSheet.create({
    cardWrap: { position: "absolute", left: 0, top: 0 },
});
