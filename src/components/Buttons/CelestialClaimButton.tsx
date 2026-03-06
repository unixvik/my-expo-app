import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle, Path } from "react-native-svg";

type ClaimButtonProps = {
    enabled: boolean;
    onPress?: () => void;
    size?: number;
};

export const ClaimButton = memo(function ClaimButton({
                                                         enabled,
                                                         onPress,
                                                         size = 86,
                                                     }: ClaimButtonProps) {
    const pressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    // 1. ANIMATION LIFECYCLE
    useEffect(() => {
        if (!enabled) {
            // Smoothly wind down animations when disabled
            Animated.parallel([
                Animated.timing(pulseAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(spinAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start();
            return;
        }

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );

        const spin = Animated.loop(
            Animated.timing(spinAnim, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true })
        );

        pulse.start();
        spin.start();

        return () => {
            pulse.stop();
            spin.stop();
        };
    }, [enabled, pulseAnim, spinAnim]);

    // 2. INTERACTION HANDLERS
    const onPressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40, // More "mechanical" feel
            friction: 7
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7
        }).start();
    };

    // 3. INTERPOLATIONS
    const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });
    const lift = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });
    const glowScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
    const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
    const ringRotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

    const dimOpacity = enabled ? 1 : 0.45;

    // 4. MEMOIZED DIMENSIONS & GEOMETRY
    const outer = useMemo(() => ({ width: size, height: size, borderRadius: size / 2 }), [size]);

    const dots = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x = 50 + Math.cos(a) * 41;
            const y = 50 + Math.sin(a) * 41;
            const r = i % 3 === 0 ? 1.8 : 1.1; // Slightly larger primary dots
            return { x, y, r, id: i };
        });
    }, []);

    return (
        <View style={[styles.claimWrap, outer]} pointerEvents="box-none">
            {/* Ambient Glow - Scaled to size */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.glow,
                    outer,
                    {
                        opacity: enabled ? glowOpacity : 0.1,
                        transform: [{ scale: enabled ? glowScale : 1 }],
                    },
                ]}
            />

            <Pressable
                onPress={enabled ? onPress : undefined}
                onPressIn={enabled ? onPressIn : undefined}
                onPressOut={enabled ? onPressOut : undefined}
                hitSlop={20} // Optimized for better touch accuracy
                style={({ pressed }) => [
                    styles.pressable,
                    outer,
                    { opacity: pressed ? 0.9 * dimOpacity : dimOpacity },
                ]}
            >
                <Animated.View style={[styles.button, outer, { transform: [{ translateY: lift }, { scale }] }]}>
                    {/* Surface Gradient */}
                    <LinearGradient
                        colors={enabled ? ["#7a3eff", "#2a0b63", "#0f0520"] : ["#3a245c", "#1b1230", "#08050d"]}
                        locations={[0, 0.6, 1]}
                        style={[StyleSheet.absoluteFill, outer]}
                    />

                    {/* Rotating Charged Ring */}
                    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ rotate: ringRotate }] }]}>
                        <Svg width={size} height={size} viewBox="0 0 100 100">
                            <Defs>
                                <RadialGradient id="claim_rg" cx="50" cy="50" r="50">
                                    <Stop offset="0" stopColor="rgba(210,190,255,0.4)" />
                                    <Stop offset="0.7" stopColor="rgba(140,80,255,0.1)" />
                                    <Stop offset="1" stopColor="rgba(140,80,255,0)" />
                                </RadialGradient>
                            </Defs>

                            <Circle cx="50" cy="50" r="48" fill="url(#claim_rg)" />

                            {dots.map((dot) => (
                                <Circle
                                    key={dot.id}
                                    cx={dot.x}
                                    cy={dot.y}
                                    r={dot.r}
                                    fill={enabled ? "rgba(200,180,255,0.9)" : "rgba(160,140,200,0.3)"}
                                />
                            ))}
                        </Svg>
                    </Animated.View>

                    {/* Inner Core Plate */}
                    <View style={[styles.innerPlate, { borderRadius: size / 2 - 10 }]}>
                        <LinearGradient
                            colors={enabled ? ["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"] : ["rgba(255,255,255,0.04)", "rgba(255,255,255,0)"]}
                            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
                        />

                        {/* Central Sigil */}
                        <View style={styles.sigil}>
                            <Svg width={22} height={22} viewBox="0 0 24 24">
                                <Path
                                    d="M12 2l3.2 6.6L22 10l-5 4.9L18.4 22 12 18.6 5.6 22 7 14.9 2 10l6.8-1.4L12 2z"
                                    fill={enabled ? "rgba(240,230,255,0.95)" : "rgba(180,170,200,0.5)"}
                                />
                            </Svg>
                        </View>

                        <Text style={[styles.claimText, { opacity: enabled ? 1 : 0.6 }]}>CLAIM</Text>
                        <Text style={[styles.subText, { opacity: enabled ? 0.8 : 0.4 }]}>
                            {enabled ? "READY" : "LOCKED"}
                        </Text>
                    </View>

                    {/* Outer Rim Shading */}
                    <View style={[styles.rim, outer]} pointerEvents="none" />
                </Animated.View>
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create({
    claimWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    pressable: {
        alignItems: "center",
        justifyContent: "center",
    },
    glow: {
        position: "absolute",
        shadowColor: "#a67cff",
        shadowOpacity: 0.8,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
    },
    button: {
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    innerPlate: {
        width: "78%",
        height: "78%",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(12,8,24,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    sigil: {
        position: "absolute",
        top: "12%",
        opacity: 0.9,
    },
    claimText: {
        fontSize: 16,
        letterSpacing: 2.5,
        fontWeight: "900",
        color: "#ffffff",
        textShadowColor: "rgba(140,80,255,0.8)",
        textShadowRadius: 8,
        textShadowOffset: { width: 0, height: 0 },
        marginTop: 10,
    },
    subText: {
        marginTop: 2,
        fontSize: 10,
        letterSpacing: 1.5,
        fontWeight: "800",
        color: "rgba(230,220,255,0.8)",
    },
    rim: {
        position: "absolute",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.08)",
    },
});