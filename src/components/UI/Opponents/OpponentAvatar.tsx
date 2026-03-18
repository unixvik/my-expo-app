import {useAppStyles} from "@/hooks/useAppStyles";
import {useGameStore} from "@/state/useGameStore";
import {View} from "react-native";
import {AppText} from "@/Common/AppText";
import {useRef, useEffect} from "react";
import {registerOpponentRef} from "@/utils/opponentRefs";

interface OpponentInterface{
    playerId: string;
    seat: string;
}
function OpponentAvatar({ playerId, seat }:OpponentInterface) {
    const { theme, styles } = useAppStyles();

    const player = useGameStore((s) => s.server.players[playerId]);
    const isTheirTurn = useGameStore((s) => s.server.currentTurn === playerId);

    const opponentRef = useRef<View>(null);

    useEffect(() => {
        registerOpponentRef(playerId, opponentRef);
    }, [playerId]);

    if (!player) return null;

    const seatStyle = styles[`seat_${seat}` as keyof typeof styles];

    return (
        <View ref={opponentRef} style={[styles.opponentAnchor, seatStyle]}>
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
