// src/components/Player/PlayerCards.tsx
import React, { useMemo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { shallowEqual, useGameSelector } from "@/state/machine/useGameSelector";
import { useDevice } from "@/hooks/useDevice";
import { AnimatedCard } from "./AnimatedCard";
import { usePlayerCardFan } from "@/components/Player/hooks/usePlayerCardFan";
import { useCardsLogic } from "@/components/Player/hooks/useCardsLogic";
import DiscardButton from "@/components/Buttons/DiscardButton";
import { selectCanDiscard, selectPlayerCards } from "@/state/machine/selector";
export function PlayerCards() {
    const { isDesktop } = useDevice();
    const playerCards = useGameSelector(selectPlayerCards, shallowEqual);
    const canDiscard = useGameSelector(selectCanDiscard);

    const {
        onCardPress,
        selectedIds,
        handleDiscard,
        pendingDiscardIds,
        registerCardRect,
    } = useCardsLogic(playerCards);

    const fanPositions = usePlayerCardFan(playerCards.length);
    const handMul = isDesktop ? 0.75 : 0.8;

    return (
        <View className="flex-row items-center justify-center" style={styles.cardsArea} pointerEvents="box-none">
            {canDiscard ? (
                <DiscardButton selectedCount={selectedIds.size} handleDiscard={handleDiscard} />
            ) : null}

            {playerCards.map((card, index) => {
                const position = fanPositions[index];
                if (!position) return null;

                return (
                    <AnimatedCard
                        key={card.id}
                        card={card}
                        handMul={handMul}
                        fanPosition={position}
                        onCardPress={onCardPress}
                        isSelected={selectedIds.has(card.id)}
                        isDiscarding={pendingDiscardIds.has(card.id)}
                        onCardRect={registerCardRect}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    cardsArea: {
        position: "absolute",
        left: 0,
        right: 0,
        overflow: "visible",
        zIndex: 1,
    },
    hidden: { opacity: 0 },
});