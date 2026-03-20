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
import {SHADOW_TOKENS} from "@/state/constants";
import {getSceneTransform} from "@/utils/helpers";

const AnimatedImage = Animated.createAnimatedComponent(Image);
// 1. Define the transform once outside or memoize it
const SCENE_TRANSFORM = getSceneTransform();
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
    colors: ['#004cd5', '#e30505', '#ffffff', '#ff2200'],
    rotationDuration: 13000,
    colorDuration: 1000,
    trailLength: 10,
    trailSpacing: 10, // Tighter spacing looks more like a "sweep"
    headOpacity: 0.5,
    bloom: true,
};

// ─── Sub-Component: Trail Item (Fixes iOS Hook Crash) ────────────────────────
const TrailItem = memo(({ source, index, color, spacing, opacity }: any) => {
    const style = useAnimatedStyle(() => ({
        tintColor: color.value,
        opacity: opacity,
        // 2. Use a static reference or a Reanimated-compatible object
        transform: [
            ...SCENE_TRANSFORM,
            // { rotate: `${-(index + 1) * spacing}deg` } // If you want the trail to actually offset
        ],
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
            -1, false
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
        tintColor: "#000000",
        opacity: cfg.headOpacity * 1,
        overflow: "visible",
        transform: [{ scale: 0.9 },{translateY: "+10%"}],
    }));
    const bloom2Style = useAnimatedStyle(() => ({
        // tintColor: sharedColor.value,
        tintColor: "#000000",
        opacity: cfg.headOpacity * SHADOW_TOKENS.soft.opacity,
        overflow: "visible",
        transform: [
            { scale: 1 },
            {translateY: `${SHADOW_TOKENS.soft.offsetY}%`}
        ],
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
                    // opacity={1}
                />
            ))}

            {/* 3. The Leading Head */}
            <AnimatedImage
                source={source}
                resizeMode="contain"
                style={[styles.base, headStyle,{transform: getSceneTransform()}]}
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