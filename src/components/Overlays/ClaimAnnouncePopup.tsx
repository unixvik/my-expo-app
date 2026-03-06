import React, {
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useState,
} from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    StyleProp,
    ViewStyle,
    Pressable,
    useWindowDimensions,
} from "react-native";
import Svg, {
    Polygon,
    Circle,
    Defs,
    RadialGradient,
    Stop,
    G,
    Rect,
} from "react-native-svg";
import * as Haptics from "expo-haptics";


// ─── Particle types ───────────────────────────────────────────────────────────
type ParticleShape = "circle" | "diamond" | "streak";

interface Particle {
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    opacity: Animated.Value;
    scale: Animated.Value;
    rotation: Animated.Value;
    color: string;
    size: number;
    targetX: number;
    targetY: number;
    shape: ParticleShape;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PARTICLE_COLORS_SUCCESS = ["#22C55E", "#4ADE80", "#10B981", "#FFFFFF", "#FACC15"];
const PARTICLE_COLORS_FAIL = ["#EF4444", "#F87171", "#DC2626", "#FFFFFF", "#FFED4A"];
const PARTICLE_COUNT = 26;
const RAY_COUNT = 20;
const SHOCKWAVE_COUNT = 3;
const SHAPES: ParticleShape[] = ["circle", "diamond", "streak"];

// ─── Particle factory ─────────────────────────────────────────────────────────
function createParticles(
    cx: number,
    cy: number,
    success: boolean,
    scaleFactor: number
): Particle[] {
    const colors = success ? PARTICLE_COLORS_SUCCESS : PARTICLE_COLORS_FAIL;
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = (60 + Math.random() * 120) * scaleFactor;
        const size = (4 + Math.random() * 6) * scaleFactor;
        return {
            id: i,
            x: new Animated.Value(cx),
            y: new Animated.Value(cy),
            opacity: new Animated.Value(1),
            scale: new Animated.Value(1),
            rotation: new Animated.Value(0),
            color: colors[Math.floor(Math.random() * colors.length)],
            size,
            targetX: cx + Math.cos(angle) * dist,
            targetY: cy + Math.sin(angle) * dist,
            shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        };
    });
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
    playerName?: string;
    subMessage?: string;
    duration?: number;
    onDismiss?: () => void;
    width?: number;
    height?: number;
    success?: boolean;
    style?: StyleProp<ViewStyle>;
    flavorText?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const ClaimShoutedOverlay: React.FC<Props> = ({
                                                         playerName = "PLAYER",
                                                         subMessage,
                                                         duration = 1400,
                                                         onDismiss,
                                                         width,
                                                         height,
                                                         success = true,
                                                         style,
                                                         flavorText
                                                     }) => {
    // ── Dimensions & scale ──────────────────────────────────────────────────────
    const { width: screenW, height: screenH } = useWindowDimensions();
    const actualWidth = width ?? screenW;
    const actualHeight = height ?? screenH;

    // Baseline optimized for mobile
    const scaleFactor = Math.min(actualWidth / 400, actualHeight / 800);

    const cx = actualWidth / 2;
    const cy = actualHeight / 2;

    // ── Flavor ──────────────────────────────────────────────────────────────────
    const points = success ? "0 POINTS!" : "+50 POINTS";
    const statusText = success ? "CLAIM SUCCESS!" : "CLAIM FAILED!";

    // ── Palette (Green for Success, Red for Fail) ───────────────────────────────
    const palette = useMemo(
        () =>
            success
                ? {
                    gradA: "#16A34A",
                    gradB: "#064E3B",
                    gradMid: "#22C55E",
                    accent: "#86EFAC",
                    btnBg: "rgba(22,163,74,0.85)",
                    btnBorder: "rgba(134,239,172,0.5)",
                    vignetteColor: "rgba(0,40,10,0.8)",
                    flashColor: "rgba(134,239,172,0.9)",
                }
                : {
                    gradA: "#DC2626",
                    gradB: "#7F1D1D",
                    gradMid: "#EF4444",
                    accent: "#FCA5A5",
                    btnBg: "rgba(220,38,38,0.85)",
                    btnBorder: "rgba(252,165,165,0.5)",
                    vignetteColor: "rgba(50,0,0,0.8)",
                    flashColor: "rgba(252,165,165,0.9)",
                },
        [success]
    );

    // ── Animated values ─────────────────────────────────────────────────────────
    const containerOpacity = useRef(new Animated.Value(0)).current;
    const topBarY = useRef(new Animated.Value(-80 * scaleFactor)).current;
    const botBarY = useRef(new Animated.Value(80 * scaleFactor)).current;
    const flashOpacity = useRef(new Animated.Value(0)).current;
    const vignetteOpacity = useRef(new Animated.Value(0)).current;

    const raysOpacity = useRef(new Animated.Value(0)).current;
    const raysScale = useRef(new Animated.Value(0.3)).current;
    const raysRotate = useRef(new Animated.Value(0)).current;

    const shockScales = useRef(Array.from({ length: SHOCKWAVE_COUNT }, () => new Animated.Value(0))).current;
    const shockOpacities = useRef(Array.from({ length: SHOCKWAVE_COUNT }, () => new Animated.Value(0))).current;

    const textOpacity = useRef(new Animated.Value(0)).current;
    const textScale = useRef(new Animated.Value(0.05)).current;
    const textRotate = useRef(new Animated.Value(-8)).current;

    const claimedOpacity = useRef(new Animated.Value(0)).current;
    const claimedTranslateY = useRef(new Animated.Value(18 * scaleFactor)).current;

    const flavorOpacity = useRef(new Animated.Value(0)).current;
    const flavorScale = useRef(new Animated.Value(0.8)).current;

    const pointsOpacity = useRef(new Animated.Value(0)).current;
    const pointsScale = useRef(new Animated.Value(1.8)).current;
    const pointsTranslateY = useRef(new Animated.Value(0)).current;

    const subOpacity = useRef(new Animated.Value(0)).current;
    const subTranslateY = useRef(new Animated.Value(20 * scaleFactor)).current;

    const btnOpacity = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(0.8)).current;

    const particlesRef = useRef<Particle[]>([]);
    const runningRef = useRef<Animated.CompositeAnimation[]>([]);

    // ── Reset ───────────────────────────────────────────────────────────────────
    const stopAll = useCallback(() => {
        runningRef.current.forEach((a) => {
            try { a.stop(); } catch {}
        });
        runningRef.current = [];
    }, []);

    const reset = useCallback(() => {
        stopAll();
        containerOpacity.setValue(0);
        topBarY.setValue(-80 * scaleFactor);
        botBarY.setValue(80 * scaleFactor);
        flashOpacity.setValue(0);
        vignetteOpacity.setValue(0);
        raysOpacity.setValue(0);
        raysScale.setValue(0.3);
        raysRotate.setValue(0);
        shockScales.forEach((s) => s.setValue(0));
        shockOpacities.forEach((s) => s.setValue(0));
        textOpacity.setValue(0);
        textScale.setValue(0.05);
        textRotate.setValue(-8);
        claimedOpacity.setValue(0);
        claimedTranslateY.setValue(18 * scaleFactor);
        flavorOpacity.setValue(0);
        flavorScale.setValue(0.8);
        pointsOpacity.setValue(0);
        pointsScale.setValue(1.8);
        pointsTranslateY.setValue(0);
        subOpacity.setValue(0);
        subTranslateY.setValue(20 * scaleFactor);
        btnOpacity.setValue(0);
        btnScale.setValue(0.8);
        particlesRef.current = [];
    }, [stopAll, scaleFactor]);

    // ── Animation ───────────────────────────────────────────────────────────────
    const runAnimation = useCallback(() => {
        reset();
        particlesRef.current = createParticles(cx, cy, success, scaleFactor);

        const T = duration;
        const IMPACT = T * 0.12;

        const aContainer = Animated.timing(containerOpacity, { toValue: 1, duration: 80, useNativeDriver: true });
        const aBars = Animated.parallel([
            Animated.spring(topBarY, { toValue: 0, friction: 8, tension: 280, useNativeDriver: true }),
            Animated.spring(botBarY, { toValue: 0, friction: 8, tension: 280, useNativeDriver: true }),
        ]);

        const aRays = Animated.parallel([
            Animated.sequence([
                Animated.timing(raysOpacity, { toValue: 1, duration: T * 0.2, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.delay(T * 0.45),
                Animated.timing(raysOpacity, { toValue: 0.18, duration: T * 0.25, useNativeDriver: true }),
            ]),
            Animated.timing(raysScale, { toValue: 1.2, duration: T, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(raysRotate, { toValue: 55, duration: T * 1.1, easing: Easing.linear, useNativeDriver: true }),
        ]);

        const aShockwaves = Animated.parallel(
            shockScales.map((s, i) =>
                Animated.sequence([
                    Animated.delay(i * 160),
                    Animated.parallel([
                        Animated.timing(s, { toValue: 2.8, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                        Animated.sequence([
                            Animated.timing(shockOpacities[i], { toValue: 0.9, duration: 80, useNativeDriver: true }),
                            Animated.timing(shockOpacities[i], { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                        ]),
                    ]),
                ])
            )
        );

        const aFlash = Animated.sequence([
            Animated.timing(flashOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(flashOpacity, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]);

        const aVignette = Animated.timing(vignetteOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true });

        const aText = Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: IMPACT, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.spring(textScale, { toValue: 1, friction: 4.5, tension: 280, useNativeDriver: true }),
            Animated.spring(textRotate, { toValue: 0, friction: 7, tension: 240, useNativeDriver: true }),
        ]);

        const aClaimed = Animated.sequence([
            Animated.delay(IMPACT * 0.8),
            Animated.parallel([
                Animated.timing(claimedOpacity, { toValue: 1, duration: IMPACT * 0.7, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.spring(claimedTranslateY, { toValue: 0, friction: 6, tension: 260, useNativeDriver: true }),
            ]),
        ]);

        const aFlavor = Animated.sequence([
            Animated.delay(IMPACT * 1.4),
            Animated.parallel([
                Animated.timing(flavorOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.spring(flavorScale, { toValue: 1, friction: 7, tension: 200, useNativeDriver: true }),
            ]),
        ]);

        const aPoints = Animated.sequence([
            Animated.delay(IMPACT * 2.2),
            Animated.parallel([
                Animated.timing(pointsOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
                Animated.spring(pointsScale, { toValue: 1, friction: 4, tension: 300, useNativeDriver: true }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pointsTranslateY, { toValue: -5 * scaleFactor, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                        Animated.timing(pointsTranslateY, { toValue: 5 * scaleFactor, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    ])
                ),
            ]),
        ]);

        const aSub = Animated.sequence([
            Animated.delay(T * 0.28),
            Animated.parallel([
                Animated.timing(subOpacity, { toValue: 1, duration: T * 0.18, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(subTranslateY, { toValue: 0, duration: T * 0.18, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
            ]),
        ]);

        const aBtn = Animated.sequence([
            Animated.delay(T * 0.55),
            Animated.parallel([
                Animated.timing(btnOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.spring(btnScale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
            ]),
        ]);

        const aParticles = Animated.parallel(
            particlesRef.current.map((p) => {
                const delay = 20 + Math.random() * 120;
                const dur = 380 + Math.random() * 260;
                const rotTarget = (Math.random() - 0.5) * 720;
                return Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(p.x, { toValue: p.targetX, duration: dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                        Animated.timing(p.y, { toValue: p.targetY, duration: dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                        Animated.timing(p.opacity, { toValue: 0, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                        Animated.timing(p.scale, { toValue: 0, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                        Animated.timing(p.rotation, { toValue: rotTarget, duration: dur, useNativeDriver: true }),
                    ]),
                ]);
            })
        );

        runningRef.current = [aContainer, aBars, aRays, aShockwaves, aFlash, aVignette, aText, aClaimed, aFlavor, aPoints, aSub, aBtn, aParticles];
        runningRef.current.forEach((anim) => anim.start());

        setTimeout(() => {
            Haptics.impactAsync(success ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }, IMPACT * 0.5);
    }, [
        reset, cx, cy, success, duration, scaleFactor,
        containerOpacity, topBarY, botBarY, flashOpacity, vignetteOpacity, raysOpacity, raysScale, raysRotate,
        shockScales, shockOpacities, textOpacity, textScale, textRotate,
        claimedOpacity, claimedTranslateY, flavorOpacity, flavorScale,
        pointsOpacity, pointsScale, pointsTranslateY, subOpacity, subTranslateY, btnOpacity, btnScale,
    ]);

    useEffect(() => {
        runAnimation();
        return () => reset();
    }, [runAnimation, reset]);

    const raysRotateDeg = useMemo(() => raysRotate.interpolate({ inputRange: [0, 55], outputRange: ["0deg", "55deg"] }), [raysRotate]);
    const textRotateDeg = useMemo(() => textRotate.interpolate({ inputRange: [-8, 0], outputRange: ["-8deg", "0deg"] }), [textRotate]);

    const raysPoints = useMemo(() => {
        const step = 360 / RAY_COUNT;
        const r = Math.min(cx, cy) * 1.05;
        const halfW = 10 * scaleFactor;
        const PI_180 = Math.PI / 180;
        return Array.from({ length: RAY_COUNT }, (_, i) => {
            const angle = i * step;
            const tipX = cx + Math.cos(angle * PI_180) * r;
            const tipY = cy + Math.sin(angle * PI_180) * r;
            const baseR = r * 0.32;
            const perpA = angle + 90;
            const b1x = cx + Math.cos(angle * PI_180) * baseR + Math.cos(perpA * PI_180) * halfW;
            const b1y = cy + Math.sin(angle * PI_180) * baseR + Math.sin(perpA * PI_180) * halfW;
            const b2x = cx + Math.cos(angle * PI_180) * baseR - Math.cos(perpA * PI_180) * halfW;
            const b2y = cy + Math.sin(angle * PI_180) * baseR - Math.sin(perpA * PI_180) * halfW;
            return `${tipX},${tipY} ${b1x},${b1y} ${cx},${cy} ${b2x},${b2y}`;
        });
    }, [cx, cy, scaleFactor]);

    const shockR = Math.min(cx, cy) * 0.45;

    // Mobile optimized font sizes
    const fs = {
        player: 34 * scaleFactor,
        claimed: 44 * scaleFactor,
        flavor: 15 * scaleFactor,
        points: 26 * scaleFactor,
        btn: 16 * scaleFactor,
    };

    return (
        <Animated.View style={[styles.fullscreen, { opacity: containerOpacity }, style]}>
            <View style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.92)" }]} />

            <Animated.View style={[styles.fullscreen, { opacity: vignetteOpacity, backgroundColor: "transparent" }]} pointerEvents="none">
                <Svg width={actualWidth} height={actualHeight}>
                    <Defs>
                        <RadialGradient id="vignette" cx="50%" cy="50%" r="70%">
                            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="100%" stopColor={palette.vignetteColor} stopOpacity="1" />
                        </RadialGradient>
                    </Defs>
                    <Rect width={actualWidth} height={actualHeight} fill="url(#vignette)" />
                </Svg>
            </Animated.View>

            <Animated.View style={[styles.raysWrapper, { opacity: raysOpacity, transform: [{ scale: raysScale }, { rotate: raysRotateDeg }] }]} pointerEvents="none">
                <Svg width={actualWidth} height={actualHeight}>
                    <Defs>
                        <RadialGradient id="rayGrad" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={palette.gradA} stopOpacity="0.9" />
                            <Stop offset="60%" stopColor={palette.gradMid} stopOpacity="0.5" />
                            <Stop offset="100%" stopColor={palette.gradB} stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    {raysPoints.map((pts, i) => <Polygon key={i} points={pts} fill="url(#rayGrad)" />)}
                </Svg>
            </Animated.View>

            {shockScales.map((sScale, i) => (
                <Animated.View key={i} pointerEvents="none" style={[styles.shockwaveContainer, { width: shockR * 2, height: shockR * 2, left: cx - shockR, top: cy - shockR, opacity: shockOpacities[i], transform: [{ scale: sScale }] }]}>
                    <Svg width={shockR * 2} height={shockR * 2}>
                        <Circle cx={shockR} cy={shockR} r={shockR - 2} fill="none" stroke={i === 0 ? palette.gradA : i === 1 ? palette.accent : palette.gradB} strokeWidth={3 * scaleFactor} strokeOpacity={0.9} />
                    </Svg>
                </Animated.View>
            ))}

            {particlesRef.current.map((p) => {
                const tx = Animated.add(p.x, new Animated.Value(-p.size / 2));
                const ty = Animated.add(p.y, new Animated.Value(-p.size / 2));
                const rotDeg = p.rotation.interpolate({ inputRange: [-720, 720], outputRange: ["-720deg", "720deg"] });

                return <Animated.View key={p.id} style={{ position: "absolute", width: p.shape === "streak" ? p.size * 3 : p.size, height: p.size, borderRadius: p.shape === "circle" ? p.size : p.shape === "diamond" ? 1 : 0, backgroundColor: p.color, transform: [{ translateX: tx }, { translateY: ty }, { scale: p.scale }, { rotate: rotDeg }], opacity: p.opacity, shadowColor: p.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4 }} pointerEvents="none" />;
            })}

            <Animated.View pointerEvents="none" style={[styles.fullscreen, { backgroundColor: palette.flashColor, opacity: flashOpacity }]} />

            {/* ── Text block dragged up for mobile ────────────────────────────── */}
            <Animated.View style={[styles.textBlock, { top: cy - 220 * scaleFactor, transform: [{ scale: textScale }, { rotate: textRotateDeg }] }]} pointerEvents="none">
                <Animated.Text style={[styles.mainText, { fontSize: fs.player, color: "#FFFFFF", opacity: textOpacity }]}>
                    {playerName.toUpperCase()}
                </Animated.Text>

                {/* Clear Success/Fail messaging */}
                <Animated.Text style={[styles.shoutedText, { fontSize: fs.claimed, color: palette.accent, opacity: claimedOpacity, transform: [{ translateY: claimedTranslateY }], textShadowColor: palette.gradA }]}>
                    {statusText}
                </Animated.Text>

                <Animated.Text style={[styles.flavorText, { fontSize: fs.flavor, opacity: flavorOpacity, transform: [{ scale: flavorScale }], color: "rgba(255,255,255,0.85)", marginTop: 8 * scaleFactor }]}>
                    {flavorText}
                </Animated.Text>
            </Animated.View>

            {/* ── Points block dragged up ─────────────────────────────────────── */}
            <Animated.View style={[styles.pointsBadge, { top: cy - 80 * scaleFactor, opacity: pointsOpacity, transform: [{ scale: pointsScale }, { translateY: pointsTranslateY }], backgroundColor: success ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", borderColor: palette.accent, paddingHorizontal: 24 * scaleFactor, paddingVertical: 10 * scaleFactor, borderRadius: 40 * scaleFactor, borderWidth: 1.5 * scaleFactor }]} pointerEvents="none">
                <Text style={[styles.pointsText, { fontSize: fs.points, color: palette.accent, textShadowColor: palette.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
                    {points}
                </Text>
            </Animated.View>

            {/*{subMessage && (*/}
            {/*    <Animated.View style={[styles.subBlock, { top: cy + 90 * scaleFactor, opacity: subOpacity, transform: [{ translateY: subTranslateY }] }]} pointerEvents="none">*/}
            {/*        <Text style={[styles.subText, { fontSize: fs.flavor * 0.9, color: "rgba(255,255,255,0.65)" }]}>*/}
            {/*            {subMessage}*/}
            {/*        </Text>*/}
            {/*    </Animated.View>*/}
            {/*)}*/}

            <Animated.View style={[styles.letterboxBar, { height: 60 * scaleFactor, top: 0, transform: [{ translateY: topBarY }] }]} pointerEvents="none" />
            <Animated.View style={[styles.letterboxBar, { height: 60 * scaleFactor, bottom: 0, transform: [{ translateY: botBarY }] }]} pointerEvents="none" />

            <Animated.View style={{ position: "absolute", bottom: 340 * scaleFactor, opacity: btnOpacity, transform: [{ scale: btnScale }], zIndex: 15 }}>
                <Pressable onPress={() => { Haptics.selectionAsync(); onDismiss?.(); }} style={[styles.continueBtn, { backgroundColor: palette.btnBg, borderColor: palette.btnBorder, paddingHorizontal: 36 * scaleFactor, paddingVertical: 16 * scaleFactor, borderRadius: 40 * scaleFactor, borderWidth: 1.5, shadowColor: palette.gradA, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 16 }]}>
                    <Text style={[styles.continueText, { fontSize: fs.btn, letterSpacing: 3 * scaleFactor }]}>
                        CONTINUE
                    </Text>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    fullscreen: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    raysWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    shockwaveContainer: {
        position: "absolute",
        zIndex: 4,
    },
    textBlock: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    mainText: {
        letterSpacing: 4,
        textAlign: "center",
        fontWeight: "900",
        textShadowColor: "rgba(0,0,0,0.9)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    shoutedText: {
        letterSpacing: 3,
        textAlign: "center",
        fontWeight: "900",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2,
    },
    flavorText: {
        textAlign: "center",
        fontWeight: "700",
        letterSpacing: 1,
        fontStyle: "italic",
    },
    pointsBadge: {
        position: "absolute",
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 11,
    },
    pointsText: {
        fontWeight: "900",
        letterSpacing: 2,
        textAlign: "center",
    },
    subBlock: {
        position: "absolute",
        alignSelf: "center",
        zIndex: 11,
        paddingHorizontal: 24,
    },
    subText: {
        textAlign: "center",
        fontWeight: "600",
        letterSpacing: 1,
    },
    letterboxBar: {
        position: "absolute",
        left: 0,
        right: 0,
        backgroundColor: "#000000",
        zIndex: 20,
    },
    continueBtn: {
        alignItems: "center",
        justifyContent: "center",
    },
    continueText: {
        color: "rgba(255,255,255,0.95)",
        fontWeight: "900",
    },
});

export default ClaimShoutedOverlay;