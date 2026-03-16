import {View} from "react-native";
import {useMemo} from "react";
import {getSeatedOpponents} from "@/utils/tableLayout";
import {useGameStore} from "@/state/useGameStore";
import {useSelf} from "@/state/gameSelectors";
import {useAppStyles} from "@/hooks/useAppStyles";
import OpponentAvatar from "@/components/UI/Opponents/OpponentAvatar";

export function OpponentsLayer() {
    const { styles } = useAppStyles();
    const myId = useSelf()?.id;
    const turnOrder = useGameStore((s) => s.server.turnOrder);

    const seatedOpponentIds = useMemo(() =>
            getSeatedOpponents(turnOrder, myId), // Modifică funcția să returneze doar ID-uri și seat
        [turnOrder, myId]);

    return (
        <View style={styles.opponentsZone} pointerEvents="box-none">
            {seatedOpponentIds.map((opp) => (
                <OpponentAvatar
                    key={opp.id}
                    playerId={opp.id}
                    seat={opp.seat}
                />
            ))}
        </View>
    );
}