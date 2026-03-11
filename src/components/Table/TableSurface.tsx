// src/components/Table/TableSurface.tsx
import React, { memo } from "react";
import { View, StyleSheet, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

export const TableSurface = () => {
    const theme = useTheme();
    return (
        <View pointerEvents="none" style={styles.root}>
            {/* base felt */}
            <LinearGradient
                // colors={["#1f6b4a", "#1a5d41", "#134232"]}
                colors={(theme as any).table.surfaceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* center light */}
            <LinearGradient
                colors={[
                    "rgba(255,255,255,0.12)",
                    "rgba(255,255,255,0.05)",
                    "transparent"
                ]}
                start={{ x: 0.5, y: 0.2 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* edge vignette */}
            <LinearGradient
                colors={[
                    "rgba(0,0,0,0.35)",
                    "transparent",
                    "transparent",
                    "rgba(0,0,0,0.35)"
                ]}
                locations={[0, 0.35, 0.65, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* felt texture */}
            <ImageBackground
                source={require("@/assets/images/table_bg.png")}
                resizeMode="repeat"
                style={[StyleSheet.absoluteFillObject, { opacity: 0.2 }]}
            />

        </View>
    );
};
const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",

    },

    tableClip: {

        aspectRatio: 1.035,   // oval table
        borderRadius: 9999,  // makes it round/oval
        overflow: "hidden",
    },
    gridV: { position: "absolute", top: 0, bottom: 0, width: 1 },
    gridLine: { position: "absolute", left: 10, right: 0, height: 1 },
});