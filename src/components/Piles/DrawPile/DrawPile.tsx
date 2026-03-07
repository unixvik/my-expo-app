// src/components/Piles/DrawPile/DrawPile.tsx

import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
    interpolate,
    Easing,
    SharedValue,
    runOnJS
} from "react-native-reanimated";

import { CardBack } from "@/components/Cards/CardBack";
import { useCardSize } from "@/hooks/useCardSize";
import { useTheme } from "@/theme/ThemeProvider";
import { useDrawPileLayout } from "./useDrawPileLayout";
import { useDrawPileAnims } from "./useDrawPileAnims";
import { makeDrawPileStyles } from "./drawPileStyles";
import { poseTablePile, scene3d } from "@/theme/scene";
import { useGameSelector } from "@/state/machine/useGameSelector";

import { ATUDraw } from "@/components/Cards/ATUDraw";

// ─── Constants & Physics ──────────────────────────────────────────────────────
const CASCADE_N = 5;

// Adjusted for Reanimated's physics engine
const SPRING_CONFIG = { damping: 30, stiffness: 180 };
const THUD_CONFIG = { mass: 1, stiffness: 200, damping: 15 };

function cascadeJitter(i: number) {
    return {
        swingX: ((i * 123) % 40) +100,
        initRz: ((i * 41 + 13) % 60) - 130,
        finalRz: (((i * 37 + 7) % 11) - 5) * 0.5,
    };
}

type Props = {
    drawCount: number;
    onDraw?: () => void;
    onAnchor?: (r: any) => void;
};

// ─── Scaling Logic ──────────────────────────────────────────────────────────
function usePileScaleMul() {
    const { width, height } = useWindowDimensions();
    const shortest = Math.min(width, height);
    const raw = shortest / 414;
    const platformBias = Platform.OS === "web" ? 1 : 0.85;
    return Math.min(1.0, Math.max(0.75, raw * platformBias));
}

// ─── Sub-Components for Reanimated Hook Safety ──────────────────────────────

// 1. DeckCard: Handles the static/bottom layers of the deck
const DeckCard = ({ offset, anim, isTop, pileMul, styles, dims, deckImpactTilt }: any) => {
    const cardStyle = useAnimatedStyle(() => ({
        opacity: offset.opacity,
        transform: [
            { translateX: offset.translateX },
            { translateY: isTop ? offset.translateY + (anim.topCardY?.value ?? 0) : offset.translateY },
            { rotateZ: offset.rotate },
            { scale: offset.scale },
        ],
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        width: dims.SHIMMER_W,
        opacity: interpolate(deckImpactTilt.value, [0, 1], [0.3, 0.8]),
        transform: [
            { translateX: anim.shimmerX?.value ?? 0 },
            { skewX: "-20deg" }
        ],
    }));

    return (
        <Animated.View style={[styles.card, cardStyle]}>
            <CardBack scaleMul={pileMul} />
            {isTop && (
                <Animated.View pointerEvents="none" style={[staticStyles.shimmer, shimmerStyle]} />
            )}
        </Animated.View>
    );
};

