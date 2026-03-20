import React, { memo, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolateColor,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

// ─── Configuration ────────────────────────────────────────────────────────────
export interface SweepConfig {
    colors: string[];
    rotationDuration: number;
    colorDuration: number;
    trailLength: number;
    trailSpacing: number;
    headOpacity: number;
    bloom: boolean;
}

const DEFAULT_SWEEP_CONFIG: SweepConfig = {
    colors: ['#ff2200', '#ff6600', '#ffaa00', '#ff2200'],
    rotationDuration: 3000,
    colorDuration: 3000,
    trailLength: 8,
    trailSpacing: 15, // Tighter spacing looks more like a "sweep"
    headOpacity: 0.95,
    bloom: true,
};

// ─── Sub-Component: Trail Item (Fixes iOS Hook Crash) ────────────────────────
const TrailItem = memo(({ source, index, color, spacing, opacity }: any) => {
    const style = useAnimatedStyle(() => ({
        tintColor: color.value,
        opacity: opacity,
        // transform: [{ rotate: `${-(index + 1) * spacing}deg` }],
    }));

    return (
        <AnimatedImage
            source={source}
            resizeMode="contain"
            style={[styles.base, style]}
        />
    );
});

// ─── Main Component ──────────────────────────────────────────────────────────
export const SweepRing = ({ source, config: override, style }: { source: any, config?: Partial<SweepConfig>, style?: any }) => {
    const cfg = { ...DEFAULT_SWEEP_CONFIG, ...override };
    const rotation = useSharedValue(0);
    const colorPhase = useSharedValue(0);

    // Optimization: Calculate the color once per frame and share it with all children
    const n = cfg.colors.length - 1;
    const inputRange = Array.from({ length: n + 1 }, (_, i) => i);

    const sharedColor = useDerivedValue(() => {
        return interpolateColor(colorPhase.value, inputRange, cfg.colors);
    });

    useEffect(() => {
        // rotation.value = withRepeat(
        //     withTiming(1, { duration: cfg.rotationDuration, easing: Easing.linear }),
        //     -1, false
        // );
        colorPhase.value = withRepeat(
            withTiming(n, { duration: cfg.colorDuration, easing: Easing.linear }),
            0, false
        );
    }, [cfg.rotationDuration, cfg.colorDuration, n]);

    // Main rotating container
    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value * 360}deg` }],
    }));

    // Head Style
    const headStyle = useAnimatedStyle(() => ({
        tintColor: sharedColor.value,
        opacity: cfg.headOpacity,
        zIndex: 10,
    }));

    // Bloom Styles (Optimized with combined transforms)
    const bloom1Style = useAnimatedStyle(() => ({
        // tintColor: sharedColor.value,
        tintColor: "#000",
        opacity: cfg.headOpacity * 1,
        overflow: "visible",
        transform: [{ scale: 0.9 },{translateY: "+8%"}],
    }));

    return (
        <Animated.View style={[styles.base, style, containerStyle]} pointerEvents="none">

            {/* 1. The Trail (Rendered First) */}
            {Array.from({ length: cfg.trailLength }).map((_, i) => (
                <TrailItem
                    key={`trail-${i}`}
                    source={source}
                    index={i}
                    color={sharedColor}
                    spacing={cfg.trailSpacing}
                    // Exponential decay for the tail
                    opacity={cfg.headOpacity * Math.pow(0.6, i + 1)}
                />
            ))}

            {/* 2. Bloom/Glow Layer */}
            {cfg.bloom && (
                <AnimatedImage
                    source={source}
                    resizeMode="contain"
                    style={[styles.base, bloom1Style]}
                />
            )}

            {/* 3. The Leading Head */}
            <AnimatedImage
                source={source}
                resizeMode="contain"
                style={[styles.base, headStyle]}
            />

        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
});