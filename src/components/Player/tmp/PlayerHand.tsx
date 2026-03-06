import React, { useMemo, useCallback, memo, useEffect, useRef } from "react";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
    runOnJS,
    interpolate,
} from "react-native-reanimated";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

import { useSwipeHover } from "./useSwipeHover";
import { CardFace } from "../../Cards/CardFace/CardFace";
import DiscardButton from "../../Buttons/DiscardButton";
import { usePlayerHandLogic } from "./usePlayerHandLogic";
import type { Props } from "./types";
import { useCardSize } from "@/hooks/useCardSize";
import { useDevice } from "@/hooks/useDevice";

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

// ─── Gimmick hooks ────────────────────────────────────────────────────────────

/** Diagonal shimmer sweeps across the strip every ~5 s */
// function useShimmer(stripW: number) {
//     const x = useSharedValue(-stripW);
//     useEffect(() => {
//         x.value = withDelay(
//             800,
//             withRepeat(
//                 withSequence(
//                     withTiming(stripW, { duration: 800, easing: Easing.inOut(Easing.quad) }),
//                     withDelay(4400, withTiming(-stripW, { duration: 0 })),
//                 ),
//                 -1,
//                 false,
//             ),
//         );
//     }, [stripW]);
//     const style = useAnimatedStyle(() => ({
//         transform: [{ translateX: x.value }, { skewX: "-20deg" }],
//     }));
//     return style;
// }

/** Expanding ring that pulses outward from the avatar when it's your turn */
function usePulseRing(active: boolean) {
    const progress = useSharedValue(0);
    useEffect(() => {
        if (!active) { progress.value = withTiming(0, { duration: 300 }); return; }
        progress.value = withRepeat(
            withSequence(
                withTiming(0,   { duration: 0 }),
                withTiming(1,   { duration: 1100, easing: Easing.out(Easing.quad) }),
            ),
            -1,
            false,
        );
    }, [active]);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.7]) }],
        opacity:   interpolate(progress.value, [0, 0.3, 1], [0.8, 0.6, 0]),
    }));
    return style;
}

/** Green dot blinks when active */
function useStatusDot(active: boolean) {
    const op = useSharedValue(active ? 1 : 0.2);
    useEffect(() => {
        if (!active) { op.value = withTiming(0.2, { duration: 300 }); return; }
        op.value = withRepeat(
            withSequence(
                withTiming(1,   { duration: 550 }),
                withTiming(0.2, { duration: 550 }),
            ),
            -1,
            false,
        );
    }, [active]);
    return useAnimatedStyle(() => ({ opacity: op.value }));
}

