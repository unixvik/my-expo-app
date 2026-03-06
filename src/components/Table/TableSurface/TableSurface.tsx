// src/components/Table/TableSurface/TableSurface.tsx
import React, { memo, useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent, Platform } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { TableRim, TableFelt, TableRail, TableCenterRing, TableShadow, TableGrid } from "./TableLayers";
import { makeTableStyles } from "./tableStyles";
import { useDevice } from "@/hooks/useDevice";
import { scene3d } from "@/theme/scene";

function TableSurfaceImpl() {
    const t = useTheme();
    const [box, setBox] = useState({ w: 0, h: 0 });
    const { isDesktop } = useDevice();

    const onLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((p) => (p.w === width && p.h === height ? p : { w: width, h: height }));
    };

    const s = useMemo(() => makeTableStyles(t, box), [t, box]);

    // Table oval shaping (2D “art direction”)
    const scaleY = 1.2;
    const scaleX = 0.86;
    const skewX = "-20deg";
    const yFix = isDesktop ? -80 : -30;

    // Centralized 3D “camera”
    const P = scene3d.perspective;
    const rx = scene3d.tableTiltX; // degrees
    const ry = scene3d.tableYawY;  // degrees

    return (
        <View style={[styles.root, { backgroundColor: t.semantic.bg }]}>
            <View style={styles.fill} onLayout={onLayout}>
                <View style={styles.centerAbs}>
                    <View
                        style={[
                            styles.tableWrap,
                            {
                                transform: [
                                    // 1) shape the table (2D art direction)
                                    { scaleY },
                                    { scaleX },
                                    { skewX: skewX as any },
                                    { translateY: yFix },

                                    // 2) put it into the shared 3D universe
                                    { perspective: P },
                                    { rotateX: `${rx}deg` as any },
                                    { rotateY: `${ry}deg` as any },
                                ],
                            },
                        ]}
                    >
                        {/* Shadow under table */}
                        <TableShadow style={s.shadow} />

                        {/* Outer rim */}
                        <TableRim style={s.rim} />

                        {/* Felt surface */}
                        <View style={s.surfaceClip}>
                            <TableFelt style={s.felt} />
                            <TableGrid style={s.grid} />
                            <TableCenterRing style={s.centerRing} />
                            <TableRail style={s.rail} />
                        </View>

                        {/* Optional: platform lift */}
                        <View pointerEvents="none" style={Platform.OS === "ios" ? s.iosLift : s.androidLift} />
                    </View>
                </View>
            </View>
        </View>
    );
}

export const TableSurface = memo(TableSurfaceImpl);

const styles = StyleSheet.create({
    root: { flex: 1, zIndex: -1 },
    fill: { flex: 1, opacity: 1 },
    centerAbs: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
    tableWrap: { width: "90%", height: "80%" },
});