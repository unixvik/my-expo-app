// src/components/Table/DrawTooltip.tsx
import React, { memo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useDevice } from "@/hooks/useDevice";

/**
 * Cinematic HUD tooltip:
 * - minimal plate + rim light + soft glow
 * - float + shimmer
 * - arrows pulse with slight parallax
 */

const PulsingArrow = ({
                          direction,
                          scale,
                      }: {
    direction: "left" | "right";
    scale: number;
}) => {
    const isLeft = direction === "left";

    return (
        <View style={[styles.arrowRow, isLeft && styles.arrowRowReversed]}>
            {[0, 1, 2].map((i) => (
                <MotiView
                    key={i}
                    from={{
                        opacity: 0.12,
                        translateX: isLeft ? 8 * scale : -8 * scale,
                        scale: 0.98,
                    }}
                    animate={{
                        opacity: 1,
                        translateX: 0,
                        scale: 1,
                    }}
                    transition={{
                        type: "timing",
                        duration: 520,
                        delay: i * 110,
                        loop: true,
                        repeatReverse: true,
                    }}
                    style={{ marginHorizontal: -1 * scale }}
                >
                    <Text
                        style={[
                            styles.arrowGlyph,
                            {
                                fontSize: 22 * scale,
                                lineHeight: 24 * scale,
                            },
                            isLeft && styles.arrowFlipped,
                        ]}
                    >
                        ›
                    </Text>
                </MotiView>
            ))}
        </View>
    );
};

const StampLabel = ({
                        children,
                        scale,
                    }: {
    children: string;
    scale: number;
}) => (
    <View style={styles.stampOuter}>
        {/* outer rim */}
        <View
            style={[
                styles.stampBorderOuter,
                {
                    borderWidth: 1.5 * scale,
                    borderRadius: 10 * scale,
                    padding: 2 * scale,
                },
            ]}
        >
            {/* inner plate */}
            <View
                style={[
                    styles.stampBorderInner,
                    {
                        borderRadius: 8 * scale,
                        paddingHorizontal: 10 * scale,
                        paddingVertical: 6 * scale,
                    },
                ]}
            >
                {/* plate gradient */}
                <LinearGradient
                    colors={["rgba(255,255,255,0.08)", "rgba(0,0,0,0.18)"]}
                    start={{ x: 0.2, y: 0.0 }}
                    end={{ x: 0.8, y: 1.0 }}
                    style={StyleSheet.absoluteFill}
                />
                {/* warm shimmer */}
                <LinearGradient
                    colors={["transparent", GOLD_FAINT, "transparent"]}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 1, y: 0.8 }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
                />

                <Text
                    style={[
                        styles.stampText,
                        {
                            fontSize: 10 * scale,
                            letterSpacing: 3.2 * scale,
                        },
                    ]}
                >
                    {children}
                </Text>
            </View>
        </View>

        {/* corner “cuts” (more subtle, like etched plate) */}
        <View style={[styles.notch, styles.notchTL, { width: 6 * scale, height: 6 * scale }]} />
        <View style={[styles.notch, styles.notchTR, { width: 6 * scale, height: 6 * scale }]} />
        <View style={[styles.notch, styles.notchBL, { width: 6 * scale, height: 6 * scale }]} />
        <View style={[styles.notch, styles.notchBR, { width: 6 * scale, height: 6 * scale }]} />
    </View>
);

