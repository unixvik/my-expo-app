import {useAppStyles} from "@/hooks/useAppStyles";
import {useGameStore} from "@/state/useGameStore";
import {View} from "react-native";
import {AppText} from "@/Common/AppText";
import {useAnimatedRef} from "react-native-reanimated";
import {updateLayout} from "@/utils/helpers";



interface OpponentInterface{
    playerId: string;
    seat: string;
}
function OpponentAvatar({ playerId, seat }:OpponentInterface) {
    const { theme, styles } = useAppStyles();

    // SELECTOR CRITIC: Ascultă DOAR acest jucător
    const player = useGameStore((s) => s.server.players[playerId]);
    const isTheirTurn = useGameStore((s) => s.server.currentTurn === playerId);

    const opponentRef = useAnimatedRef<View>();



    if (!player) return null;

    const seatStyle = styles[`seat_${seat}` as keyof typeof styles];

    return (
        <View style={[styles.opponentAnchor, seatStyle]}>
            <View style={[
                styles.avatarRing,
                { borderColor: isTheirTurn ? theme.accent : theme.surface }
            ]}>
                <AppText style={{ fontWeight: '700' }}>
                    {player.name.substring(0, 2).toUpperCase()}
                </AppText>
            </View>
            <AppText variant="primary" style={{ fontSize: 10 }}>{player.name}</AppText>
            <AppText variant="secondary" style={{ fontSize: 10 }}>
                🎴 {player.hand?.length || 0}
            </AppText>
        </View>
    );
}

export default OpponentAvatar
