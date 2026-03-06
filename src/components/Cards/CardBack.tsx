// src/components/Cards/CardBack.native.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCardSize } from "@/hooks/useCardSize";
import { tokens, rnShadow } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";
import { useDevice } from "@/hooks/useDevice";

type Props = {
    isMini?: boolean;
    scaleMul?: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const CardBack = React.memo(function CardBack({ isMini = false, scaleMul = 1 }: Props) {
    const t = useTheme();
    const { CARD_W, CARD_H, CARD_RADIUS, SCALE } = useCardSize();
    const { isDesktop } = useDevice();
    if (isDesktop) scaleMul = 1;

    const s = clamp(SCALE * scaleMul, 0.9, 1.25);

    const miniW = Math.round(28 * s);
    const miniH = Math.round(36 * s);
    const miniR = Math.max(3, Math.round(4 * s));

    const fullW = Math.round(CARD_W * scaleMul);
    const fullH = Math.round(CARD_H * scaleMul);
    const fullR = Math.max(0, Math.round(CARD_RADIUS * scaleMul));

    const size = isMini
        ? { width: miniW, height: miniH, borderRadius: miniR }
        : { width: fullW, height: fullH, borderRadius: fullR };

    const borderW       = Math.max(1, Math.round(2.6 * s));
    const innerInsetPct = isMini ? 0.085 : 0.055;
    const innerRadius   = Math.max(0, Math.round(size.borderRadius - borderW - 1));

    const stripeCount = isMini ? 0 : 12;
    const stripeStep  = Math.max(5, Math.round(10 * s));
    const stripeH     = Math.max(1, Math.round(4 * s));
    const stripes     = useMemo(() => Array.from({ length: stripeCount }), [stripeCount]);

    // ── Scaled effect values ─────────────────────────────────────────────────
    const emblemFontSize    = Math.round(22 * s);
    const emblemFrameRadius = Math.round(10 * s);
    const emblemFrameBorder = Math.max(1, Math.round(1 * s));

    // Specular band: position/size as percentages are fine,
    // but rotation and thickness are fixed — scale thickness via height
    const specularHeight = `${22 * s}%` as any;  // wider band on larger cards

    // Rim light border thickness
    const rimBorderW  = Math.max(1, Math.round(1.5 * s));
    const innerRimBorderW = Math.max(1, Math.round(1 * s));

    // ── Theme tokens ─────────────────────────────────────────────────────────
    const backTop     = t.components.cardBack.top;
    const backBottom  = t.components.cardBack.bottom;
    const backBorder  = t.components.cardBack.border;
    const backPattern = t.components.cardBack.pattern;
    const backEmblem  = t.components.cardBack.emblem;
    const drawGlow    = t.components.piles.drawGlow;
    const backShadow  = isMini ? null : rnShadow(tokens.shadow.contact);

    return (
        <View
            pointerEvents="none"
            style={[
                styles.base,
                {
                    width:        size.width,
                    height:       size.height,
                    borderRadius: size.borderRadius,
                    borderWidth:  borderW,
                    borderColor:  isMini ? drawGlow : backBorder,
                    backgroundColor: t.semantic.bg,
                },
                backShadow as any,
            ]}
        >
            {/* Background gradient */}
            <LinearGradient
                colors={isMini ? ([backBottom, backTop] as any) : ([backTop, backBottom] as any)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: size.borderRadius }]}
            />

            {/* Inner vignette */}
            <View
                pointerEvents="none"
                style={[
                    styles.innerShade,
                    { borderRadius: size.borderRadius, backgroundColor: "rgba(0,0,0,0.12)" },
                ]}
            />

            {/* Inner pattern panel */}
            {!isMini && (
                <View
                    pointerEvents="none"
                    style={[
                        styles.patternWrapper,
                        {
                            left:         `${innerInsetPct * 100}%`,
                            top:          `${innerInsetPct * 100}%`,
                            width:        `${(1 - innerInsetPct * 2) * 100}%`,
                            height:       `${(1 - innerInsetPct * 2) * 100}%`,
                            borderRadius: innerRadius,
                        },
                    ]}
                >
                    <View style={[styles.pattern, { borderRadius: innerRadius, backgroundColor: "rgba(0,0,0,0.10)" }]}>
                        {stripes.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.stripe,
                                    {
                                        top:             i * stripeStep,
                                        height:          stripeH,
                                        backgroundColor: backPattern,
                                        opacity:         0.16,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Inner rim */}
                    <View
                        pointerEvents="none"
                        style={[
                            styles.innerRim,
                            {
                                borderRadius: innerRadius,
                                borderColor:  backPattern,
                                borderWidth:  innerRimBorderW, // ✅ scaled
                                opacity:      0.22,
                            },
                        ]}
                    />
                </View>
            )}

            {/* Center emblem */}
            {!isMini && (
                <View pointerEvents="none" style={styles.emblemWrap}>
                    <View
                        style={[
                            styles.emblemFrame,
                            {
                                borderColor:  backPattern,
                                borderRadius: emblemFrameRadius,  // ✅ scaled
                                borderWidth:  emblemFrameBorder,  // ✅ scaled
                                opacity:      0.18,
                            },
                        ]}
                    />
                    <Text
                        allowFontScaling={false}
                        style={[
                            styles.emblemText,
                            {
                                color:    backEmblem,
                                fontSize: emblemFontSize,          // ✅ scaled
                                opacity:  0.38,
                                ...(Platform.OS === "ios"
                                    ? { fontFamily: "Avenir Next" }
                                    : { fontFamily: "sans-serif-condensed" }),
                            },
                        ]}
                    >
                        ◆
                    </Text>
                </View>
            )}

            {/* Rim light */}
            <View
                pointerEvents="none"
                style={[
                    styles.rimLight,
                    {
                        borderRadius: size.borderRadius,
                        borderWidth:  rimBorderW,                 // ✅ scaled
                        borderColor:  "rgba(255,255,255,0.14)",
                    },
                ]}
            />

            {/* Specular band */}
            <View
                pointerEvents="none"
                style={[
                    styles.specularBand,
                    {
                        borderRadius:    size.borderRadius,
                        height:          specularHeight,          // ✅ scaled
                        backgroundColor: "rgba(255,255,255,0.10)",
                        opacity:         0.38,
                    },
                ]}
            />

            {/* Sheen */}
            <View
                pointerEvents="none"
                style={[
                    styles.sheen,
                    {
                        borderRadius:    size.borderRadius,
                        backgroundColor: "rgba(255,255,255,0.02)",
                    },
                ]}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    base: {
        overflow: "hidden",
    },
    innerShade: {
        ...StyleSheet.absoluteFillObject,
    },
    patternWrapper: {
        position: "absolute",
        overflow: "hidden",
    },
    pattern: {
        flex: 1,
    },
    stripe: {
        position: "absolute",
        left:      "-50%",
        width:     "200%",
        transform: [{ rotate: "45deg" }],
    },
    innerRim: {
        ...StyleSheet.absoluteFillObject,
        // borderWidth moved to inline — scaled per instance
    },
    emblemWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems:     "center",
        justifyContent: "center",
    },
    emblemFrame: {
        position: "absolute",
        width:    "62%",
        height:   "44%",
        // borderRadius + borderWidth moved to inline — scaled per instance
    },
    emblemText: {
        // fontSize moved to inline — scaled per instance
        fontWeight:    "900",
        letterSpacing: 2,
    },
    rimLight: {
        ...StyleSheet.absoluteFillObject,
        // borderWidth moved to inline — scaled per instance
    },
    specularBand: {
        position:  "absolute",
        top:       "10%",
        left:      "-35%",
        width:     "120%",
        // height moved to inline — scaled per instance
        transform: [{ rotate: "-12deg" }],
    },
    sheen: {
        ...StyleSheet.absoluteFillObject,
    },
});