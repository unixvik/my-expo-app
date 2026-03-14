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
    currentTurn: string | undefined;
    mandatoryDraw: boolean;
    hand: CardData[];
}

export const DiscardButton = ({ styles, myId, currentTurn, mandatoryDraw, hand }: DiscardButtonProps) => {
    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds || []);
    const clearSelection = useGameStore((s) => s.clearSelection);
    const discardCards = useGameStore((s) => s.discardCards);
    const discardLayout = useGameStore((s) => s.discardLayout);
    const handPositions = useGameStore((s) => s.handPositions);
    const spawnFlyingCard = useVisualStore((s) => s.spawnFlyingCard);

    if (selectedDiscardIds.length === 0 || currentTurn !== myId || mandatoryDraw) {
        return null;
    }

    return (
        <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.discardButton}>
            <TouchableOpacity
                onPress={() => {
                    if (discardLayout) {
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