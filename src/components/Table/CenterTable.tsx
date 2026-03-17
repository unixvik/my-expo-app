import React, { useMemo } from 'react';
import { TouchableOpacity, View } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useGameStore } from "@/state/useGameStore";
import { CardFace } from "@/components/Cards/CardFace";
import { DISCARD_OFFSET } from "@/state/constants";
import { convertServerCardToUICard, parseStringCardsToUI } from "@/utils/suitHelper";
import { useAwaitingDraw } from "@/state/gameSelectors";
import { AppText } from "@/Common/AppText";
import { useAnimatedRef } from "react-native-reanimated";
import { useVisualStore } from "@/state/useVisualStore";
import { FannedCardItem } from "@/components/Cards/FannedCardItem";
import { useAppStyles } from "@/hooks/useAppStyles";
import { useGameActions } from "@/hooks/useGameActions";
import { updateLayout } from "@/utils/helpers";

export function CenterTable() {
    const { styles, theme } = useAppStyles();
    const { scale } = useResponsive();

    // Store Selectors
    const discardPile = useGameStore((s) => s.server.discardPile);
    const heldTopDiscardRaw = useGameStore((s) => s.local.heldTopDiscard);
    const offsetSlotCardX = useGameStore((s) => s.local.discardedCards);
    const atuCard = useGameStore((s) => s.server.atuCard);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);

    const { drawCards } = useGameActions();
    const mandatoryDraw = useAwaitingDraw();

    // Visual State
    const flyingCards = useVisualStore(s => s.flyingCards);
    const isClosingFan = useVisualStore((s) => s.isClosingFan);

    // Computed Values
    const mainSlotRaw = heldTopDiscardRaw || (discardPile.length > 0 ? discardPile[discardPile.length - 1] : null);
    const mainSlotCard = mainSlotRaw ? convertServerCardToUICard(mainSlotRaw) : null;
    const offsetSlotCards = useMemo(() => parseStringCardsToUI(offsetSlotCardX), [offsetSlotCardX]);
    const atuCardConverted = useMemo(() =>
            atuCard && atuCard.length > 0 ? convertServerCardToUICard(atuCard[0]) : null,
        [atuCard]
    );

    const discardRef = useAnimatedRef<View>();
    const drawRef = useAnimatedRef<View>();

    return (
        <View style={styles.centerTable}>
            {/* ATU CARD */}
            {atuCardConverted && (
                <View style={[styles.cardSlot, styles.atuSlot]}>
                    <CardFace card={atuCardConverted} />
                </View>
            )}

            {/* DRAW DECK */}
            <TouchableOpacity
                ref={drawRef}
                onLayout={() => updateLayout('deck', drawRef, null)}
                style={[styles.cardSlot, styles.cardSlotDraw]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(false)}
            >
                <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
                <CardFace card={null} isFacedown />
            </TouchableOpacity>

            {/* DISCARD PILE */}
            <TouchableOpacity
                ref={discardRef}
                onLayout={() => updateLayout('discard', discardRef, 1)}
                style={[styles.cardSlot, styles.discardSlot]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(true)}
            >
                <AppText style={styles.slotLabel}>DISCARD</AppText>
                {mainSlotCard ? (
                    <CardFace card={mainSlotCard} />
                ) : (
                    <AppText variant="secondary">Empty</AppText>
                )}

                {/* FANNED DISCARD CARDS */}
                {offsetSlotCards.length > 0 && (
                    offsetSlotCards.map((card, index) => {
                        // Skip if card is still in flight
                        const isFlying = flyingCards.some(f => f.card.id === card.id);
                        if (isFlying) return null;

                        return (
                            <FannedCardItem
                                key={`${card.id}-${index}`}
                                card={card}
                                index={index}
                                isClosing={isClosingFan}
                                // scale={10}
                                styles={styles}
                            />
                        );
                    })
                )}
            </TouchableOpacity>
        </View>
    );
}