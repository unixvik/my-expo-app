// src/components/Table/TableSurface.tsx
import React from "react";
import { View, StyleSheet, ImageBackground, Image } from "react-native";
import { AnimatedRing } from './AnimatedRing';

const TABLE_IMG      = require('@/assets/images/Layer2.png');
const TABLE_RING     = require('@/assets/images/ring.png');
const TABLE_RING_OVER = require('@/assets/images/RingOver.png');
const  TABLE_TOP = require('@/assets/images/TableTop.png');

export const TableSurface = () => {
    return (
        <View pointerEvents="none" style={styles.root}>
            {/*<AnimatedRing source={TABLE_RING} style={styles.fill} />*/}
            {/* ── DROP SHADOW (tinted copies of the table, offset down) ─── */}
            <Image source={TABLE_IMG} resizeMode="contain"
                style={[styles.fill]} />
            <Image source={TABLE_RING} resizeMode="contain"
                   style={[styles.fill]} />
            <Image source={TABLE_RING_OVER} resizeMode="contain"
                style={[styles.fill]} />



        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          -1,
    },
    fill: {
        position: 'absolute',
        width:    '100%',
        height:   '100%',
    },
});
