import React, { useRef, useState } from "react";
import { View, Button, StyleSheet, Animated } from "react-native";
import { MotiView } from "moti";

// ─────────────────────────────────────────────────────────────────
//  ✅ ONLY YOUR “TRUE” EFFECTS (others removed)
// ─────────────────────────────────────────────────────────────────

const EFFECTS = {
    motionTrail: true,   // Ghost copies trailing behind during flight
    motionBlur:  true,   // Card stretches vertically at peak
    impactFlash: false,  // White flash on landing
    screenShake: false,  // Scene shakes on landing
    sparkles:    true,   // Particles burst on landing
    cardWobble:  false,  // Bouncy spring on landing
    airSpin:     true,   // rotateY flip mid-air
    chromaticAberration: false, // lens fringe (kept false)
    landingSkid: false,  // kept false
    vignettePulse: false,// kept false
} as const;

type Phase = "hand" | "peak" | "table" | "skid";

interface Sparkle {
    id: number;
    angle: number;
    dist: number;
    size: number;
    color: string;
}

const SPARKLE_COLORS = [
    "#60a5fa",
    "#93c5fd",
    "#bfdbfe",
    "#ffffff",
    "#a5b4fc",
    "#e0f2fe",
];

const makeSparkles = (): Sparkle[] =>
    Array.from({ length: 10 }, (_, i) => ({
        id: i,
        angle: (360 / 10) * i + (Math.random() * 20 - 10),
        dist: 10 + Math.random() * 20,
        size: 7 + Math.random() * 8,
        color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    }));

function SparkleParticle({
                             sparkle,
                             active,
                         }: {
    sparkle: Sparkle;
    active: boolean;
}) {
    const rad = (sparkle.angle * Math.PI) / 180;
    const tx = Math.cos(rad) * sparkle.dist;
    const ty = Math.sin(rad) * sparkle.dist;

    return (
        <MotiView
            animate={{
                opacity: active ? ([0, 1, 1, 0] as any) : 0,
                translateX: active ? ([0, tx * 0.6, tx] as any) : 0,
                translateY: active ? ([0, ty * 0.6, ty] as any) : 0,
                scale: active ? ([0, 1.4, 0.6] as any) : 0,
            }}
            transition={{ type: "timing", duration: active ? 600 : 0 }}
            style={[
                styles.sparkle,
                {
                    width: sparkle.size,
                    height: sparkle.size,
                    borderRadius: sparkle.size / 2,
                    backgroundColor: sparkle.color,
                    // ensure visible over table/shadow on Android too
                    zIndex: 999,
                    elevation: 999,
                },
            ]}
        />
    );
}

