import React, {useMemo} from 'react';
import {useTheme} from '@/hooks/useTheme';
import {createStyles} from './GameBoard.styles';
import {TableSurface} from "@/components/Table/TableSurface";
import {useResponsive} from "@/hooks/useResponsive";
import {CenterTable} from "@/components/Table/CenterTable";
import {OpponentsLayer} from "@/components/UI/Opponents/OpponentsLayer";
import {PlayerLayer} from "@/components/UI/Player/PlayerLayer";
import {View} from "react-native";
import {DebugTrajectory} from "@/components/Dev/DebugTrajectory";
import {FlightOverlay} from "@/components/Dev/FlightOverlay";
import DebugFlightSpawner from "@/components/Dev/DebugFlightSpawner";
import {getSceneTransform} from "@/utils/helpers";
import {GameStatusOverlay} from "@/components/Dev/GameStatusOverlay";

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
            <GameStatusOverlay/>
            {/*<DebugTrajectory/>*/}
            <FlightOverlay/>
            <DebugFlightSpawner/>
            {/* 🌟 THE FIX: The 2D Container traps the 3D math */}
            <View style={styles.tableContainer}>
                {/* 1. THE 3D ENVIRONMENT */}
                <View style={[
                    {transform: getSceneTransform()},
                    isLandscape && {flex: 1}
                ]}>
                    <View style={styles.tableArea}>
                        {/*TABLE Surface*/}
                        <TableSurface/>

                        {/*CENTER TABLE*/}
                        <CenterTable/>

                    </View>
                </View>
            </View>
            {/* 2. OPPONENTS LAYER */}
            <OpponentsLayer/>
            {/* 3. PLAYER ZONE */}
            <PlayerLayer/>

        </View>
    );
};