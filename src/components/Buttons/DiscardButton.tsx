import {TouchableOpacity, ViewProps} from "react-native";
import Animated, {FadeInDown, FadeOutUp, LinearTransition} from "react-native-reanimated";
import {spawnDiscardFlight} from "@/utils/spawnDiscardFlight";
import {AppText} from "@/Common/AppText";
import React, {useMemo} from "react";
import {useTheme} from "@/hooks/useTheme";
import {useResponsive} from "@/hooks/useResponsive";
import {createStyles} from "@/components/Screens/GameBoard.styles";
import {useAwaitingDraw, useSelf} from "@/state/gameSelectors";
import {useGameStore} from "@/state/useGameStore";
import {useVisualStore} from "@/state/useVisualStore";
import {CardData} from "@/types/game";

interface DiscardButtonProps {
    styles: any;
    myId: string | undefined;
    hand: CardData[];
}

export const DiscardButton = ({ styles, myId, hand }: DiscardButtonProps) => {
    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds || []);
    const clearSelection = useGameStore((s) => s.clearSelection);
    const discardCards = useGameStore((s) => s.discardCards);
    const discardLayout = useVisualStore((s) => s.layouts.discard);
    const handPositions = useVisualStore((s) => s.layouts.player);
    const spawnFlyingCard = useVisualStore((s) => s.spawnFlyingCard);
    const currentTurn = useGameStore((s) => s.server.currentTurn);
    const mandatoryDraw = useAwaitingDraw();

    const myTurn = currentTurn === myId;
    if (selectedDiscardIds.length === 0 || !myTurn || mandatoryDraw) {
        return null;
    }

    return (
        <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.discardButton}>
            <TouchableOpacity
                onPress={() => {

                    if (discardLayout) {
                        console.log(discardLayout);
                        spawnDiscardFlight({
                            selectedDiscardIds,
                            hand: hand,
                            handPositions,
                            discardLayout,
                            spawnFlyingCard
                        });
                    }
                    discardCards(selectedDiscardIds);
                    clearSelection();
                }}
            >
                <AppText style={styles.actionText}>
                    DISCARD {selectedDiscardIds.length} {selectedDiscardIds.length === 1 ? 'CARD' : 'CARDS'}
                </AppText>
            </TouchableOpacity>
        </Animated.View>
    );
};