export const DrawToolTip = memo(function DrawToolTip() {
    const { isDesktop } = useDevice();
    const SCALE = isDesktop ? 1.65 : 1;

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.92, translateY: 8 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.92, translateY: 8 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            style={styles.root}
            pointerEvents="none"
        >
            {/* Cinematic HUD Plate */}
            <MotiView
                from={{ translateY: 0 }}
                animate={{ translateY: [0, -2 * SCALE, 0] }}
                transition={{ type: "timing", duration: 2200, loop: true }}
                style={[
                    styles.plate,
                    {
                        paddingHorizontal: 14 * SCALE,
                        paddingVertical: 10 * SCALE,
                        borderRadius: 18 * SCALE,
                    },
                ]}
            >
                {/* soft shadow under plate (single pass) */}
                <View style={[styles.plateShadow, { borderRadius: 18 * SCALE }]} />

                {/* plate background */}
                {/*<LinearGradient*/}
                {/*    colors={["rgba(10,12,18,0.0)", "rgba(4,6,10,0.22)", "rgba(4,6,10,0.02)"]}*/}
                {/*    start={{ x: 0.15, y: 0 }}*/}
                {/*    end={{ x: 0.85, y: 1 }}*/}
                {/*    style={[StyleSheet.absoluteFill, { borderRadius: 18 * SCALE }]}*/}
                {/*/>*/}

                {/* rim light */}
                <View
                    pointerEvents="none"
                    style={[
                        styles.rim,
                        {
                            borderRadius: 18 * SCALE,
                            borderWidth: 1,
                        },
                    ]}
                />

                {/* shimmer sweep */}
                <MotiView
                    from={{ opacity: 0.0, translateX: -120 * SCALE }}
                    animate={{ opacity: [0.0, 0.7, 0.0], translateX: 120 * SCALE }}
                    transition={{ type: "timing", duration: 1400, loop: true, delay: 250 }}
                    pointerEvents="none"
                    style={[
                        styles.shimmer,
                        {
                            height: 44 * SCALE,
                            borderRadius: 16 * SCALE,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={["transparent", "rgba(245,200,66,0.10)", "transparent"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                </MotiView>

                {/* content */}
                <View style={[styles.row, { gap: 14 * SCALE }]}>
                    {/* LEFT */}
                    <View style={[styles.side, { gap: 8 * SCALE }]}>
                        <PulsingArrow direction="left" scale={SCALE} />
                        <StampLabel scale={SCALE}>DRAW</StampLabel>
                    </View>

                    {/* CENTER divider */}
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { height: 12 * SCALE }]} />
                        <Text
                            style={[
                                styles.dividerText,
                                { fontSize: 8 * SCALE, letterSpacing: 2.4 * SCALE },
                            ]}
                        >
                            OR
                        </Text>
                        <View style={[styles.dividerLine, { height: 12 * SCALE }]} />
                    </View>

                    {/* RIGHT */}
                    <View style={[styles.side, { gap: 8 * SCALE }]}>
                        <StampLabel scale={SCALE}>DRAW</StampLabel>
                        <PulsingArrow direction="right" scale={SCALE} />
                    </View>
                </View>

                {/* bottom instruction */}
                <MotiView
                    from={{ opacity: 0, translateY: 4 * SCALE }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 520, delay: 260 }}
                    style={{ alignItems: "center" }}
                >
                    <Text
                        style={[
                            styles.subText,
                            {
                                marginTop: 8 * SCALE,
                                fontSize: 9 * SCALE,
                                letterSpacing: 4.2 * SCALE,
                            },
                        ]}
                    >
                        DRAW A CARD TO CONTINUE
                    </Text>

                    {/* micro underline pulse */}
                    <MotiView
                        from={{ opacity: 0.15, scaleX: 0.6 }}
                        animate={{ opacity: 0.55, scaleX: 1 }}
                        transition={{
                            type: "timing",
                            duration: 900,
                            loop: true,
                            repeatReverse: true,
                        }}
                        style={[
                            styles.underline,
                            { marginTop: 6 * SCALE, width: 120 * SCALE },
                        ]}
                    />
                </MotiView>
            </MotiView>
        </MotiView>
    );
});

const GOLD = "#f5c842";
const GOLD_DIM = "rgba(245,200,66,0.55)";
const GOLD_FAINT = "rgba(245,200,66,0.12)";
const RIM = "rgba(255,255,255,0.10)";
const RIM_WARM = "rgba(245,200,66,0.14)";
const INK_DIM = "rgba(245,200,66,0.42)";

const styles = StyleSheet.create({
    root: {
        position: "absolute",
        // left: 0,
        // right: 0,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        zIndex: 30,
    },

    plate: {
        position: "relative",
        overflow: "visible",
    },

    plateShadow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "transparent",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.55,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
            },
            android: {
                elevation: 18,
            },
            default: {},
        }),
    },

    rim: {
        ...StyleSheet.absoluteFillObject,
        borderColor: RIM,
        // subtle warm edge
        borderTopColor: RIM_WARM,
        borderLeftColor: RIM_WARM,
    },

    shimmer: {
        position: "absolute",
        left: 10,
        right: 10,
        top: 6,
        overflow: "hidden",
        opacity: 0.0,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    side: {
        flexDirection: "row",
        alignItems: "center",
    },

    // ── Arrows ──────────────────────────────────────────────────────────────
    arrowRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    arrowRowReversed: {
        flexDirection: "row-reverse",
    },
    arrowGlyph: {
        color: GOLD,
        fontWeight: "900",
        textShadowColor: "rgba(245,200,66,0.55)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    arrowFlipped: {
        transform: [{ scaleX: -1 }],
    },

    // ── Stamp ───────────────────────────────────────────────────────────────
    stampOuter: {
        position: "relative",
    },
    stampBorderOuter: {
        borderColor: "rgba(245,200,66,0.30)",
    },
    stampBorderInner: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        overflow: "hidden",
    },
    stampText: {
        color: GOLD,
        fontWeight: "900",
        textTransform: "uppercase",
        textShadowColor: "rgba(245,200,66,0.70)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },

    // Corner “cuts”
    notch: {
        position: "absolute",
        // backgroundColor: "rgba(0,0,0,0.65)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    notchTL: { top: -2, left: -2 },
    notchTR: { top: -2, right: -2 },
    notchBL: { bottom: -2, left: -2 },
    notchBR: { bottom: -2, right: -2 },

    // ── Divider ─────────────────────────────────────────────────────────────
    divider: {
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 2,
    },
    dividerLine: {
        width: 1,
        backgroundColor: GOLD_DIM,
        opacity: 0.8,
    },
    dividerText: {
        color: GOLD_DIM,
        fontWeight: "900",
    },

    // ── Sub text ─────────────────────────────────────────────────────────────
    subText: {
        color: INK_DIM,
        fontWeight: "800",
        textTransform: "uppercase",
        textShadowColor: "rgba(245,200,66,0.20)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },

    underline: {
        height: 1,
        backgroundColor: "rgba(245,200,66,0.55)",
        borderRadius: 999,
    },
});
