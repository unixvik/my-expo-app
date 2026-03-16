import React, {useMemo} from 'react';
import {TouchableOpacity, View} from "react-native";
import {useResponsive} from "@/hooks/useResponsive";
import {useGameStore} from "@/state/useGameStore";
import {GameCard} from "@/components/Cards/GameCard";
import {BASE_CARD_WIDTH, DISCARD_OFFSET} from "@/state/constants";
import {convertServerCardToUICard, parseStringCardsToUI} from "@/utils/suitHelper";
import {useAwaitingDraw} from "@/state/gameSelectors";
import {AppText} from "@/Common/AppText";
import {measure, useAnimatedRef} from "react-native-reanimated";
import {useVisualStore} from "@/state/useVisualStore";
import {FannedCardItem} from "@/components/Cards/FannedCardItem";
import {useAppStyles} from "@/hooks/useAppStyles";
import {useGameActions} from "@/hooks/useGameActions";
import {updateLayout} from "@/utils/helpers";

export function CenterTable() {
    const {styles, theme} = useAppStyles();
    const {scale, moderateScale, isLandscape} = useResponsive();

    // Store Selectors
    const discardPile = useGameStore((s) => s.server.discardPile);
    const heldTopDiscardRaw = useGameStore((s) => s.local.heldTopDiscard);
    const offsetSlotCardX = useGameStore((s) => s.local.discardedCards);
    const {drawCards} = useGameActions();
    //
    // // Animation State
    const mainSlotRaw = heldTopDiscardRaw || (discardPile.length > 0 ? discardPile[discardPile.length - 1] : null);
    const mainSlotCard = mainSlotRaw ? convertServerCardToUICard(mainSlotRaw) : null;
    const offsetSlotCards = useMemo(() => parseStringCardsToUI(offsetSlotCardX), [offsetSlotCardX]);
    //
    const atuCard = useGameStore((s) => s.server.atuCard);
    const mandatoryDraw = useAwaitingDraw();
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);
    const flyingCards = useVisualStore(s => s.flyingCards);
    //

    const discardRef = useAnimatedRef<View>();
    const drawRef = useAnimatedRef<View>();

    const isClosingFan = useVisualStore((s) => s.isClosingFan);

    return (
        <View style={styles.centerTable}>
            {/* ATU */}
            {atuCard && atuCard.length > 0 && (
                <View style={[styles.cardSlot, styles.atuSlot]}>
                    <GameCard card={convertServerCardToUICard(atuCard[0])} cardWidth={BASE_CARD_WIDTH}
                              style={styles.tableCardArtwork}/>
                </View>
            )}

            {/*/!* DECK *!/*/}
            <TouchableOpacity
                ref={drawRef}
                onLayout={() => updateLayout('deck', drawRef, null)}
                style={[styles.cardSlot, styles.cardSlotDraw]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(false)} // false = draw from Deck
            >
                <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
                <GameCard card={null} isFacedown cardWidth={BASE_CARD_WIDTH} style={styles.tableCardArtwork}/>
            </TouchableOpacity>


            <TouchableOpacity
                ref={discardRef}
                onLayout={() => updateLayout('discard',discardRef,null)}
                style={[styles.cardSlot, styles.discardSlot]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(true)} // true = draw from Discard
            >
                <AppText style={styles.slotLabel}>DISCARD</AppText>
                {mainSlotCard ? (
                    <GameCard card={mainSlotCard} cardWidth={BASE_CARD_WIDTH} style={styles.tableCardArtwork}/>
                ) : (
                    <AppText variant="secondary">Empty</AppText>
                )}

                {/* 🌟 SCALABLE ANIMATED FAN SLOT */}
                {offsetSlotCards.length > 0 && (
                    offsetSlotCards.map((card, index) => {
                        // Check if THIS specific card is still flying
                        const isFlying = flyingCards.some(f => f.card.id === card.id);

                        // If it is still in the air, do not render the static version yet
                        if (isFlying) return null;

                        return (
                            <FannedCardItem
                                key={`${card.id}-${index}`}
                                card={card}
                                index={index}
                                isClosing={isClosingFan}
                                scale={scale}
                                styles={styles}
                            />
                        );
                    })
                )}
            </TouchableOpacity>
        </View>
    );
}