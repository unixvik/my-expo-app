// src/components/OpponentSeat/OpponentSeat.tsx

import React, {useEffect, useMemo, useRef, memo} from "react";
import {View, Text, Animated, Easing, StyleSheet, Platform} from "react-native";
import {useGameSelector} from "@/state/machine/useGameSelector";
import {LinearGradient} from "expo-linear-gradient";
import Svg, {Circle} from "react-native-svg";
import * as Haptics from "expo-haptics";
import {calculateCardFanLayout} from "@/helpers/cardFanLayout";
import {useDevice} from "@/hooks/useDevice";
import {CardBack} from "../Cards/CardBack";
import {CardFace} from "@/components/Cards/CardFace";
import type {HandCard} from "@/types/game";

// ─── Constants & Timing ──────────────────────────────────────────────────────
const RING_SPIN_MS = 3000;
const BREATHE_MS = 1600;
const TICK_PULSE_MS = 1000;
const CARD_FLOAT_MS = 2200;

const VIOLET_GLOW = "rgba(180, 140, 255, 0.9)";
const VIOLET_TRACK = "rgba(180, 160, 255, 0.12)";
const VIOLET_TICK_IDLE = "rgba(140,100,200,0.3)";

export interface OpponentSeatProps {
    id: string;
    name: string;
    cardCount: number;

    // how many to show in the fan
    showCards?: number;

    // turn indicators
    isTurnActive?: boolean;
    isTurnNext?: boolean;

    // perf/fx
    fxDisabled?: boolean;
    cardsAbove?: boolean;

    // ✅ pass revealed cards (ordered). undefined/empty => not revealed
    revealedCards?: HandCard[];
    handValue?: number;
}

type FanCardLayout = {
    id: string;
    leftPx: number;
    angle: number;
    lift: number;
};

type RingMode = "off" | "next" | "active";

const useStableLoop = () => {
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);

    const stop = () => {
        loopRef.current?.stop();
        loopRef.current = null;
    };

    const start = (anim: Animated.CompositeAnimation) => {
        stop();
        loopRef.current = anim;
        anim.start();
    };

    return {start, stop};
};

// ─── Animated SVG Ring Component ─────────────────────────────────────────────
const CelestialRing = memo(function CelestialRing({mode}: { mode: RingMode }) {
    const active = mode === "active";
    const next = mode === "next";

    const spinAnim = useRef(new Animated.Value(0)).current;
    const tickAnim = useRef(new Animated.Value(0)).current;

    const spinLoop = useStableLoop();
    const tickLoop = useStableLoop();

    const ticks = useMemo(() => {
        const r = 32;
        const cx0 = 36;
        const cy0 = 36;
        return Array.from({length: 12}, (_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return {cx: cx0 + r * Math.sin(angle), cy: cy0 - r * Math.cos(angle)};
        });
    }, []);

    useEffect(() => {
        if (!active) {
            spinLoop.stop();
            tickLoop.stop();
            spinAnim.stopAnimation(() => spinAnim.setValue(0));
            tickAnim.stopAnimation(() => tickAnim.setValue(0));
            return;
        }

        const spin = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: RING_SPIN_MS,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(tickAnim, {toValue: 1, duration: TICK_PULSE_MS / 2, useNativeDriver: true}),
                Animated.timing(tickAnim, {toValue: 0, duration: TICK_PULSE_MS / 2, useNativeDriver: true}),
            ])
        );

        spinLoop.start(spin);
        tickLoop.start(pulse);

        return () => {
            spinLoop.stop();
            tickLoop.stop();
        };
    }, [active, spinAnim, tickAnim]);

    const rotate = useMemo(
        () => spinAnim.interpolate({inputRange: [0, 1], outputRange: ["0deg", "360deg"]}),
        [spinAnim]
    );

    const ringStroke = active ? VIOLET_GLOW : next ? "rgba(180,140,255,0.55)" : VIOLET_TRACK;
    const tickFill = active ? VIOLET_GLOW : next ? "rgba(180,140,255,0.45)" : VIOLET_TICK_IDLE;

    return (
        <View style={styles.svgWrapper}>
            <Animated.View style={[StyleSheet.absoluteFill, active ? {transform: [{rotate}]} : null]}>
                <Svg width="72" height="72" viewBox="0 0 72 72">
                    <Circle cx="36" cy="36" r="32" stroke={VIOLET_TRACK} strokeWidth="2" fill="none"/>
                    {ticks.map((t, i) => (
                        <Circle key={i} cx={t.cx} cy={t.cy} r="1.5" fill={tickFill}/>
                    ))}
                    {(active || next) && (
                        <Circle
                            cx="36"
                            cy="36"
                            r="32"
                            stroke={ringStroke}
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={active ? "60, 200" : undefined}
                        />
                    )}
                </Svg>
            </Animated.View>
        </View>
    );
});

