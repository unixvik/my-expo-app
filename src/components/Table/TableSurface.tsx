// src/components/Table/TableSurface.tsx
import React from "react";
import { View, StyleSheet, Image } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { SweepRing } from './SweepRing';
import {rnShadow} from "@/state/constants";

const TABLE_IMG        = require('@/assets/images/Layer2-Recovered.png');
const TABLE_RING       = require('@/assets/images/ring.png');
const TABLE_OUTER_RING = require('@/assets/images/RingOver.png');

export const TableSurface = () => {
    return (
        <View pointerEvents="none" style={styles.root}>

            {/* MaskedView clips everything inside to the opaque pixels of TABLE_IMG */}

                {/* Animated sweep */}
                <SweepRing
                    source={TABLE_RING}
                    style={styles.fill}
                    config={{
                        colors: ['rgba(255,34,0,0.54)', 'rgba(255,102,0,0.45)', 'rgba(110,37,25,0.72)'],
                        rotationDuration: 3000,
                        colorDuration:    3000,
                        trailLength:      1,
                        trailSpacing:     10,
                        headOpacity:      0.75,
                        bloom:            true,
                    }}
                />

                {/* Outer ring detail */}
                {/*<Image source={TABLE_OUTER_RING} resizeMode="contain" style={styles.fill} />*/}


            {/* Table surface on top — its transparent oval reveals the rings below */}
            <Image source={TABLE_IMG} resizeMode="contain" style={styles.fill} />

        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        alignItems:     'center',
        justifyContent: 'center',
        // zIndex:         1,
        // overflow:       'hidden',
        // transform: [{scale: 1}]

    },
    fill: {
        position: 'absolute',
        width:    '100%',
        height:   '100%',

    },
});
