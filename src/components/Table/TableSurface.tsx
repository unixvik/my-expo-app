import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    Easing,
    interpolate,
    runOnJS,
} from "react-native-reanimated";

import { getSceneTransform } from "@/utils/helpers";
import { CenterTable } from "@/components/Table/CenterTable";
import { TABLE_PERSPECTIVE, TABLE_TILT } from "@/state/constants";
import { useGameStore } from "@/state/useGameStore";
import { useVisualStore } from "@/state/useVisualStore";

const TABLE_IMG         = require('@/assets/images/TableTop.png');
const TABLE_RING        = require('@/assets/images/ring.png');
const TABLE_OUTER_RING  = require('@/assets/images/RingOver.png');

const SCENE_TRANSFORM = getSceneTransform();

// ─── Animation config ──────────────────────────────────────────────────────────

// Phase 2 — idle float (very subtle perpetual sine after entrance spring settles)
const FLOAT_Y           = 0;    // idle hover height above rest
const FLOAT_SCALE       = 1.005;  // barely perceptible breath
const FLOAT_DURATION    = 1000;   // slow, majestic cycle

// Rim flash
const RIM_FLASH_DURATION = 1200;


export const TableSurface = () => {
    const gameStatus = useGameStore((s) => s.server.gameStatus);

    // ── Shared values ────────────────────────────────────────────────────────

    // Table entrance — starts buried below, same bouncy spring as center table
    const tableY        = useSharedValue(320);
    const tableScale    = useSharedValue(0.65);

    // floatProgress: drives the perpetual idle sine [0 → 1 → 0 → ...]
    // Starts at 0. Kicked off ONLY after entrance spring settles.
    const floatProgress = useSharedValue(0);
    const isFloating    = useSharedValue(0);

    // Rim flash
    const rimFlash      = useSharedValue(0);

    // Track if we've already triggered the rise so it only fires once per mount
    const hasRisen = useRef(false);

    const setTableSettled = useVisualStore((s) => s.setTableSettled);

    // ── startIdleFloat — called via runOnJS once the rise spring settles ────
    const startIdleFloat = () => {
        isFloating.value = withTiming(1, { duration: 1 });
        floatProgress.value = withRepeat(
            withTiming(1, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        setTableSettled(); // signal CenterTable to re-measure its refs
    };

    // ── Trigger on 'starting' ────────────────────────────────────────────────
    useEffect(() => {
        if (gameStatus === 'starting' && !hasRisen.current) {
            hasRisen.current = true;

            // ── TABLE: spring up from below with a bouncy wobble ──
            const SPRING = { mass: 1.1, stiffness: 220, damping: 7 };
            tableY.value = withSpring(-50, SPRING, (finished) => {
                if (finished) runOnJS(startIdleFloat)();
            });
            tableScale.value = withSpring(1, SPRING);

            // Rim flash fires around the first overshoot peak of the spring (~350ms)
            rimFlash.value = withDelay(
                350,
                withSequence(
                    withTiming(1, { duration: RIM_FLASH_DURATION * 0.25, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: RIM_FLASH_DURATION * 0.75, easing: Easing.in(Easing.quad) }),
                )
            );

            // After initial flash, begin low-frequency periodic flashes
            rimFlash.value = withDelay(
                350 + RIM_FLASH_DURATION + 5000,
                withRepeat(
                    withSequence(
                        withTiming(1, { duration: RIM_FLASH_DURATION * 0.3, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: RIM_FLASH_DURATION * 0.7, easing: Easing.in(Easing.quad) }),
                        withTiming(0, { duration: 5000 }), // long pause
                    ),
                    -1,
                    false
                )
            );
        }
    }, [gameStatus]);

    // ─────────────────────────────────────────────────────────────────────────
    // ANIMATED STYLES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * FLOATING TABLE
     *
     * Two additive layers:
     *   tableY/tableScale — one-shot bouncy spring entrance
     *   idleY/idleScale   — perpetual subtle sine (post-entrance)
     */
    const floatStyle = useAnimatedStyle(() => {
        const idleY     = interpolate(floatProgress.value, [0, 1], [0, FLOAT_Y]) * isFloating.value;
        const idleScale = 1 + (interpolate(floatProgress.value, [0, 1], [0, FLOAT_SCALE - 1]) * isFloating.value);

        return {
            transform: [
                { perspective: TABLE_PERSPECTIVE },
                { rotateX: `${TABLE_TILT}deg` },
                { translateY: tableY.value + idleY },
                { scale: tableScale.value * idleScale },
            ],
        };
    });

    /**
     * SHADOW — child of floatingContainer, counter-translates to stay grounded.
     */
    const shadowStyle = useAnimatedStyle(() => {
        const idleY    = interpolate(floatProgress.value, [0, 1], [0, FLOAT_Y]) * isFloating.value;
        const counterY = -(tableY.value + idleY);

        // Altitude above origin (tableY negative = above, positive = below)
        const alt = -tableY.value;
        const opacity = interpolate(alt, [-320, 0, 80], [1, 0.45, 0.2], 'clamp');
        const scaleX  = interpolate(alt, [-320, 0, 80], [1, 0.82, 0.9], 'clamp');
        const scaleY  = interpolate(alt, [-320, 0, 80], [0.2, 0.50, 0.9], 'clamp');

        return {
            opacity,
            tintColor: 'black',
            transform: [
                { translateY: counterY + 2 },
                { scaleX },
                { scaleY },
                { translateX: -10}
            ],
        };
    });

    /**
     * RIM FLASH — specular burst on the ring
     */
    const rimFlashStyle = useAnimatedStyle(() => ({
        opacity: interpolate(rimFlash.value, [0, 0.5, 1], [0.3, 1.0, 0.3]),
    }));

    /**
     * RING CROSSFADE
     *
     * iOS cannot reorder siblings dynamically — z-order is fixed at render time.
     * Solution: render the ring TWICE.
     *   - bottomRing: always below the table (render order 1)
     *   - topRing:    always above the table (render order 3)
     *
     * When the table is LOW  → topRing is opaque,  bottomRing is transparent
     *                           (ring appears OVER the table)
     * When the table is HIGH → topRing is transparent, bottomRing is opaque
     *                           (ring appears UNDER the table, table floats above)
     *
     * The crossfade threshold is when the table clears the ring height (~0.3).
     */
    const bottomRingStyle = useAnimatedStyle(() => {
        // tableY: 320=below, 0=rest, negative=above. Crossfade as table passes ring plane.
        const opacity = interpolate(tableY.value, [60, -20], [0, 1], 'clamp');
        return { opacity };
    });

    const topRingStyle = useAnimatedStyle(() => {
        const opacity = interpolate(tableY.value, [60, -20], [1, 0], 'clamp');
        return { opacity };
    });

    return (
        <View pointerEvents="box-none" style={styles.root}>

            {/* LAYER 0 — RIM FLASH (undermost, always behind everything) */}
            <Animated.Image
                source={TABLE_RING}
                resizeMode="contain"
                style={[styles.fill, { transform: SCENE_TRANSFORM, tintColor: '#03a1a1' }, rimFlashStyle]}
                needsOffscreenAlphaCompositing
                renderToHardwareTextureAndroid
            />

            {/* LAYER 1 — BOTTOM RING (visible when table is above ring plane) */}
            <Animated.Image
                source={TABLE_OUTER_RING}
                resizeMode="contain"
                style={[styles.fill, { transform: SCENE_TRANSFORM }, bottomRingStyle]}
                renderToHardwareTextureAndroid
            />

            {/* LAYER 2 — FLOATING PLATFORM */}
            <Animated.View
                pointerEvents="box-none"
                style={[styles.floatingContainer, floatStyle, { transform: SCENE_TRANSFORM }]}
                renderToHardwareTextureAndroid
            >
                {/* SHADOW */}
                <Animated.Image
                    source={TABLE_IMG}
                    resizeMode="contain"
                    style={[styles.tableShadowChild, shadowStyle]}
                    renderToHardwareTextureAndroid
                />

                {/* TABLE SURFACE */}
                <Image
                    source={TABLE_IMG}
                    resizeMode="contain"
                    style={styles.tableTopImage}
                />

                <CenterTable />
            </Animated.View>
            <Animated.Image
                source={TABLE_OUTER_RING}
                resizeMode="contain"
                style={[styles.fill, { transform: SCENE_TRANSFORM }, topRingStyle]}
                needsOffscreenAlphaCompositing
                renderToHardwareTextureAndroid
            />

        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        // Prevents iOS from flattening the entire subtree into one compositing layer
        opacity: 0.999,
    },

    fill: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },

    floatingContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        // Forces iOS to composite this subtree independently so it can
        // visually interleave between the two ring layers
        opacity: 0.999,
    },

    tableShadowChild: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },

    tableTopImage: {
        width: '82%',
        height: '90%',
        position: 'absolute',
    },

    topRingOverlay: {
        ...StyleSheet.absoluteFillObject,
        // Forces this overlay into its own compositing layer so it
        // reliably sits above the table when the table is at rest
        opacity: 0.4,
        // zIndex: 100,
    },
});