export default function RoomPage2() {
    const [phase, setPhase] = useState<Phase>("hand");
    const [sparklesActive, setSparklesActive] = useState(false);
    const [sparkles] = useState<Sparkle[]>(makeSparkles);

    // imperative Animated values (kept because your flags include them, even if false)
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;

    const triggerImpactEffects = () => {
        if (EFFECTS.impactFlash) {
            Animated.sequence([
                Animated.timing(flashAnim, {
                    toValue: 0.55,
                    duration: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(flashAnim, {
                    toValue: 0,
                    duration: 280,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        if (EFFECTS.screenShake) {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 4, duration: 35, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -2, duration: 30, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 25, useNativeDriver: true }),
            ]).start();
        }

        if (EFFECTS.sparkles) {
            setSparklesActive(true);
            setTimeout(() => setSparklesActive(false), 700);
        }
    };

    const throwCard = () => {
        setPhase("peak");

        setTimeout(() => {
            setPhase("table");
            setTimeout(triggerImpactEffects, 180);

            if (EFFECTS.landingSkid) {
                setTimeout(() => {
                    setPhase("skid");
                    setTimeout(() => setPhase("table"), 220);
                }, 350);
            }
        }, 320);
    };

    const pickUp = () => {
        setPhase("peak");
        setTimeout(() => setPhase("hand"), 280);
    };

    const isOnTable = phase === "table" || phase === "skid";

    const cardValues: Record<
        Phase,
        {
            translateY: number;
            translateX: number;
            scale: number;
            rotateX: string;
            rotateY: string;
            rotateZ: string;
            scaleY: number;
            opacity: number;
        }
    > = {
        hand: {
            translateY: 400,
            translateX: 0,
            scale: 1.3,
            rotateX: "0deg",
            rotateY: "0deg",
            rotateZ: "0deg",
            scaleY: 1,
            opacity: 1,
        },
        peak: {
            translateY: -120,
            translateX: 50,
            scale: 1.05,
            rotateX: "20deg",
            rotateY: EFFECTS.airSpin ? "180deg" : "0deg",
            rotateZ: "-35deg",
            scaleY: EFFECTS.motionBlur ? 1.35 : 1,
            opacity: 0.6,
        },
        table: {
            translateY: 0,
            translateX: 80,
            scale: 0.7,
            rotateX: "55deg",
            rotateY: EFFECTS.airSpin ? "360deg" : "0deg",
            rotateZ: "-20deg",
            scaleY: 1,
            opacity: 0.9,
        },
        skid: {
            translateY: 18,
            translateX: 92,
            scale: 0.7,
            rotateX: "55deg",
            rotateY: EFFECTS.airSpin ? "360deg" : "0deg",
            rotateZ: "-22deg",
            scaleY: 1,
            opacity: 0.9,
        },
    };

    const shadowValues: Record<
        Phase,
        {
            translateY: number;
            translateX: number;
            scale: number;
            rotateX: string;
            rotateZ: string;
            opacity: number;
        }
    > = {
        hand: { translateY: 420, translateX: 0, scale: 1.3, rotateX: "85deg", rotateZ: "0deg", opacity: 0 },
        peak: { translateY: -60, translateX: 50, scale: 1.05, rotateX: "85deg", rotateZ: "-35deg", opacity: 0 },
        table: { translateY: 10, translateX: 80, scale: 0.7, rotateX: "55deg", rotateZ: "-20deg", opacity: 0.6 },
        skid: { translateY: 28, translateX: 92, scale: 0.7, rotateX: "55deg", rotateZ: "-22deg", opacity: 0.5 },
    };

    const card = cardValues[phase];
    const shadow = shadowValues[phase];

    const getTransition = (p: Phase) => {
        if (p === "peak")
            return { type: "spring" as const, damping: 18, stiffness: 160, mass: 0.6 };

        if (p === "table")
            return {
                type: "spring" as const,
                damping: EFFECTS.cardWobble ? 7 : 11,
                stiffness: EFFECTS.cardWobble ? 70 : 80,
                mass: EFFECTS.cardWobble ? 1.3 : 1.1,
            };

        if (p === "skid")
            return { type: "spring" as const, damping: 22, stiffness: 300, mass: 0.5 };

        return { type: "spring" as const, damping: 14, stiffness: 100, mass: 0.8 };
    };

    const cardTransition = getTransition(phase);
    const shadowTransition = getTransition(phase);

    // motion trail ghosts
    const TRAIL_COUNT = 3;
    const trailOpacity = phase === "peak" ? [0.35, 0.2, 0.1] : [0, 0, 0];
    const trailDelays = [60, 130, 200];

    return (
        <Animated.View
            style={[
                styles.mainContainer,
                { transform: [{ translateX: shakeAnim }] },
            ]}
        >
            {/* TABLE SURFACE */}
            <View style={styles.tableSurface} />

            <View style={styles.centerContainer}>
                {/* ── MOTION TRAIL ghosts ── */}
                {EFFECTS.motionTrail &&
                    Array.from({ length: TRAIL_COUNT }, (_, i) => (
                        <MotiView
                            key={`trail-${i}`}
                            animate={{
                                opacity: trailOpacity[i],
                                transform: [
                                    { perspective: 1000 },
                                    { translateY: card.translateY },
                                    { translateX: card.translateX - (i + 1) * 14 },
                                    { scale: card.scale * (1 - i * 0.04) },
                                    { rotateX: card.rotateX },
                                    { rotateZ: card.rotateZ },
                                ],
                            }}
                            transition={{ ...cardTransition, delay: trailDelays[i] }}
                            style={[styles.box, styles.trailGhost, { borderRadius: 12 }]}
                        />
                    ))}

                {/* ── SHADOW ── */}
                <MotiView
                    transition={shadowTransition}
                    animate={{
                        opacity: shadow.opacity,
                        transform: [
                            { perspective: 1000 },
                            { translateY: shadow.translateY },
                            { translateX: shadow.translateX },
                            { scale: shadow.scale },
                            { rotateX: shadow.rotateX },
                            { rotateZ: shadow.rotateZ },
                        ],
                    }}
                    style={styles.tableShadow}
                />

                {/* ── SPARKLES ── */}
                {EFFECTS.sparkles && (
                    <MotiView
                        animate={{
                            translateY: isOnTable ? card.translateY : 400,
                            translateX: isOnTable ? card.translateX : 0,
                            scale: isOnTable ? card.scale : 1.3,
                        }}
                        transition={cardTransition}
                        style={styles.sparkleContainer}
                    >
                        {sparkles.map((s) => (
                            <SparkleParticle key={s.id} sparkle={s} active={sparklesActive} />
                        ))}
                    </MotiView>
                )}

                {/* ── CARD ── */}
                <MotiView
                    style={[styles.box, { borderRadius: 12 }]}
                    animate={{
                        transform: [
                            { perspective: 1000 },
                            { translateY: card.translateY },
                            { translateX: card.translateX },
                            { scale: card.scale },
                            { scaleY: card.scaleY },
                            { rotateX: card.rotateX },
                            { rotateY: card.rotateY },
                            { rotateZ: card.rotateZ },
                        ],
                        opacity: card.opacity,
                    }}
                    transition={cardTransition}
                >
                    <View style={styles.glare} />
                    <View style={styles.cardInner}>
                        <View style={styles.cardSymbol} />
                    </View>
                </MotiView>

                {/* ── IMPACT FLASH ── */}
                {EFFECTS.impactFlash && (
                    <Animated.View
                        pointerEvents="none"
                        style={[styles.flashOverlay, { opacity: flashAnim }]}
                    />
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title={isOnTable ? "IA CARTEA ÎNAPOI" : "ARUNCĂ PE MASĂ"}
                        onPress={isOnTable ? pickUp : throwCard}
                        color={isOnTable ? "#64748b" : "#2563eb"}
                    />
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#020617",
    },
    tableSurface: {
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: 0.4,
        transform: [{ perspective: 1000 }, { rotateX: "65deg" }, { translateY: 100 }],
        backgroundColor: "#1e293b",
        borderTopWidth: 2,
        // @ts-ignore
        borderTopColor: "#334155",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    box: {
        width: 160,
        height: 230,
        backgroundColor: "#1d4ed8",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    trailGhost: {
        position: "absolute",
        backgroundColor: "#1d4ed8",
        elevation: 1,
    },
    tableShadow: {
        position: "absolute",
        width: 160,
        height: 230,
        backgroundColor: "rgba(0,0,0,0.9)",
        borderRadius: 12,
        elevation: 5,
    },
    sparkleContainer: {
        position: "absolute",
        width: 400,
        height: 400,
        marginLeft: -200,
        marginTop: -200,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
        elevation: 200,
    },
    sparkle: {
        position: "absolute",
    },
    flashOverlay: {
        position: "absolute",
        top: -200,
        left: -200,
        right: -200,
        bottom: -200,
        backgroundColor: "white",
    },
    glare: {
        position: "absolute",
        top: -50,
        left: -50,
        width: "200%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.15)",
        transform: [{ rotate: "45deg" }],
    },
    cardInner: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cardSymbol: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.4)",
    },
    buttonContainer: {
        position: "absolute",
        bottom: 40,
        zIndex: 100
    },
});
