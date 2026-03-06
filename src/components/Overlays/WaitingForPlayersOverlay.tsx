// src/components/overlays/WaitingForPlayersOverlay.tsx
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    StyleProp,
    ViewStyle,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    RadialGradient,
    LinearGradient,
    Stop,
    Rect,
    Line,
} from "react-native-svg";
import * as Haptics from "expo-haptics";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerReadyState {
    id: string;
    name: string;
    ready: boolean;
    avatarColor?: string; // hex, falls back to palette
}

interface Props {
    players: PlayerReadyState[];
    localPlayerId: string;
    roundNumber: number;
    onReady: () => void;
    isLocalReady?: boolean;
    width?: number;
    height?: number;
    style?: StyleProp<ViewStyle>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#FF6B35",
    "#00D4FF",
    "#FFD700",
    "#FF3366",
    "#39FF14",
    "#FF99CC",
    "#A855F7",
];

// Tactical/military grid aesthetic — dark, tense, focused
const PALETTE = {
    bg: "#090C0F",
    gridLine: "rgba(0,212,255,0.06)",
    gridLineAccent: "rgba(0,212,255,0.14)",
    primary: "#00D4FF",
    primaryDim: "rgba(0,212,255,0.18)",
    primaryGlow: "rgba(0,212,255,0.45)",
    ready: "#39FF14",
    readyDim: "rgba(57,255,20,0.15)",
    readyGlow: "rgba(57,255,20,0.5)",
    waiting: "rgba(255,255,255,0.22)",
    waitingBg: "rgba(255,255,255,0.04)",
    warning: "#FFD700",
    warningGlow: "rgba(255,215,0,0.45)",
    text: "#FFFFFF",
    textDim: "rgba(255,255,255,0.45)",
    scanline: "rgba(0,212,255,0.025)",
    btnBg: "rgba(0,212,255,0.12)",
    btnBorder: "rgba(0,212,255,0.55)",
    btnReady: "rgba(57,255,20,0.15)",
    btnReadyBorder: "rgba(57,255,20,0.65)",
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

// Animated blinking cursor — pure atmosphere
function BlinkCursor({ size, color }: { size: number; color: string }) {
    const opacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);
    return (
        <Animated.View
            style={{ width: size * 0.5, height: size, backgroundColor: color, opacity, marginLeft: 3 }}
        />
    );
}