// 2. CascadeCard: Handles its own stagger animation autonomously
const CascadeCard = ({ index, cardH, pileMul, styles, onFinished }: any) => {
    const physics = useMemo(() => cascadeJitter(index), [index]);

    const y = useSharedValue(-cardH * 4.2);
    const x = useSharedValue(physics.swingX);
    const op = useSharedValue(0);
    const rz = useSharedValue(physics.initRz);
    const sc = useSharedValue(1);

    useEffect(() => {
        const delay = index * 60;

        y.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
        x.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
        sc.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
        op.value = withDelay(delay, withTiming(1, { duration: 150 }));

        // Trigger completion callback on the very last item
        if (index === CASCADE_N - 1) {
            rz.value = withDelay(delay, withSpring(physics.finalRz, SPRING_CONFIG, (finished) => {
                if (finished && onFinished) runOnJS(onFinished)();
            }));
        } else {
            rz.value = withDelay(delay, withSpring(physics.finalRz, SPRING_CONFIG));
        }
    }, [index, cardH]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: op.value,
        transform: [
            { translateX: x.value },
            { translateY: y.value },
            { rotateZ: `${rz.value}deg` },
            { scale: sc.value },
        ],
    }));

    return (
        <Animated.View style={[styles.card, animatedStyle]}>
            <CardBack scaleMul={pileMul} />
        </Animated.View>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function DrawPile({ drawCount, onDraw, onAnchor }: Props) {
    const t = useTheme();
    const { CARD_W, CARD_H, CARD_RADIUS, SCALE } = useCardSize();
    const wrapRef = useRef<View>(null);
    const hasCards = drawCount > 0;
    const pileMul = usePileScaleMul();

    const cardW = Math.round(CARD_W * pileMul);
    const cardH = Math.round(CARD_H * pileMul);
    const cardR = Math.round(CARD_RADIUS * pileMul);
    const fxScale = SCALE * pileMul;

    // NOTE: Ensure `useDrawPileLayout` and `useDrawPileAnims` are returning SharedValues instead of Animated.Values
    const { dims, offsets } = useDrawPileLayout({
        drawCount, scale: fxScale, cardW, cardH, cardR, perspective: scene3d.perspective,
    });

    const anim = useDrawPileAnims({
        enabled: hasCards, cardW, floatY: dims.FLOAT_Y, topLift: dims.TOP_LIFT,
    });

    // ── Physical Shared Values ──────────────────────────────────────────────
    const deckPunch = useSharedValue(1);
    const deckImpactTilt = useSharedValue(0);
    const [cascadeActive, setCascadeActive] = useState(false);

    // Selectors
    const gameStatus = useGameSelector(s => s.game.gameStatus);
    // ── Trigger Cascade & Settlement ────────────────────────────────────────
    useEffect(() => {
        if (gameStatus === "starting") {
            console.log(`[DrawPile Effect] 🟢 TRIGGERING CASCADE! Setting cascadeActive to true.`);
            setCascadeActive(true);
            deckImpactTilt.value = 0;
            deckPunch.value = 1;
        }
    }, [gameStatus]);

    const handleCascadeComplete = useCallback(() => {
        console.log(`[DrawPile] 🏁 Cascade animation finished visually.`);

        // 1. Trigger the physical deck thud
        deckPunch.value = withSequence(
            withTiming(1.05, { duration: 80 }),
            withSpring(1, { damping: 10, stiffness: 120 })
        );
        deckImpactTilt.value = withSequence(
            withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) }),
            withSpring(0, { damping: 8, stiffness: 100 })
        );

        // 2. Safely unmount the cascade overlay after the thud settles
        setTimeout(() => {
            console.log(`[DrawPile] 🔴 Unmounting cascade overlay locally.`);
            setCascadeActive(false);
        }, 150);
    }, [deckPunch, deckImpactTilt]);


    const styles = useMemo(() => makeDrawPileStyles({
        cardW, cardH, cardR,
        wrapPad: dims.WRAP_PAD,
        glowPad: dims.GLOW_PAD,
        innerPad: dims.INNER_PAD,
        glowColor: t.components.piles.drawGlow,
    }), [cardW, cardH, cardR, dims, t]);

    // ── Main Wrapper Styles ─────────────────────────────────────────────────
    const wrapperAnimatedStyle = useAnimatedStyle(() => {
        const tiltBase = parseFloat(dims.PILE_TILT_X);
        const tiltX = interpolate(deckImpactTilt.value, [0, 1], [tiltBase, tiltBase + 10]);

        return {
            transform: [
                { perspective: dims.PERSPECTIVE },
                { rotateX: `${tiltX}deg` },
                { rotateY: dims.PILE_TILT_Y },
                { rotateZ: dims.PILE_Z },
                { scale: (anim.pressScale?.value ?? 1) * deckPunch.value },
            ],
        };
    });

    const badgeAnimatedStyle = useAnimatedStyle(() => ({
        opacity: anim.glowOpacity?.value ?? 1,
        transform: [{ scale: deckPunch.value }]
    }));

    const labelAnimatedStyle = useAnimatedStyle(() => ({
        opacity: anim.glowOpacity?.value ?? 1,
        transform: [{ translateY: 10 * fxScale }],
    }));

    return (
        <View style={styles.wrapper} pointerEvents="box-none" ref={wrapRef}>
            <Animated.View
                style={wrapperAnimatedStyle}
                onStartShouldSetResponder={() => hasCards}
                onResponderGrant={anim.pressIn}
                onResponderRelease={useCallback(() => {
                    if (!hasCards) return;
                    anim.pressOut();
                    onDraw?.();
                }, [hasCards, anim, onDraw])}
            >
                <View style={styles.deck}>
                    {/* 1. DECK OFFSETS (Rendered bottom layer) */}
                    {offsets.map((o: any, idx: number) => (
                        <DeckCard
                            key={`deck-${idx}`}
                            offset={o}
                            anim={anim}
                            isTop={o.isTop && hasCards}
                            pileMul={pileMul}
                            styles={styles}
                            dims={dims}
                            deckImpactTilt={deckImpactTilt}
                        />
                    ))}

                    {/* 2. ATU CARD (Rendered above the deck, before flip) */}
                    <ATUDraw
                        cardW={cardW}
                        cardH={cardH}
                        cardR={cardR}
                        scaleMul={pileMul}
                        delayReveal={cascadeActive}
                    />

                    {/* 3. SPECTACULAR CASCADE OVERLAY (Rendered absolute top) */}
                    {cascadeActive && Array.from({ length: CASCADE_N }).map((_, i) => (
                        <CascadeCard
                            key={`cascade-${i}`}
                            index={i}
                            cardH={cardH}
                            pileMul={pileMul}
                            styles={styles}
                            onFinished={handleCascadeComplete}
                        />
                    ))}
                </View>

                {/* Draw Counter Badge */}
                {hasCards && (
                    <Animated.View style={[staticStyles.badge, {
                        top: -dims.BADGE_OFF,
                        right: -dims.BADGE_OFF,
                        width: Math.round(cardW * 0.5),
                        height: Math.round(cardH * 0.28),
                        borderRadius: Math.round(13 * fxScale),
                        backgroundColor: t.components.piles.counterBg,
                        borderColor: t.components.piles.drawGlow,
                    }, badgeAnimatedStyle]}>
                        <Animated.Text style={[staticStyles.badgeText, { fontSize: dims.BADGE_FONT }]}>
                            {drawCount}
                        </Animated.Text>
                    </Animated.View>
                )}
            </Animated.View>

            {hasCards && (
                <Animated.Text style={[staticStyles.label, {
                    fontSize: dims.LABEL_FONT,
                    color: t.components.piles.drawGlow,
                }, labelAnimatedStyle]}>
                    DRAW
                </Animated.Text>
            )}
        </View>
    );
}

const staticStyles = StyleSheet.create({
    shimmer: { position: "absolute", top: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.2)" },
    badge: { position: "absolute", borderWidth: 1.5, alignItems: "center", justifyContent: "center", elevation: 10, shadowRadius: 8, shadowOpacity: 0.45 },
    badgeText: { fontWeight: "900", color: "#FFF" },
    label: { marginTop: 10, fontWeight: "800", textAlign: "center", letterSpacing: 2 },
});