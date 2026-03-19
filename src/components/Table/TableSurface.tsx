// src/components/Table/TableSurface.tsx
import React, { memo } from "react";
import { View, StyleSheet, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

export const TableSurface = () => {
    const theme = useTheme();
    return (
        <View pointerEvents="none" style={styles.root}>
            <ImageBackground
                source={require('@/assets/images/Layer2.png')}
                // 'contain' ensures the altar doesn't warp its circle shape
                resizeMode="contain"
                style={styles.image}
            />
        </View>
    );
};
const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
    image: {
        width: '100%', // Control the size relative to the 3D container
        height: '100%',
    },
});