// Single player slot
function PlayerSlot({
                        player,
                        isLocal,
                        size,
                        scaleFactor,
                        index,
                        entranceDelay,
                    }: {
    player: PlayerReadyState;
    isLocal: boolean;
    size: number;
    scaleFactor: number;
    index: number;
    entranceDelay: number;
}) {
    const avatarColor = player.avatarColor ?? AVATAR_COLORS[index % AVATAR_COLORS.length];
    const slideX = useRef(new Animated.Value(index % 2 === 0 ? -60 : 60)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const readyScale = useRef(new Animated.Value(1)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const prevReady = useRef(player.ready);

    // Entrance animation
    useEffect(() => {
        const delay = Animated.delay(entranceDelay);
        const anim = Animated.parallel([
            Animated.spring(slideX, { toValue: 0, friction: 7, tension: 220, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]);
        const seq = Animated.sequence([delay, anim]);
        seq.start();
    }, []);

    // Ready state change — punch + glow
    useEffect(() => {
        if (player.ready && !prevReady.current) {
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(readyScale, { toValue: 1.18, friction: 4, tension: 300, useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.spring(readyScale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
                ]),
            ]).start();
        } else if (!player.ready && prevReady.current) {
            glowOpacity.setValue(0);
            readyScale.setValue(1);
        }
        prevReady.current = player.ready;
    }, [player.ready]);

    const avatarR = size * 0.38;
    const borderColor = player.ready ? PALETTE.ready : PALETTE.waiting;
    const statusColor = player.ready ? PALETTE.ready : PALETTE.waiting;

    return (
        <Animated.View
            style={[
                styles.playerSlot,
                {
                    opacity,
                    transform: [{ translateX: slideX }, { scale: readyScale }],
                    borderColor,
                    borderWidth: 1,
                    borderRadius: 12 * scaleFactor,
                    backgroundColor: player.ready ? PALETTE.readyDim : PALETTE.waitingBg,
                    paddingHorizontal: 16 * scaleFactor,
                    paddingVertical: 12 * scaleFactor,
                    marginVertical: 5 * scaleFactor,
                },
            ]}
        >
            {/* Glow layer */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        borderRadius: 12 * scaleFactor,
                        backgroundColor: player.ready ? PALETTE.readyDim : "transparent",
                        opacity: glowOpacity,
                    },
                ]}
            />

            {/* Avatar circle */}
            <View
                style={{
                    width: avatarR * 2,
                    height: avatarR * 2,
                    borderRadius: avatarR,
                    backgroundColor: avatarColor + "28",
                    borderWidth: 2,
                    borderColor: avatarColor,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14 * scaleFactor,
                }}
            >
                <Text
                    style={{
                        color: avatarColor,
                        fontWeight: "900",
                        fontSize: avatarR * 0.9,
                        letterSpacing: 0,
                    }}
                >
                    {player.name.slice(0, 1).toUpperCase()}
                </Text>
            </View>

            {/* Name + local tag */}
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                        style={[
                            styles.playerName,
                            {
                                fontSize: 15 * scaleFactor,
                                color: isLocal ? PALETTE.primary : PALETTE.text,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {player.name.toUpperCase()}
                    </Text>
                    {isLocal && (
                        <View
                            style={[
                                styles.youBadge,
                                {
                                    backgroundColor: PALETTE.primaryDim,
                                    borderColor: PALETTE.primary,
                                    borderRadius: 4 * scaleFactor,
                                    marginLeft: 8 * scaleFactor,
                                    paddingHorizontal: 6 * scaleFactor,
                                    paddingVertical: 1 * scaleFactor,
                                },
                            ]}
                        >
                            <Text style={{ color: PALETTE.primary, fontSize: 9 * scaleFactor, fontWeight: "900", letterSpacing: 1 }}>
                                YOU
                            </Text>
                        </View>
                    )}
                </View>

                {/* Status row */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 * scaleFactor }}>
                    <View
                        style={{
                            width: 6 * scaleFactor,
                            height: 6 * scaleFactor,
                            borderRadius: 3 * scaleFactor,
                            backgroundColor: statusColor,
                            marginRight: 6 * scaleFactor,
                        }}
                    />
                    <Text
                        style={{
                            color: statusColor,
                            fontSize: 11 * scaleFactor,
                            fontWeight: "700",
                            letterSpacing: 2,
                        }}
                    >
                        {player.ready ? "READY" : "WAITING"}
                    </Text>
                    {!player.ready && <BlinkCursor size={10 * scaleFactor} color={PALETTE.textDim} />}
                </View>
            </View>

            {/* Ready checkmark */}
            {player.ready && (
                <Text
                    style={{
                        fontSize: 20 * scaleFactor,
                        marginLeft: 8 * scaleFactor,
                    }}
                >
                    ✓
                </Text>
            )}
        </Animated.View>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const WaitingForPlayersOverlay: React.FC<Props> = ({
                                                              players,
                                                              localPlayerId,
                                                              roundNumber,
                                                              onReady,
                                                              isLocalReady = false,
                                                              width,
                                                              height,
                                                              style,
                                                          }) => {
    const { width: screenW, height: screenH } = useWindowDimensions();
    const actualWidth = width ?? screenW;
    const actualHeight = height ?? screenH;
    const scaleFactor = Math.min(actualWidth / 1040, actualHeight / 800);

    const readyCount = players.filter((p) => p.ready).length;

    const total = players.length;
    const allReady = readyCount === total && total > 0;

    // ── Animated values ────────────────────────────────────────────────────────
    const containerOpacity = useRef(new Animated.Value(0)).current;
    const headerSlideY = useRef(new Animated.Value(-40 * scaleFactor)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.6)).current;
    const btnScale = useRef(new Animated.Value(0.85)).current;
    const btnOpacity = useRef(new Animated.Value(0)).current;
    const allReadyScale = useRef(new Animated.Value(0.5)).current;
    const allReadyOpacity = useRef(new Animated.Value(0)).current;
    const radarRotate = useRef(new Animated.Value(0)).current;

    // Scanline sweep
    const scanlineY = useRef(new Animated.Value(-actualHeight * 0.1)).current;

    // ── Mount animations ───────────────────────────────────────────────────────
    useEffect(() => {
        // Fade in
        Animated.timing(containerOpacity, {
            toValue: 1, duration: 200, useNativeDriver: true,
        }).start();

        // Header drops in
        Animated.sequence([
            Animated.delay(100),
            Animated.parallel([
                Animated.spring(headerSlideY, { toValue: 0, friction: 7, tension: 200, useNativeDriver: true }),
                Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
        ]).start();

        // Button fades in
        Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
                Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(btnScale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
            ]),
        ]).start();

        // Pulse loop on the radar ring
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseScale, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseScale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
                ]),
            ])
        );
        pulseLoop.start();

        // Radar sweep rotation
        const radarLoop = Animated.loop(
            Animated.timing(radarRotate, {
                toValue: 360, duration: 4000, easing: Easing.linear, useNativeDriver: true,
            })
        );
        radarLoop.start();

        // Scanline sweep loop
        const scanLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanlineY, {
                    toValue: actualHeight * 1.1, duration: 3500, easing: Easing.linear, useNativeDriver: true,
                }),
                Animated.timing(scanlineY, {
                    toValue: -actualHeight * 0.1, duration: 0, useNativeDriver: true,
                }),
                Animated.delay(800),
            ])
        );
        scanLoop.start();

        return () => {
            pulseLoop.stop();
            radarLoop.stop();
            scanLoop.stop();
        };
    }, []);

    // ── Progress bar ───────────────────────────────────────────────────────────
    useEffect(() => {
        const target = total > 0 ? (readyCount / total) * actualWidth : 0;
        Animated.timing(progressWidth, {
            toValue: target,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false, // width can't use native driver
        }).start();
    }, [readyCount, total, actualWidth]);

    // ── All ready burst ────────────────────────────────────────────────────────
    useEffect(() => {
        if (allReady) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Animated.parallel([
                Animated.spring(allReadyScale, { toValue: 1, friction: 4, tension: 280, useNativeDriver: true }),
                Animated.timing(allReadyOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            allReadyScale.setValue(0.5);
            allReadyOpacity.setValue(0);
        }
    }, [allReady]);

    // ── Derived ────────────────────────────────────────────────────────────────
    const radarDeg = useMemo(
        () => radarRotate.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }),
        [radarRotate]
    );

    const radarR = 44 * scaleFactor;

    // Grid lines for SVG background
    const gridLines = useMemo(() => {
        const lines = [];
        const spacing = 44;
        for (let x = 0; x < actualWidth; x += spacing) {
            lines.push({ x1: x, y1: 0, x2: x, y2: actualHeight, accent: x % (spacing * 4) === 0 });
        }
        for (let y = 0; y < actualHeight; y += spacing) {
            lines.push({ x1: 0, y1: y, x2: actualWidth, y2: y, accent: y % (spacing * 4) === 0 });
        }
        return lines;
    }, [actualWidth, actualHeight]);

    const fs = {
        roundLabel: 11 * scaleFactor,
        roundNum: 48 * scaleFactor,
        subtitle: 13 * scaleFactor,
        count: 28 * scaleFactor,
        btn: 14 * scaleFactor,
        allReady: 22 * scaleFactor,
    };

    return (
        <Animated.View style={[styles.fullscreen, { opacity: containerOpacity }, style]}>

            {/* ── Background ──────────────────────────────────────────────────────── */}
            <View style={[styles.fullscreen, { backgroundColor: PALETTE.bg }]} />

            {/* ── Tactical grid ───────────────────────────────────────────────────── */}
            <View style={styles.fullscreen} pointerEvents="none">
                <Svg width={actualWidth} height={actualHeight}>
                    <Defs>
                        <RadialGradient id="bgFade" cx="50%" cy="40%" r="60%">
                            <Stop offset="0%" stopColor="rgba(0,212,255,0.07)" stopOpacity="1" />
                            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Rect width={actualWidth} height={actualHeight} fill="url(#bgFade)" />
                    {gridLines.map((l, i) => (
                        <Line
                            key={i}
                            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                            stroke={l.accent ? PALETTE.gridLineAccent : PALETTE.gridLine}
                            strokeWidth={l.accent ? 1 : 0.5}
                        />
                    ))}
                </Svg>
            </View>

            {/* ── Scanline sweep ─────────────────────────────────────────────────── */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.fullscreen,
                    {
                        transform: [{ translateY: scanlineY }],
                    },
                ]}
            >
                <View
                    style={{
                        width: actualWidth,
                        height: 3,
                        backgroundColor: PALETTE.primary,
                        opacity: 0.12,
                        shadowColor: PALETTE.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 12,
                    }}
                />
            </Animated.View>

            {/* ── Scanline texture ────────────────────────────────────────────────── */}
            <View style={styles.fullscreen} pointerEvents="none">
                <Svg width={actualWidth} height={actualHeight}>
                    {Array.from({ length: Math.ceil(actualHeight / 3) }, (_, i) => (
                        <Rect key={i} x={0} y={i * 3} width={actualWidth} height={1} fill={PALETTE.scanline} />
                    ))}
                </Svg>
            </View>

            {/* ── Progress bar (top edge) ─────────────────────────────────────────── */}
            <View style={[styles.progressTrack, { height: 3 * scaleFactor }]} pointerEvents="none">
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: progressWidth,
                            height: 3 * scaleFactor,
                            backgroundColor: allReady ? PALETTE.ready : PALETTE.primary,
                            shadowColor: allReady ? PALETTE.ready : PALETTE.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.9,
                            shadowRadius: 8,
                        },
                    ]}
                />
            </View>

            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        top: 60 * scaleFactor,
                        opacity: headerOpacity,
                        transform: [{ translateY: headerSlideY }],
                    },
                ]}
                pointerEvents="none"
            >
                <Text style={[styles.roundLabel, { fontSize: fs.roundLabel, color: PALETTE.textDim }]}>
                    ROUND COMPLETE — PREPARING
                </Text>
                <Text
                    style={[
                        styles.roundNumber,
                        {
                            fontSize: fs.roundNum,
                            color: PALETTE.text,
                            textShadowColor: PALETTE.primaryGlow,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 24,
                        },
                    ]}
                >
                    ROUND {roundNumber + 1}
                </Text>
                <Text style={[styles.subtitle, { fontSize: fs.subtitle, color: PALETTE.textDim }]}>
                    ALL PLAYERS MUST READY UP TO CONTINUE
                </Text>
            </Animated.View>

            {/* ── Radar + count ───────────────────────────────────────────────────── */}
            <View
                style={[
                    styles.radarBlock,
                    {
                        top: 195 * scaleFactor,
                    },
                ]}
                pointerEvents="none"
            >
                {/* Pulse ring */}
                <Animated.View
                    style={{
                        position: "absolute",
                        width: radarR * 2,
                        height: radarR * 2,
                        borderRadius: radarR,
                        borderWidth: 1.5,
                        borderColor: allReady ? PALETTE.ready : PALETTE.primary,
                        transform: [{ scale: pulseScale }],
                        opacity: pulseOpacity,
                    }}
                />

                {/* Radar sweep */}
                <Animated.View
                    style={{
                        position: "absolute",
                        width: radarR * 2,
                        height: radarR * 2,
                        transform: [{ rotate: radarDeg }],
                    }}
                >
                    <Svg width={radarR * 2} height={radarR * 2}>
                        <Defs>
                            <LinearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0%" stopColor={allReady ? PALETTE.ready : PALETTE.primary} stopOpacity="0" />
                                <Stop offset="100%" stopColor={allReady ? PALETTE.ready : PALETTE.primary} stopOpacity="0.35" />
                            </LinearGradient>
                        </Defs>
                        {/* Half-circle sweep sector approximated as a pie */}
                        <Circle
                            cx={radarR}
                            cy={radarR}
                            r={radarR - 2}
                            fill="none"
                            stroke={allReady ? PALETTE.ready : PALETTE.primary}
                            strokeWidth={radarR * 1.8}
                            strokeDasharray={`${radarR * Math.PI * 0.45} ${radarR * Math.PI * 10}`}
                            strokeOpacity={0.12}
                        />
                    </Svg>
                </Animated.View>

                {/* Static ring */}
                <View
                    style={{
                        width: radarR * 2,
                        height: radarR * 2,
                        borderRadius: radarR,
                        borderWidth: 1.5,
                        borderColor: allReady ? PALETTE.ready : PALETTE.primary,
                        opacity: 0.45,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Count text */}
                    <Text
                        style={{
                            fontSize: fs.count,
                            fontWeight: "900",
                            color: allReady ? PALETTE.ready : PALETTE.primary,
                            letterSpacing: 2,
                            textShadowColor: allReady ? PALETTE.readyGlow : PALETTE.primaryGlow,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 12,
                        }}
                    >
                        {readyCount}/{total}
                    </Text>
                    <Text
                        style={{
                            fontSize: 9 * scaleFactor,
                            color: PALETTE.textDim,
                            letterSpacing: 2,
                            fontWeight: "700",
                            marginTop: 1,
                        }}
                    >
                        READY
                    </Text>
                </View>
            </View>

            {/* ── Player list ─────────────────────────────────────────────────────── */}
            <View
                style={[
                    styles.playerList,
                    {
                        top: 340 * scaleFactor,
                        width: Math.min(actualWidth * 0.88, 520 * scaleFactor),
                    },
                ]}
            >
                {players.map((player, i) => (
                    <PlayerSlot
                        key={player.id}
                        player={player}
                        isLocal={player.id === localPlayerId}
                        size={20 * scaleFactor}
                        scaleFactor={scaleFactor}
                        index={i}
                        entranceDelay={180 + i * 80}
                    />
                ))}
            </View>

            {/* ── "All ready!" banner ─────────────────────────────────────────────── */}
            <Animated.View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    bottom: 185 * scaleFactor,
                    alignSelf: "center",
                    opacity: allReadyOpacity,
                    transform: [{ scale: allReadyScale }],
                    backgroundColor: PALETTE.readyDim,
                    borderColor: PALETTE.ready,
                    borderWidth: 1,
                    borderRadius: 40 * scaleFactor,
                    paddingHorizontal: 22 * scaleFactor,
                    paddingVertical: 8 * scaleFactor,
                }}
            >
                <Text
                    style={{
                        fontSize: fs.allReady,
                        fontWeight: "900",
                        color: PALETTE.ready,
                        letterSpacing: 3,
                        textShadowColor: PALETTE.readyGlow,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 10,
                    }}
                >
                    ✓ ALL PLAYERS READY
                </Text>
            </Animated.View>

            {/* ── Ready button ────────────────────────────────────────────────────── */}
            <Animated.View
                style={{
                    position: "absolute",
                    bottom: 90 * scaleFactor,
                    alignSelf: "center",
                    opacity: btnOpacity,
                    transform: [{ scale: btnScale }],
                }}
            >
                <Pressable
                    onPress={() => {
                        if (!isLocalReady) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                            onReady();
                        }
                    }}
                    style={[
                        styles.readyBtn,
                        {
                            backgroundColor: isLocalReady ? PALETTE.btnReady : PALETTE.btnBg,
                            borderColor: isLocalReady ? PALETTE.btnReadyBorder : PALETTE.btnBorder,
                            paddingHorizontal: 44 * scaleFactor,
                            paddingVertical: 16 * scaleFactor,
                            borderRadius: 6 * scaleFactor,
                            borderWidth: 1.5,
                            opacity: isLocalReady ? 0.75 : 1,
                            shadowColor: isLocalReady ? PALETTE.ready : PALETTE.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isLocalReady ? 0.5 : 0.3,
                            shadowRadius: 18,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.readyBtnText,
                            {
                                fontSize: fs.btn,
                                color: isLocalReady ? PALETTE.ready : PALETTE.primary,
                                letterSpacing: 4,
                            },
                        ]}
                    >
                        {isLocalReady ? "✓  READY" : "READY UP"}
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
        zIndex: 5,
    },
    progressTrack: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(255,255,255,0.06)",
        zIndex: 20,
    },
    progressFill: {
        position: "absolute",
        left: 0,
        top: 0,
    },
    header: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 10,
    },
    roundLabel: {
        fontWeight: "700",
        letterSpacing: 3,
        marginBottom: 4,
        textTransform: "uppercase",
    },
    roundNumber: {
        fontWeight: "900",
        letterSpacing: 8,
        textTransform: "uppercase",
    },
    subtitle: {
        fontWeight: "600",
        letterSpacing: 2,
        marginTop: 6,
    },
    radarBlock: {
        position: "absolute",
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    playerList: {
        position: "absolute",
        alignSelf: "center",
        zIndex: 10,
    },
    playerSlot: {
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
    },
    playerName: {
        fontWeight: "900",
        letterSpacing: 2,
    },
    youBadge: {
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    readyBtn: {
        alignItems: "center",
        justifyContent: "center",
    },
    readyBtnText: {
        fontWeight: "900",
    },
});

export default WaitingForPlayersOverlay;