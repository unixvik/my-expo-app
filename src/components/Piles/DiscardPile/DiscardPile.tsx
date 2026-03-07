// src/components/Piles/DiscardPile/DiscardPile.tsx

import React, { memo, useMemo, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useCardSize } from "@/hooks/useCardSize";
import { CardFace } from "@/components/Cards/CardFace/CardFace";
import { LightweightFace } from "./LightweightFace";
import { DiscardFan } from "./DiscardFan";
import { useDiscardPileState } from "./useDiscardPileState";
import { scene3d } from "@/theme/scene";
import { STACK_STEP, MAX_STACK_LAYERS, stackLayerJitter } from "./discardPileConfig";

type Props = {
    onPress?: () => void;
    scaleMul?: number;
    onAnchor?: (r: { x: number; y: number; w: number; h: number; pose?: any }) => void;
};

export const DiscardPile = memo(function DiscardPile({ onPress, scaleMul = 1, onAnchor }: Props) {
    const t = useTheme();
    const { CARD_W, CARD_H, CARD_RADIUS, SCALE } = useCardSize();

    const mul = Math.min(Math.max(scaleMul, 0.6), 1.2);
    const W = Math.round(CARD_W * mul);
    const H = Math.round(CARD_H * mul);
    const R = Math.round(CARD_RADIUS * mul);

    const {
        topCard,
        underCard,
        cardsDiscarded,
        fanCards,
        discardedBatchCount,
        hasOffset,
        animOffsetX,
        animOffsetY,
        animRot,
    } = useDiscardPileState(mul, SCALE);

    const anchorRef = useRef<View>(null);

    const report = useCallback(() => {
        const node: any = anchorRef.current;
        if (!node?.measureInWindow) return;

        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w <= 0 || h <= 0) return;
            onAnchor?.({
                x,
                y,
                w,
                h,
                pose: {
                    rx: scene3d.tableTiltX ?? -38,
                    ry: scene3d.tableYawY ?? 0,
                    rz: 0,
                    s: 1,
                },
            });
        });
    }, [onAnchor]);

    const styles = useMemo(() => {
        const border = t.components.table?.rim ?? "rgba(255,255,255,0.10)";
        const persp  = scene3d?.perspective ?? 900;
        const tiltX  = scene3d?.tableTiltX ?? -38;
        const yawY   = scene3d?.tableYawY ?? 0;

        return StyleSheet.create({
            root: { alignItems: "center", justifyContent: "center" },
            stack: {
                width: W,
                height: H,
                transform: [{ perspective: persp }],
            },
            anchor: {
                position: "absolute",
                left: 0,
                top: 0,
                width: W,
                height: H,
                borderRadius: R,
                opacity: 0.01,
            },
            slot: {
                width: W,
                height: H,
                borderRadius: R,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: "rgba(0,0,0,0.12)",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transform: [
                    { rotateX: `${tiltX}deg` as any },
                    { rotateY: `${yawY}deg` as any },
                ],
            },
            label: {
                marginTop: 6,
                fontSize: 10 * SCALE * mul,
                color: t.semantic.textMuted,
                opacity: 0.75,
                letterSpacing: 1,
            },
            cardWrap: { position: "absolute", left: 0, top: 0 },
            stubCard: {
                width: W,
                height: H,
                borderRadius: R,
                // backgroundColor: t.semantic?.surface ?? "#1e2235",
                backgroundColor: t.components.card.face,
                borderWidth: 1,
                // borderColor: "rgba(255,255,255,0.10)",
                borderColor: t.components.card.border,
            },
        });
    }, [W, H, R, SCALE, mul, t]);

    return (
        <View style={styles.root} pointerEvents="box-none">
            <Pressable onPress={onPress}>
                <View style={styles.stack} onLayout={report}>
                    {/* Untransformed anchor for flight measurements */}
                    <View ref={anchorRef} pointerEvents="none" style={styles.anchor} />

                    <View style={styles.slot}>
                        {/* Stack depth stubs: card-edge silhouettes peeking from behind the pile.
                            Count grows with cardsDiscarded, giving the look of a physical pack. */}
                        {Array.from(
                            { length: Math.min(MAX_STACK_LAYERS, Math.max(0, Math.floor((cardsDiscarded - 1) / 2))) },
                            (_, i) => {
                                const depth = i + 1;
                                const jitter = stackLayerJitter(i);
                                return (
                                    <View
                                        key={`stub-${i}`}
                                        style={[
                                            styles.cardWrap,
                                            {
                                                transform: [
                                                    { translateX: jitter.x },
                                                    { translateY: (depth * STACK_STEP) },
                                                    { rotateZ: `${jitter.rot}deg` as any },
                                                ],
                                            },
                                        ]}
                                    >
                                        <View style={styles.stubCard} />
                                    </View>
                                );
                            }
                        )}

                        {/* Under card: original drawable card, visible below the fan */}
                        {hasOffset && underCard && (
                            <View style={styles.cardWrap}>
                                <CardFace card={underCard as any} scaleMul={mul} />
                            </View>
                        )}

                        {/* Fan: intermediate batch cards.
                            Each uses Animated.multiply / animRot.interpolate so they
                            spring into position in sync with the top card (native thread). */}
                        {hasOffset && (
                            <DiscardFan
                                cards={fanCards}
                                batchCount={discardedBatchCount}
                                scaleMul={mul}
                                animOffsetX={animOffsetX}
                                animOffsetY={animOffsetY}
                                animRot={animRot}
                            />
                        )}

                        {/* Top card: animated spring to PEEK offset (or back to 0).
                            rotateZ uses a wide interpolate range to safely handle overshoot. */}
                        {topCard && (
                            <Animated.View
                                style={[
                                    styles.cardWrap,
                                    {
                                        transform: [
                                            { translateX: animOffsetX },
                                            { translateY: animOffsetY },
                                            {
                                                rotateZ: animRot.interpolate({
                                                    inputRange:  [-180, 180],
                                                    outputRange: ["-180deg", "180deg"],
                                                }) as any,
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <CardFace card={topCard as any} scaleMul={mul} />
                            </Animated.View>
                        )}

                        {/* Empty state */}
                        {!topCard && (
                            <LightweightFace w={W} h={H} r={R} rank={" "} suit={" "} />
                        )}
                    </View>
                </View>
            </Pressable>

            {cardsDiscarded > 0 && (
                <Text style={styles.label}>DISCARD</Text>
            )}
        </View>
    );
});
