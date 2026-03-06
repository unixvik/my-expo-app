// src/components/Piles/DrawPile/DrawPile.tsx
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Animated, Platform, useWindowDimensions } from "react-native";
import { CardBack } from "@/components/Cards/CardBack";
import { useCardSize } from "@/hooks/useCardSize";
import { useTheme } from "@/theme/ThemeProvider";
import { useDrawPileLayout } from "./useDrawPileLayout";
import { useDrawPileAnims } from "./useDrawPileAnims";
import { makeDrawPileStyles } from "./drawPileStyles";
import { poseTablePile, scene3d } from "@/theme/scene";
type Props = {
    drawCount: number;
    onDraw?: () => void
    onAnchor?: (r: AnchorRect) => void
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
type Pose3D = { rx?: string; ry?: string; rz?: number; s?: number };
type AnchorRect = { x: number; y: number; w: number; h: number; pose?: Pose3D };

/**
 * Extra “pile-only” shrink on phones.
 * You already scale cards globally via useCardSize().
 * This is the second dial to make *piles + effects* feel less huge on mobile.
 */
function usePileScaleMul() {
    const { width, height } = useWindowDimensions();
    const shortest = Math.min(width, height);

    // A small-screen bias: below ~390pt shortest-side, shrink a bit.
    // Above that, approach 1.0.
    const raw = shortest / 390;

    // Mobile gets slightly smaller; web stays neutral.
    const platformBias = Platform.OS === "web" ? 1 : 0.82;

    return clamp(raw * platformBias, 0.80, 1.0);
}

export function DrawPile({ drawCount, onDraw,onAnchor }: Props) {
    const t = useTheme();
    const { CARD_W, CARD_H, CARD_RADIUS, SCALE } = useCardSize();
    const wrapRef = React.useRef<View>(null);
    const hasCards = drawCount > 0;

    // ---- one extra dial just for pile sizing ----
    const pileMul = usePileScaleMul();

    // Important: CARD_W/H already reflect SCALE. We only apply pileMul here.
    const cardW = Math.round(CARD_W * pileMul);
    const cardH = Math.round(CARD_H * pileMul);
    const cardR = Math.round(CARD_RADIUS * pileMul);

    // Scale that drives “effects” (pads, fonts, offsets, shimmer widths)
    const fxScale = SCALE * pileMul;

    const { dims, offsets } = useDrawPileLayout({
        drawCount,
        scale: fxScale,
        cardW,
        cardH,
        cardR,
        // keep pile in the same 3D universe as the table
        perspective: scene3d.perspective,
    });

    const anim = useDrawPileAnims({
        enabled: hasCards,
        cardW,
        floatY: dims.FLOAT_Y,
        topLift: dims.TOP_LIFT,
    });

    const styles = useMemo(
        () =>
            makeDrawPileStyles({
                cardW,
                cardH,
                cardR,
                wrapPad: dims.WRAP_PAD,
                glowPad: dims.GLOW_PAD,
                innerPad: dims.INNER_PAD,
                glowColor: t.components.piles.drawGlow,
            }),
        [cardW, cardH, cardR, dims.WRAP_PAD, dims.GLOW_PAD, dims.INNER_PAD, t.components.piles.drawGlow]
    );

    const report = useCallback(() => {
        const node: any = wrapRef.current;
        if (!node?.measureInWindow || !onAnchor) return;

        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w <= 0 || h <= 0) return;

            onAnchor({
                x, y, w, h,
                pose: poseTablePile("draw"),
            });
        });
    }, [onAnchor]);


    const handlePressOut = useCallback(() => {
        if (!hasCards) return;
        anim.pressOut();
        onDraw?.();
    }, [hasCards, anim, onDraw]);

    return (
        <View
            style={styles.wrapper}
            pointerEvents="box-none"
            ref={wrapRef}
            onLayout={() => requestAnimationFrame(report)}
        >
            <Animated.View
                style={{
                    transform: [
                        { perspective: dims.PERSPECTIVE },
                        { rotateX: dims.PILE_TILT_X },
                        { rotateY: dims.PILE_TILT_Y },
                        { scale: anim.pressScale },
                        { rotateZ: dims.PILE_Z },
                    ],
                }}
                onStartShouldSetResponder={() => hasCards}
                onResponderGrant={anim.pressIn}
                onResponderRelease={handlePressOut}
            >
                <View style={styles.deck}>
                    {offsets.map((o, idx) => (
                        <Animated.View
                            key={idx}
                            style={[
                                styles.card,
                                {
                                    opacity: o.opacity,
                                    transform: [
                                        { translateX: o.translateX },
                                        { translateY: o.translateY },
                                        { rotateZ: o.rotate as any },
                                        { scale: o.scale },
                                        ...(o.isTop ? [{ translateY: anim.topCardY }] : []),
                                    ],
                                },
                            ]}
                        >
                            {/* Back scales with the pileMul dial so cards+effects shrink together */}
                            <CardBack scaleMul={pileMul} />

                            {o.isTop && hasCards && (
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        staticStyles.shimmer,
                                        {
                                            width: dims.SHIMMER_W,
                                            transform: [{ translateX: anim.shimmerX }, { skewX: "-20deg" as any }],
                                        },
                                    ]}
                                />
                            )}

                            {o.isTop && (
                                <View
                                    pointerEvents="none"
                                    style={[
                                        staticStyles.edgeHighlight,
                                        {
                                            borderTopLeftRadius: cardR,
                                            borderTopRightRadius: cardR,
                                        },
                                    ]}
                                />
                            )}
                        </Animated.View>
                    ))}
                </View>

                {hasCards && (
                    <View
                        style={[
                            staticStyles.badge,
                            {
                                top: -dims.BADGE_OFF,
                                right: -dims.BADGE_OFF,
                                width: Math.round(cardW * 0.5),
                                height: Math.round(cardH * 0.28),
                                borderRadius: Math.round(13 * fxScale),
                                backgroundColor: t.components.piles.counterBg,
                                borderColor: t.components.piles.drawGlow,
                                shadowColor: t.components.piles.drawGlow,
                            },
                        ]}
                    >
                        <Animated.Text
                            style={[
                                staticStyles.badgeText,
                                {
                                    opacity: anim.glowOpacity,
                                    fontSize: dims.BADGE_FONT,
                                    color: "rgba(255,255,255,0.92)",
                                },
                            ]}
                        >
                            {drawCount}
                        </Animated.Text>
                    </View>
                )}
            </Animated.View>

            {hasCards && (
                <Animated.Text
                    style={[
                        staticStyles.label,
                        {
                            opacity: anim.glowOpacity,
                            fontSize: dims.LABEL_FONT,
                            letterSpacing: Math.round(3 * fxScale),
                            color: t.components.piles.drawGlow,
                            transform: [{ translateY: Math.round(10 * fxScale) }],
                        },
                    ]}
                >
                    DRAW
                </Animated.Text>
            )}
        </View>
    );
}

const staticStyles = StyleSheet.create({
    shimmer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.16)",
    },
    edgeHighlight: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    badge: {
        position: "absolute",
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: Platform.OS === "ios" ? 0.45 : 0.8,
        shadowRadius: 8,
        elevation: 10,
    },
    badgeText: { fontWeight: "800", letterSpacing: 0.5 },
    label: { marginTop: 10, fontWeight: "800" },
});
