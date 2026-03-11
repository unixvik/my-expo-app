import {TouchableOpacity, View} from "react-native";
import {useMemo} from "react";
import {createStyles} from "@/components/Screens/GameBoard.styles";
import {useTheme} from "@/hooks/useTheme";
import {useResponsive} from "@/hooks/useResponsive";
import {useGameStore} from "@/state/useGameStore";
import {GameCard} from "@/components/Cards/GameCard";
import {BASE_CARD_WIDTH} from "@/state/constants";
import {convertServerCardToUICard} from "@/utils/suitHelper";
import {useAwaitingDraw, useSelf} from "@/state/gameSelectors";
import {AppText} from "@/Common/AppText";

export function CenterTable(props: any) {
    const theme = useTheme();

    // 🌟 1. Track screen size dynamically
    const { scale, moderateScale, isLandscape } = useResponsive(); // 🌟 One hook for everything

    // 🌟 2. Generate the scale functions for the CURRENT frame
    const styles = useMemo(() =>
            createStyles(theme, scale, moderateScale,isLandscape),
        [theme, scale]
    );


    const discardPile = useGameStore((s) => s.server.discardPile);

    const topDiscardRaw = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
    const topDiscard = topDiscardRaw ? convertServerCardToUICard(topDiscardRaw) : null;

    const atuCard = useGameStore((s) => s.server.atuCard);
    const mandatoryDraw = useAwaitingDraw();
    const drawCards = useGameStore((s) => s.drawCards);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);

    return(

    <View style={styles.centerTable}>

        {/* ATU UNDERNEATH */}
        {atuCard && atuCard.length > 0 && (
            <View style={[styles.cardSlot, styles.atuSlot]}>
                <GameCard card={convertServerCardToUICard(atuCard[0])} cardWidth={BASE_CARD_WIDTH} />
            </View>
        )}

        {/* DRAW PILE */}
        <TouchableOpacity
            style={styles.cardSlotDraw}
            disabled={!mandatoryDraw}
            onPress={() => drawCards(false)}
        >
            <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
            <GameCard isFacedown cardWidth={BASE_CARD_WIDTH} />
        </TouchableOpacity>

        {/* DISCARD PILE */}
        <TouchableOpacity
            style={[styles.cardSlot, styles.discardSlot]}
            disabled={!mandatoryDraw}
            onPress={() => drawCards(true)}
        >
            <AppText style={styles.slotLabel}>DISCARD</AppText>
            {topDiscard ? (
                <GameCard card={topDiscard} cardWidth={BASE_CARD_WIDTH} />
            ) : (
                <AppText variant="secondary">Empty</AppText>
            )}
        </TouchableOpacity>
    </View>
    );
}