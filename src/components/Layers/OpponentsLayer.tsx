import {View} from "react-native";
import {useTheme} from "@/hooks/useTheme";
import {useResponsive} from "@/hooks/useResponsive";
import {useMemo} from "react";
import {createStyles} from "@/components/Screens/GameBoard.styles";
import {getSeatedOpponents} from "@/utils/tableLayout";
import {useGameStore} from "@/state/useGameStore";
import {useSelf} from "@/state/gameSelectors";
import {AppText} from "@/Common/AppText";

export function OpponentsLayer() {
    const theme = useTheme();

    // 🌟 1. Track screen size dynamically
    const { scale, moderateScale, isLandscape } = useResponsive(); // 🌟 One hook for everything

    // 🌟 2. Generate the scale functions for the CURRENT frame
    const styles = useMemo(() =>
            createStyles(theme, scale, moderateScale,isLandscape),
        [theme, scale]
    );

    const me = useSelf();
    const {players, turnOrder, currentTurn} = useGameStore((s) => s.server);
    const myId = me?.id;

    const seatedOpponents = useMemo(() =>
            getSeatedOpponents(turnOrder, myId, players),
        [turnOrder, myId, players]);


    return (

        <View style={styles.opponentsZone} pointerEvents="box-none">
            {seatedOpponents.map((opp) => {
                const isTheirTurn = currentTurn === opp.id;
                const seatStyle = styles[`seat_${opp.seat}` as keyof typeof styles];

                return (
                    <View
                        key={opp.id}
                        style={[styles.opponentAnchor, seatStyle]}
                        pointerEvents="auto"
                    >
                        <View style={[
                            styles.avatarRing,
                            {borderColor: isTheirTurn ? theme.accent : theme.surface}
                        ]}>
                            <AppText style={{fontWeight: '700'}}>
                                {opp.name.substring(0, 2).toUpperCase()}
                            </AppText>
                        </View>
                        {/* 🌟 FIX: Use moderateScale for inline typography */}
                        <AppText variant="primary" style={{fontSize: 10}}>{opp.name}</AppText>
                        <AppText variant="secondary" style={{fontSize: 10}}>🎴 {opp.hand?.length || 0}</AppText>
                    </View>
                );
            })}
        </View>
    )
};