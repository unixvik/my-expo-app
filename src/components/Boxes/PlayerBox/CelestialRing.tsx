import React, { memo, useEffect, useRef, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const RING_SPIN_MS = 3000;
const VIOLET_GLOW = "rgba(180, 140, 255, 0.9)";
const VIOLET_TRACK = "rgba(180, 160, 255, 0.12)";

export const CelestialRing = memo(function CelestialRing({ active }: { active: boolean }) {
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Static tick positions - calculated once
    const ticks = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30 * (Math.PI / 180);
            const r = 32;
            return { cx: 36 + r * Math.sin(angle), cy: 36 - r * Math.cos(angle) };
        });
    }, []);

    useEffect(() => {
        if (active) {
            // Use Animated.loop for better performance and native lifecycle handling
            const loop = Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: RING_SPIN_MS,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            loop.start();
            return () => loop.stop();
        } else {
            // Smoothly reset or stop when inactive
            Animated.spring(spinAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
        }
    }, [active, spinAnim]);

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={styles.svgWrapper}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
                <Svg width="72" height="72" viewBox="0 0 72 72">
                    {/* Orbit Track */}
                    <Circle cx="36" cy="36" r="32" stroke={VIOLET_TRACK} strokeWidth="2" fill="none" />

                    {/* Celestial Ticks */}
                    {ticks.map((t, i) => (
                        <Circle
                            key={i}
                            cx={t.cx}
                            cy={t.cy}
                            r="1.5"
                            fill={active ? VIOLET_GLOW : "rgba(140,100,200,0.3)"}
                        />
                    ))}

                    {/* Active Progress Indicator */}
                    {active && (
                        <Circle
                            cx="36"
                            cy="36"
                            r="32"
                            stroke={VIOLET_GLOW}
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray="60, 200"
                            strokeLinecap="round"
                        />
                    )}
                </Svg>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    svgWrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
});