/** Amber value block breathes softly on active turn */
function useValueBreath(active: boolean) {
    const scale = useSharedValue(1);
    useEffect(() => {
        if (!active) { scale.value = withTiming(1, { duration: 300 }); return; }
        scale.value = withRepeat(
            withSequence(
                withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }),
                withTiming(1,    { duration: 900, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
        );
    }, [active]);
    return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

// ─── HandCardItem — logic unchanged ──────────────────────────────────────────

type HandCardItemProps = {
    id: string; sv: any; isSelected: boolean; isPending: boolean;
    cardTranslateX: number; handMul: number; hoverEnabled: boolean;
    onPressCard: (id: string) => void;
    onCardHoverIn?: (id: string) => void;
    onCardHoverOut?: (id: string) => void;
    card: any; zIndex: number;
};

const HandCardItem = memo(function HandCardItem({
                                                    id, sv, isSelected, isPending, cardTranslateX,
                                                    handMul, hoverEnabled, onPressCard, onCardHoverIn, onCardHoverOut,
                                                    card, zIndex,
                                                }: HandCardItemProps) {
    const aStyle = useAnimatedStyle(() => ({
        zIndex:  isSelected ? 100 : zIndex,
        opacity: sv.opacity.value,
        transform: [
            { translateX: cardTranslateX + sv.x.value },
            { translateY: sv.yBase.value + sv.yFloat.value },
            { rotate:  `${sv.rotate.value}deg`  },
            { rotateY: `${sv.rotateY.value}deg` },
            { scale:   sv.scale.value },
        ],
    }), [isSelected, zIndex]);

    const tap = useMemo(() =>
            Gesture.Tap().enabled(!isPending).onEnd(() => { 'worklet'; runOnJS(onPressCard)(id); }),
        [id, isPending, onPressCard],
    );

    return (
        <GestureDetector gesture={tap}>
            <Animated.View
                style={[styles.cardWrapper, aStyle]}
                {...(hoverEnabled ? {
                    onPointerEnter: () => onCardHoverIn?.(id),
                    onPointerLeave: () => onCardHoverOut?.(id),
                } : {})}
            >
                <CardFace card={card} isSelected={isSelected} isPending={isPending} scaleMul={handMul} />
            </Animated.View>
        </GestureDetector>
    );
});

// ─── PlayerHand ───────────────────────────────────────────────────────────────

export const PlayerHand = memo(function PlayerHand({
                                                       name, cards, handValue, onDiscard, isMyTurn,
                                                       mandatoryDraw, drawPileRef, handleClaim,
                                                   }: Props) {
    const { CARD_W, SCALE } = useCardSize();
    const { isDesktop }     = useDevice();
    const hoverEnabled      = Platform.OS === "web";

    const ui = useMemo(() => {
        const s       = clamp(SCALE, 0.5, 1.25);
        const handMul = isDesktop ? 0.75 : 0.22;
        const handW   = Math.round(CARD_W * handMul);
        const barH    = Math.round((isDesktop ? 62 : 50) * s);
        const cardsH  = Math.round((isDesktop ? 0  : 100) * s);

        const avatarBlockW  = barH;
        const avatarSize    = Math.round(avatarBlockW * 0.72);
        const valueBlockW   = Math.round((isDesktop ? 88 : 60) * s);
        const nameFontSize  = Math.max(13, Math.round((isDesktop ? 17 : 15) * s));
        const subFontSize   = Math.max(8,  Math.round((isDesktop ? 10 : 8)  * s));
        const valueFontSize = Math.max(22, Math.round((isDesktop ? 32 : 16) * s));
        const claimW        = Math.round((isDesktop ? 96 : 80) * s);
        const claimH        = barH;
        const claimRadius   = Math.round(10 * s);
        const claimFont     = Math.max(10, Math.round((isDesktop ? 12 : 11) * s));
        const claimMargin   = Math.round(8 * s);
        const stripW        = isDesktop ? ("45%" as any) : ("50%" as any);
        // pixel width estimate for shimmer travel distance
        const stripPx       = isDesktop ? 420 : 220;

        return {
            s, handMul, handW,
            cardTranslateX: Math.round(-handW / 2),
            barH, cardsH, avatarBlockW, avatarSize, valueBlockW,
            nameFontSize, subFontSize, valueFontSize,
            claimW, claimH, claimRadius, claimFont, claimMargin,
            stripW, stripPx,
            bottomOffset: Math.round((isDesktop ? 28 : 10) * s),
        };
    }, [SCALE, isDesktop, CARD_W]);

    // ── Logic ──
    const {
        selectedIds, pendingIds, geo,
        onCardPress, onCardHoverIn, onCardHoverOut,
        handleDiscard, getAnimValues,
    } = usePlayerHandLogic(cards, onDiscard, drawPileRef, { handW: ui.handW, isDesktop });

    const { gesture, registerSlots, registerArea } = useSwipeHover(
        onCardHoverIn, onCardHoverOut, !hoverEnabled,
    );
    const cardsAreaRef = useRef<View>(null);

    useEffect(() => {
        registerSlots(cards.map((card, i) => ({
            id:      card.id,
            centerX: geo[i].x + ui.cardTranslateX + ui.handW / 2,
        })));
    }, [cards, geo, ui.cardTranslateX, ui.handW, registerSlots]);

    const onCardsAreaLayout = useCallback(() => {
        cardsAreaRef.current?.measure((_x, _y, _w, _h, pageX) => registerArea(pageX));
    }, [registerArea]);

    // ── Gimmick animated styles ──
    // const shimmerStyle  = useShimmer(ui.stripPx);
    const pulseStyle    = usePulseRing(isMyTurn);
    const dotStyle      = useStatusDot(isMyTurn);
    const valueBreath   = useValueBreath(isMyTurn);

    return (
        <View style={styles.root} pointerEvents="box-none">
            <View style={[styles.anchor, { bottom: ui.bottomOffset, width: ui.stripW }]}>
                <View style={styles.stripRow}>



                    {/* ═══ GLASS STRIP ═══════════════════════════════════════════ */}
                    <View style={[styles.strip, { height: ui.barH }]}>

                        {/* Layer 1: frosted glass base */}
                        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />

                        {/* Layer 2: very subtle glass color wash */}
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.07)",
                                "rgba(255,255,255,0.12)",
                                "rgba(0,0,0,0.15)",
                            ]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                        />

                        {/* Layer 3: top rim light — the #1 glass trick */}
                        <View style={styles.rimLight} pointerEvents="none" />

                        {/* Layer 4: bottom inner shadow */}
                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.25)"]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.innerShadow}
                            pointerEvents="none"
                        />

                        {/* Layer 5: animated shimmer sweep */}
                        {/*<Animated.View style={[styles.shimmer]} pointerEvents="none" />*/}

                        {/* ── Content ── */}

                        {/* Amber accent bar */}
                        <View style={styles.accentBar}>
                            <LinearGradient
                                colors={["#fbbf24", "#b45309"]}
                                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </View>

                        {/* Avatar block */}
                        <View style={[styles.avatarBlock, { width: ui.avatarBlockW }]}>
                            {/* Pulse ring — expands & fades on your turn */}
                            <Animated.View style={[
                                styles.pulseRing,
                                {
                                    width:        ui.avatarSize + 10,
                                    height:       ui.avatarSize + 10,
                                    borderRadius: (ui.avatarSize + 10) / 2,
                                },
                                pulseStyle,
                            ]} />

                            <View style={[styles.avatarCircle, {
                                width:        ui.avatarSize,
                                height:       ui.avatarSize,
                                borderRadius: ui.avatarSize / 2,
                            }]}>
                                <LinearGradient colors={["#7c3aed", "#db2777"]} style={StyleSheet.absoluteFill} />
                                {/* Inner rim light on avatar */}
                                <View style={styles.avatarRim} />
                                <Text style={[styles.avatarLetter, { fontSize: Math.round(ui.avatarSize * 0.42) }]}>
                                    {(name?.charAt(0) || "?").toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {/* Glass divider */}
                        <View style={styles.divider} />

                        {/* Name + status row */}
                        <View style={styles.infoBlock}>
                            <Text style={[styles.nameText, { fontSize: ui.nameFontSize }]} numberOfLines={1}>
                                {name}
                            </Text>
                            <View style={styles.statusRow}>
                                <Animated.View style={[
                                    styles.statusDot,
                                    { backgroundColor: isMyTurn ? "#22c55e" : "rgba(255,255,255,0.2)" },
                                    dotStyle,
                                ]} />
                                <Text style={[styles.subText, { fontSize: ui.subFontSize }]}>
                                    {isMyTurn ? "YOUR TURN" : "WAITING"} · {cards.length} CARDS
                                </Text>
                            </View>
                        </View>

                        {/* Glass divider */}
                        <View style={styles.divider} />

                        {/* Hand value block — breathing amber glass */}
                        <Animated.View style={[styles.valueBlock, { width: ui.valueBlockW }, valueBreath]}>
                            {/* Frosted amber glass */}
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={["rgba(217,119,6,0.45)", "rgba(120,53,15,0.55)"]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            {/* Value rim light */}
                            <View style={styles.valueRim} />
                            <Text style={[styles.valueNum, { fontSize: ui.valueFontSize }]}>
                                {handValue}
                            </Text>
                            <Text style={[styles.valueLab, { fontSize: ui.subFontSize - 1 }]}>PTS</Text>
                        </Animated.View>
                    </View>
                    {/* ═══ END GLASS STRIP ═══════════════════════════════════════ */}

                    {/* Discard */}
                    {isMyTurn && !mandatoryDraw && (
                        <DiscardButton
                            selectedCount={selectedIds.size}
                            cards={cards} handleDiscard={handleDiscard} geo={geo}
                        />
                    )}

                    {/* Claim — glass variant */}
                    {isMyTurn && !mandatoryDraw && (
                        <View style={[styles.claimAnchor, { marginLeft: ui.claimMargin }]}>
                            <GestureDetector gesture={
                                Gesture.Tap().onEnd(() => { 'worklet'; runOnJS(handleClaim)(); })
                            }>
                                <Animated.View style={[styles.claimBtn, {
                                    width: ui.claimW, height: ui.claimH, borderRadius: ui.claimRadius,
                                }]}>
                                    {/* Frosted base */}
                                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                                    {/* Amber glass tint */}
                                    <LinearGradient
                                        colors={["rgba(251,191,36,0.32)", "rgba(180,83,9,0.28)"]}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    {/* Claim rim light */}
                                z    <View style={styles.claimRim} />
                                    {/* Static diagonal shimmer on button */}
                                    <View style={styles.claimShimmer} />
                                    <Text style={[styles.claimText, { fontSize: ui.claimFont }]}>CLAIM</Text>
                                </Animated.View>
                            </GestureDetector>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
        alignItems: "center", justifyContent: "flex-end", zIndex: 10,
    },
    anchor:   { position: "absolute" },
    stripRow: { flexDirection: "row", alignItems: "flex-end", position: "relative" },
    cardsArea: {
        position: "absolute", bottom: "100%", left: 0, right: 0,
        overflow: "visible", zIndex: 10,
    },
    cardWrapper: { position: "absolute", left: "50%", bottom: 0 },

    // ── Glass strip ────────────────────────────────────────────
    strip: {
        flex: 1, flexDirection: "row", alignItems: "stretch",
        overflow: "hidden", borderRadius: 12,
        // Glass border — barely visible, just the edge catch
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.13)",
        // Deep lift shadow
        shadowColor:   "#000",
        shadowOffset:  { width: 0, height: 14 },
        shadowOpacity: 0.65,
        shadowRadius:  30,
        elevation:     22,
    },

    // Top edge — single brightest pixel of the glass
    rimLight: {
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        backgroundColor: "rgba(255,255,255,0.28)",
        zIndex: 10,
    },

    // Bottom inner shadow — glass feels thicker
    innerShadow: {
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
        zIndex: 1,
    },

    // Animated shimmer stripe
    shimmer: {
        position: "absolute", top: 0, bottom: 0, width: 50,
        backgroundColor: "rgba(255,255,255,0.07)",
        zIndex: 8,
    },

    accentBar: { width: 4, overflow: "hidden", zIndex: 2 },

    avatarBlock: {
        alignItems: "center", justifyContent: "center",
        borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.07)",
        overflow: "visible", position: "relative", zIndex: 2,
    },
    // Expanding ring
    pulseRing: {
        position: "absolute",
        borderWidth: 1.5,
        borderColor: "rgba(139,92,246,0.8)",
        backgroundColor: "transparent",
    },
    avatarCircle: {
        overflow: "hidden", alignItems: "center", justifyContent: "center",
        borderWidth: 1.5, borderColor: "rgba(255,255,255,0.28)",
        zIndex: 1,
    },
    // Bright arc at top of avatar — convex lens effect
    avatarRim: {
        position: "absolute", top: 4, left: "18%", width: "64%", height: 5,
        borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)",
    },
    avatarLetter: { color: "#fff", fontWeight: "800" },

    divider: {
        width: 1, marginVertical: 10,
        backgroundColor: "rgba(255,255,255,0.07)",
        zIndex: 2,
    },

    infoBlock: {
        flex: 1, justifyContent: "center", paddingHorizontal: 14, gap: 3, zIndex: 2,
    },
    nameText: { color: "rgba(255,245,220,0.92)", fontWeight: "800", letterSpacing: 0.3 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    subText: {
        color: "rgba(245,158,11,0.5)", fontWeight: "700", letterSpacing: 1.5,
    },

    // Amber glass value block
    valueBlock: {
        alignItems: "center", justifyContent: "center",
        overflow: "hidden", gap: 1, zIndex: 2,
    },
    // Top rim on value block
    valueRim: {
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        backgroundColor: "rgba(255,255,255,0.18)",
    },
    valueNum: { color: "#fff", fontWeight: "900" },
    valueLab: { color: "rgba(255,255,255,0.45)", fontWeight: "700", letterSpacing: 2 },

    // ── Glass claim button ─────────────────────────────────────
    claimAnchor: {},
    claimBtn: {
        overflow: "hidden",
        borderWidth: 1, borderColor: "rgba(251,191,36,0.35)",
        alignItems: "center", justifyContent: "center",
        shadowColor: "#f59e0b",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 14, elevation: 10,
    },
    // Top rim on claim button
    claimRim: {
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        backgroundColor: "rgba(255,255,255,0.30)", zIndex: 2,
    },
    // Static diagonal stripe inside claim
    claimShimmer: {
        position: "absolute", top: 0, bottom: 0,
        left: "-10%", width: "30%",
        backgroundColor: "rgba(255,255,255,0.07)",
        transform: [{ skewX: "-18deg" }],
    },
    claimText: { color: "#fff", fontWeight: "900", letterSpacing: 2, zIndex: 1 },
});