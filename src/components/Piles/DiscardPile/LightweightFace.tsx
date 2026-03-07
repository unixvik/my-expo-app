// src/components/Piles/DiscardPile/LightweightFace.tsx

import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
    w: number;
    h: number;
    r: number;
    rank?: string;
    suit?: string;
};

const isRedSuit = (suit: string) =>
    suit === "♥" || suit === "♦" || suit === "hearts" || suit === "diamonds";

const safeRank = (rank?: string) => (rank && String(rank).trim() ? String(rank) : " ");
const safeSuit = (suit?: string) => (suit && String(suit).trim() ? String(suit) : " ");

export const LightweightFace = memo(function LightweightFace({ w, h, r, rank, suit }: Props) {
    const t = useTheme();

    // Keep things stable & cheap
    const R = Math.max(0, r);
    const bw = Math.max(1, Math.round(w * 0.035));

    const RR = safeRank(rank);
    const SS = safeSuit(suit);

    const textColor = useMemo(() => (isRedSuit(SS) ? "#c62828" : "#111"), [SS]);

    // Theme fallbacks (don’t assume cardFace exists)
    const borderColor = (t as any)?.components?.cardFace?.border ?? (t as any)?.components?.cardFront?.border ?? "rgba(0,0,0,0.35)";
    // const bg = (t as any)?.components?.cardFace?.background ?? (t as any)?.components?.cardFront?.background ?? "#fff";
const bg="#fff";
    // Sizes
    const cornerFont = Math.max(10, Math.round(h * 0.18));
    const suitFont = Math.max(14, Math.round(h * 0.32));

    return (
        <View
            pointerEvents="none"
            style={{
                width: w,
                height: h,
                borderRadius: R,
                borderWidth: bw,
                borderColor,
                backgroundColor: bg,
                overflow: "hidden",
            }}
        >
            {/* Paper-ish vignette */}
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: "rgba(0,0,0,0.06)",
                        borderRadius: R,
                    },
                ]}
            />

            {/* Tiny corner pip (top-left) */}
            <Text
                allowFontScaling={false}
                style={{
                    position: "absolute",
                    top: h * 0.07,
                    left: w * 0.07,
                    fontSize: cornerFont,
                    fontWeight: "800",
                    color: textColor,
                    includeFontPadding: false,
                    textAlignVertical: "center",
                }}
            >
                {RR}
            </Text>

            {/* Tiny corner pip (bottom-right, mirrored) */}
            <Text
                allowFontScaling={false}
                style={{
                    position: "absolute",
                    bottom: h * 0.07,
                    right: w * 0.07,
                    fontSize: cornerFont,
                    fontWeight: "800",
                    color: textColor,
                    includeFontPadding: false,
                    textAlignVertical: "center",
                    transform: [{ rotate: "180deg" }],
                }}
            >
                {RR}
            </Text>

            {/* Center suit */}
            <Text
                allowFontScaling={false}
                style={{
                    position: "absolute",
                    alignSelf: "center",
                    top: h * 0.30,
                    fontSize: suitFont,
                    fontWeight: "700",
                    color: textColor,
                    includeFontPadding: false,
                    textAlign: "center",
                }}
            >
                {SS}
            </Text>

            {/* Rim light */}
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.22)",
                        borderRadius: R,
                    },
                ]}
            />

            {/* Soft sheen */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -h * 0.18,
                    left: -w * 0.2,
                    width: w * 1.6,
                    height: h * 0.35,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    transform: [{ rotate: "-15deg" }],
                }}
            />
        </View>
    );
});