import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

// ─── Configuration ────────────────────────────────────────────────────────────
export interface RingConfig {
    /** Colors to cycle through (loops back to first) */
    colors: string[];
    /** ms for one full rotation */
    rotationDuration: number;
    /** ms per full color cycle */
    colorDuration: number;
    /** Peak opacity of the core ring (0–1) */
    coreOpacity: number;
    /** How many glow bloom layers to render (1–3) */
    bloomLayers: number;
    /** Pulse: opacity breathes between this and coreOpacity */
    pulseMinOpacity: number;
    /** ms per pulse breath */
    pulseDuration: number;
    /** Counter-rotate a second copy for complexity */
    counterRotate: boolean;
}

export const DEFAULT_RING_CONFIG: RingConfig = {
    colors: [
        '#00e5ff', // cyan
        '#a855f7', // violet
        '#facc15', // gold
        '#f43f5e', // rose
        '#22d3ee', // sky
        '#00e5ff', // loop back to cyan
    ],
    rotationDuration:   9000,
    colorDuration:      400,
    coreOpacity:        0.95,
    bloomLayers:        3,
    pulseMinOpacity:    0.55,
    pulseDuration:      2200,
    counterRotate:      true,
};
// ──────────────────────────────────────────────────────────────────────────────

interface AnimatedRingProps {
    source: any;
    config?: Partial<RingConfig>;
    style?: any;
}

export const AnimatedRing = ({ source, config: configOverride, style }: AnimatedRingProps) => {
    const cfg: RingConfig = { ...DEFAULT_RING_CONFIG, ...configOverride };
    const n = cfg.colors.length - 1; // input range max (last color = first for seamless loop)

    // Shared values
    const rotation    = useSharedValue(0);
    const colorPhase  = useSharedValue(0);
    const pulse       = useSharedValue(cfg.coreOpacity);

    useEffect(() => {
        // Continuous forward rotation
        // rotation.value = withRepeat(
        //     withTiming(1, { duration: cfg.rotationDuration, easing: Easing.linear }),
        //     -1, false
        // );
        // Color phase: 0 → n → 0 → n ... seamlessly
        colorPhase.value = withRepeat(
            withTiming(n, { duration: cfg.colorDuration, easing: Easing.linear }),
            -1, false
        );
        // Pulse: breathe opacity up and down
        pulse.value = withRepeat(
            withSequence(
                withTiming(cfg.pulseMinOpacity, { duration: cfg.pulseDuration, easing: Easing.inOut(Easing.sin) }),
                withTiming(cfg.coreOpacity,     { duration: cfg.pulseDuration, easing: Easing.inOut(Easing.sin) })
            ),
            -1, false
        );
    }, []);

    // ── Core ring ──────────────────────────────────────────────────────────────
    const coreStyle = useAnimatedStyle(() => {
        const color = interpolateColor(colorPhase.value, Array.from({ length: n + 1 }, (_, i) => i), cfg.colors);
        return {
            tintColor: color,
            opacity:   pulse.value,
            transform: [{ rotate: `${rotation.value * 360}deg` }],
        };
    });

    // ── Counter-rotation (second copy, slower, reversed) ──────────────────────
    const counterStyle = useAnimatedStyle(() => {
        const color = interpolateColor(colorPhase.value, Array.from({ length: n + 1 }, (_, i) => i), cfg.colors);
        return {
            tintColor: color,
            opacity:   pulse.value * 0.45,

            transform: [{ rotate: `${-rotation.value * 360 * 0.6}deg` }, { scale: 0.97 }],
        };
    });

    // ── Bloom layer factory ────────────────────────────────────────────────────
    // Each bloom layer is larger, less opaque — faking a gaussian blur halo.
    const bloom1Style = useAnimatedStyle(() => {
        const color = interpolateColor(colorPhase.value, Array.from({ length: n + 1 }, (_, i) => i), cfg.colors);
        return {
            tintColor: color,
            opacity:   pulse.value * 0.5,
            transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: 1.045 }],
        };
    });

    const bloom2Style = useAnimatedStyle(() => {
        const color = interpolateColor(colorPhase.value, Array.from({ length: n + 1 }, (_, i) => i), cfg.colors);
        return {
            tintColor: color,
            opacity:   pulse.value * 0.18,
            transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: 1.10 }],
        };
    });

    const bloom3Style = useAnimatedStyle(() => {
        const color = interpolateColor(colorPhase.value, Array.from({ length: n + 1 }, (_, i) => i), cfg.colors);
        return {
            tintColor: color,
            opacity:   pulse.value * 0.08,
            transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: 1.18 }],
        };
    });

    const bloomStyles = [bloom1Style, bloom2Style, bloom3Style].slice(0, cfg.bloomLayers);

    return (
        <>
            {/* Outer bloom layers (rendered first = behind) */}
            {bloomStyles.reverse().map((s, i) => (
                <AnimatedImage key={`bloom-${i}`} source={source} resizeMode="contain" style={[styles.base, style, s]} />
            ))}

            {/* Counter-rotating ghost copy */}
            {/*{cfg.counterRotate && (*/}
            {/*    <AnimatedImage source={source} resizeMode="contain" style={[styles.base, style, counterStyle]} />*/}
            {/*)}*/}

            {/* Core ring — sharpest, most opaque */}
            {/*<AnimatedImage source={source} resizeMode="contain" style={[styles.base, style, coreStyle]} />*/}
        </>
    );
};

const styles = StyleSheet.create({
    base: {
        position: 'absolute',
        width:  '100%',
        height: '100%',
    },
});