// ─── Floating Card Component ─────────────────────────────────────────────────
const FloatingCard = memo(function FloatingCard({
                                                    leftPx,
                                                    angle,
                                                    lift,
                                                    index,
                                                    active,
                                                    card, // ✅ actual card for CardFace (optional)
                                                }: FanCardLayout & {
    index: number;
    active: boolean;
    card?: HandCard
}) {
    const floatY = useRef(new Animated.Value(0)).current;
    const baseLift = useRef(new Animated.Value(0)).current;
    const mountScale = useRef(new Animated.Value(0)).current;
    const floatLoop = useStableLoop();

    // Pop-in on mount
    useEffect(() => {
        Animated.spring(mountScale, {
            toValue: 1, tension: 220, friction: 8, useNativeDriver: true,
        }).start();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        baseLift.setValue(-lift);
    }, [lift, baseLift]);

    useEffect(() => {
        if (!active) {
            floatLoop.stop();
            floatY.stopAnimation(() => floatY.setValue(0));
            return;
        }

        const period = CARD_FLOAT_MS + index * 200;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(floatY, {
                    toValue: -3,
                    duration: period / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatY, {
                    toValue: 0,
                    duration: period / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        floatLoop.start(anim);
        return () => floatLoop.stop();
    }, [active, index, floatY]);
    const isDesktop = useDevice();
    const scaleMul = isDesktop ? 0.4 : 0.8;
    return (
        <Animated.View
            style={{
                position: "absolute",
                bottom: 10,
                left: leftPx,
                zIndex: index,
                transform: [
                    { scale: mountScale },
                    { rotate: `${angle}deg` },
                    { translateY: Animated.add(baseLift, floatY) },
                ],
            }}
        >
            {card ? <CardFace card={card} scaleMul={scaleMul}/> : <CardBack isMini/>}
        </Animated.View>
    );
});

// ─── Main OpponentSeat Component ─────────────────────────────────────────────
export const OpponentSeat = memo(function OpponentSeat({
                                                           id,
                                                           name,
                                                           cardCount,
                                                           showCards = 4,
                                                           isTurnActive = false,
                                                           isTurnNext = false,
                                                           fxDisabled = false,
                                                           cardsAbove = true,
                                                           revealedCards,
                                                            handValue,
                                                       }: OpponentSeatProps) {
    const effectiveCount = cardCount;
    useDevice();

    const activeStrong = !fxDisabled && isTurnActive;
    const nextLite = !fxDisabled && !isTurnActive && isTurnNext;

    const ringMode: RingMode = activeStrong ? "active" : nextLite ? "next" : "off";

    // ✅ reveal is driven by presence of revealedCards
    const isRevealed = !!revealedCards?.length;
    const layoutCacheRef = useRef(new Map<string, ReturnType<typeof calculateCardFanLayout>>());
    const cardLayout = useMemo(() => {
        const key = `${effectiveCount}|${showCards}`;
        const cached = layoutCacheRef.current.get(key);
        if (cached) return cached;

        const computed = calculateCardFanLayout(effectiveCount, showCards);
        layoutCacheRef.current.set(key, computed);

        if (layoutCacheRef.current.size > 24) {
            const firstKey = layoutCacheRef.current.keys().next().value;
            if (firstKey) layoutCacheRef.current.delete(firstKey);
        }

        return computed;
    }, [effectiveCount, showCards]);

    const breatheAnim = useRef(new Animated.Value(1)).current;
    const breatheLoop = useStableLoop();

    useEffect(() => {
        if (!activeStrong) {
            breatheLoop.stop();
            breatheAnim.stopAnimation(() => breatheAnim.setValue(nextLite ? 1.02 : 1));
            return;
        }

        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1.05,
                    duration: BREATHE_MS / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: BREATHE_MS / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        breatheLoop.start(anim);
        return () => breatheLoop.stop();
    }, [activeStrong, nextLite, breatheAnim]);

    useEffect(() => {
        if (!activeStrong) return;

        let cancelled = false;
        let inFlight = false;
        let t: ReturnType<typeof setTimeout> | null = null;

        const tick = async () => {
            if (cancelled) return;

            if (!inFlight && Platform.OS !== "web") {
                inFlight = true;
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                } finally {
                    inFlight = false;
                }
            }

            if (!cancelled) t = setTimeout(tick, BREATHE_MS);
        };

        t = setTimeout(tick, BREATHE_MS);

        return () => {
            cancelled = true;
            if (t) clearTimeout(t);
        };
    }, [activeStrong]);

    const containerStyle = useMemo(
        () => [styles.container, {flexDirection: cardsAbove ? "column-reverse" : "column"}] as const,
        [cardsAbove]
    );

    const cardsAreaStyle = useMemo(
        () => [
            styles.cardsArea,
            {
                marginTop: cardsAbove ? 0 : 15,
                marginLeft: cardsAbove ? 30 : 0,
                marginBottom: cardsAbove ? -20 : 0,
            },
        ],
        [cardsAbove]
    );

    // ✅ choose which cards are visible in the fan (in order)
    const visibleCount = Math.min(showCards, effectiveCount);
    const visibleCards: Array<HandCard | undefined> = useMemo(() => {
        if (!isRevealed || !revealedCards) return Array.from({length: visibleCount}, () => undefined);
        return Array.from({length: visibleCount}, (_, i) => revealedCards[i]);
    }, [isRevealed, revealedCards, visibleCount]);

    return (
        <View style={styles.root}>
            <View style={containerStyle}>
                {/* 1) Identity */}
                <View style={styles.identityRow}>
                    <View style={styles.compassWrapper}>
                        {(activeStrong || nextLite) && <CelestialRing mode={ringMode}/>}

                        <Animated.View style={[styles.avatarWrap, {transform: [{scale: breatheAnim}]}]}>
                            <LinearGradient colors={["#3d1a6e", "#1a0a3a"]} style={StyleSheet.absoluteFill}/>
                            <Text style={styles.avatarLetter}>{(name?.charAt(0) ?? "?").toUpperCase()}</Text>
                        </Animated.View>
                    </View>

                    <View style={styles.textArea}>
                        <Text style={styles.nameText}>{name}</Text>
                        {isRevealed && (  <Text style={styles.avatarLetter}>{handValue} PTS</Text>) }
                        {activeStrong && <Text style={styles.turnText}>THINKING...</Text>}
                        {!activeStrong && nextLite && <Text style={styles.turnTextNext}>NEXT</Text>}
                    </View>
                </View>

                {/* 2) Cards */}
                <View style={cardsAreaStyle}>
                    <View style={styles.fanAnchor}>
                        {cardLayout.cards.map((layout: FanCardLayout, index: number) => (
                            <FloatingCard
                                key={layout.id}
                                {...layout}
                                index={index}
                                active={activeStrong}
                                card={visibleCards[index]} // ✅ face if available, else back
                            />
                        ))}

                        {effectiveCount > showCards && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>+{effectiveCount - showCards}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    root: {alignItems: "center", justifyContent: "center"},
    container: {alignItems: "center"},

    identityRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(4, 3, 14, 0.7)",
        paddingRight: 20,
        borderRadius: 40,
        borderWidth: 1,
        minWidth: "45%",
        borderColor: "rgba(180, 160, 255, 0.1)",
    },
    compassWrapper: {width: 72, height: 72, justifyContent: "center", alignItems: "center"},
    svgWrapper: {...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center"},

    avatarWrap: {
        width: 54,
        height: 54,
        borderRadius: 27,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(140, 100, 255, 0.3)",

    },
    avatarLetter: {color: "rgba(200, 180, 255, 0.95)", fontWeight: "900", fontSize: 20, fontStyle: "italic"},

    textArea: {marginLeft: 5, alignItems: "center", justifyContent: "center"},
    nameText: {color: "rgba(200, 180, 255, 0.8)", fontWeight: "600", fontSize: 20, letterSpacing: 2},
    turnText: {color: "#a855f7", fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 2},
    turnTextNext: {color: "rgba(168, 85, 247, 0.9)", fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 2},

    cardsArea: {height: 40, alignItems: "center"},
    fanAnchor: {width: 80, height: "100%", position: "relative"},

    badge: {
        position: "absolute",
        right: -10,
        bottom: 0,
        backgroundColor: "#1e1040",
        borderRadius: 8,
        paddingHorizontal: 5,
        borderWidth: 1,
        borderColor: "rgba(100,80,200,0.5)",
    },
    badgeText: {color: "rgba(200,180,255,0.9)", fontSize: 9, fontWeight: "900"},
});
