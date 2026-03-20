import React, {useMemo, useRef} from 'react';
import {useTheme} from '@/hooks/useTheme';
import {createStyles} from './GameBoard.styles';
import {TableSurface} from "@/components/Table/TableSurface";
import {useResponsive} from "@/hooks/useResponsive";
import {CenterTable} from "@/components/Table/CenterTable";
import {OpponentsLayer} from "@/components/UI/Opponents/OpponentsLayer";
import {PlayerLayer} from "@/components/UI/Player/PlayerLayer";
import {ImageBackground, StyleSheet, View} from "react-native";
import {DebugTrajectory} from "@/components/Dev/DebugTrajectory";
import {FlightOverlay} from "@/components/Dev/FlightOverlay";
import DebugFlightSpawner from "@/components/Dev/DebugFlightSpawner";
import {getSceneTransform} from "@/utils/helpers";
import {GameStatusOverlay} from "@/components/Dev/GameStatusOverlay";
import {Background} from "@/components/Overlays/Background";
import Video from "react-native-video";

export const GameBoard = () => {
    const theme = useTheme();

    // 🌟 1. Track screen size dynamically
    const {scale, moderateScale, isLandscape} = useResponsive(); // 🌟 One hook for everything

    // 🌟 2. Generate the scale functions for the CURRENT frame
    const styles = useMemo(() =>
            createStyles(theme, scale, moderateScale, isLandscape),
        [theme, scale]
    );

    return (
        <View style={styles.board}>

            {/*<GameStatusOverlay/>*/}
            <DebugTrajectory/>
            <FlightOverlay/>
            <DebugFlightSpawner/>
            {/* 🌟 THE FIX: The 2D Container traps the 3D math */}
            {/*<Background/>*/}


            <PlayerLayer/>

            <ImageBackground
                source={require('@/assets/images/background.png')}

                style={[StyleSheet.absoluteFillObject, {zIndex:3,  transform: [ { rotateX: "0deg"}]}]}
            />
            <ImageBackground
                source={require('@/assets/images/smoke.png')}

                style={[StyleSheet.absoluteFillObject, {zIndex:7, opacity:0.6,  transform: [ { rotateX: "0deg"}]}]}
                imageStyle={{tintColor: "rgba(213,0,75,0.72)",opacity: 0.3 }}
            />



            <View style={styles.tableContainer}>

                {/* 1. THE 3D ENVIRONMENT */}
                <View style={[
                    // {transform: getSceneTransform()},
                    isLandscape && {flex: 1}
                ]}>
                    <View style={styles.tableArea}>
                        {/*TABLE Surface*/}


                        <TableSurface/>
                        {/*CENTER TABLE*/}


                    </View>
                </View>
            </View>
            {/* 2. OPPONENTS LAYER */}
            <OpponentsLayer/>
            {/* 3. PLAYER ZONE */}


        </View>
    );
};