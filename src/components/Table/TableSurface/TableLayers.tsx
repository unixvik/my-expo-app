// src/components/Table/TableSurface/TableLayers.tsx
import React, { memo } from "react";
import {View, StyleSheet, ViewStyle, ImageBackground, Platform} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const TableShadow = memo(function TableShadow({ style }: { style: ViewStyle }) {
    return <View pointerEvents="none" style={style} />;
});

export const TableRim = memo(function TableRim({ style }: { style: ViewStyle }) {
    return (
        <LinearGradient
            pointerEvents="none"
            colors={(style as any).rimGradient}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={style}
        />
    );
});

export const TableFelt = memo(function TableFelt({ style }: { style: ViewStyle }) {
    // we pass surfaceGradient in style to avoid prop-sprawl
    return (
        <LinearGradient
            pointerEvents="none"
            colors={(style as any).surfaceGradient}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 0.95 }}
            style={style}
        />
    );
});

export const TableRail = memo(function TableRail({ style }: { style: ViewStyle }) {
    return <View pointerEvents="none" style={style} />;
});

export const TableCenterRing = memo(function TableCenterRing({ style }: { style: ViewStyle }) {
    return <View pointerEvents="none" style={style} />;
});

// cheap grid approximation (HTML used repeating gradients)
export const TableGrid = memo(function TableGrid({ style }: { style: ViewStyle }) {
    return (
        <>
            <ImageBackground
                source={require('@/assets/images/table_bg.png')}
                imageStyle={Platform.select({
                    ios: { resizeMode: 'repeat' },
                    android: { resizeMode: 'repeat' },
                    web: {
                        // CSS Fallback for Web
                        backgroundImage: `url(${require('@/assets/images/table_bg.png')})`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: 'cover',

                    }
                })}
                style={{ flex: 1,opacity: 0.36 }}
            />
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
            {/* horizontal */}
            <View style={[styles.gridLine, { top: "18%" }]} />
            <View style={[styles.gridLine, { top: "36%" }]} />
            <View style={[styles.gridLine, { top: "54%" }]} />
            <View style={[styles.gridLine, { top: "72%" }]} />
            {/* vertical */}
            <View style={[styles.gridV, { left: "18%" }]} />
            <View style={[styles.gridV, { left: "36%" }]} />
            <View style={[styles.gridV, { left: "54%" }]} />
            <View style={[styles.gridV, { left: "72%" }]} />
        </View>
        </>
    );
});

const styles = StyleSheet.create({
    gridLine: { position: "absolute", left: 10, right: 0, height: 1 },
    gridV: { position: "absolute", top: 0, bottom: 0, width: 1 },
});
