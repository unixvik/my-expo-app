import React, {useMemo} from 'react';
import {TouchableOpacity, View, StyleSheet} from "react-native";
import {useResponsive} from "@/hooks/useResponsive";
import {useGameStore} from "@/state/useGameStore";
import {CardFace} from "@/components/Cards/CardFace";
import {DISCARD_OFFSET} from "@/state/constants";
import {convertServerCardToUICard, parseStringCardsToUI} from "@/utils/suitHelper";
import {useAwaitingDraw} from "@/state/gameSelectors";
import {AppText} from "@/Common/AppText";
import {useAnimatedRef} from "react-native-reanimated";
import {useVisualStore} from "@/state/useVisualStore";
import {FannedCardItem} from "@/components/Cards/FannedCardItem";
import {useAppStyles} from "@/hooks/useAppStyles";
import {useGameActions} from "@/hooks/useGameActions";
import {updateLayout} from "@/utils/helpers";

// Static offsets that give the illusion of a messy thrown pile
const PILE_LAYERS = [
    {x: -8, y: 3, r: -9},
    {x: 9, y: -2, r: 13},
    {x: -11, y: 4, r: -6},
];

export function CenterTable() {
    const {styles, theme} = useAppStyles();
    const {scale} = useResponsive();

    // Store Selectors
    const discardPile = useGameStore((s) => s.server.discardPile);
    const heldTopDiscardRaw = useGameStore((s) => s.local.heldTopDiscard);
    const offsetSlotCards = useGameStore((s) => s.local.discardedCards);
    const atuCard = useGameStore((s) => s.server.atuCard);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);
    const cardsDiscarded = useGameStore((s) => s.server.cardsDiscarded);
// console.log(atuCard[0].id);
    const {drawCards} = useGameActions();
    const mandatoryDraw = useAwaitingDraw();

    // Visual State
    const flyingCards = useVisualStore(s => s.flyingCards);
    const isClosingFan = useVisualStore((s) => s.isClosingFan);

    // Computed Values
    const mainSlotRaw = heldTopDiscardRaw || (discardPile.length > 0 ? discardPile[discardPile.length - 1] : null);
    // const mainSlotCard = mainSlotRaw ? convertServerCardToUICard(mainSlotRaw) : null;
    // const offsetSlotCards = useMemo(() => parseStringCardsToUI(offsetSlotCardX), [offsetSlotCardX]);
    // const atuCardConverted = useMemo(() =>
    //         atuCard && atuCard.length > 0 ? convertServerCardToUICard(atuCard[0]) : null,
    //     [atuCard]
    // );
// console.log(mainSlotRaw);
    const discardRef = useAnimatedRef<View>();
    const drawRef = useAnimatedRef<View>();


    return (
        <View style={styles.centerTable}>
            {/* ATU CARD */}
            {atuCard && (
                <View style={[styles.atuSlot]}>
                    <CardFace cardId={atuCard[0].id}/>
                </View>
            )}

            {/* DRAW DECK */}
            <TouchableOpacity
                ref={drawRef}
                onLayout={() => updateLayout('deck', drawRef, null)}
                style={[styles.cardSlotDraw]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(false)}
            >
                <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
                <CardFace cardId={null} isFacedown/>
            </TouchableOpacity>

            {/* DISCARD PILE */}
            <TouchableOpacity

                style={[styles.discardSlot]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(true)}
            >
                <AppText style={styles.slotLabel}>DISCARD</AppText>

                {/* Card stack: pile layers + top card in a shared relative container */}
                <View style={{flex: 1, width: '100%'}}>
                    {/* Pile depth — only visible once more than 1 card has been discarded */}
                    {cardsDiscarded > 1 && PILE_LAYERS.map((layer, i) => {

                        const cardRaw = discardPile[discardPile.length - 2 - i];

                        if (!cardRaw) return null;
                        // const card = convertServerCardToUICard(cardRaw);
                        return (
                            <View key={i} style={[StyleSheet.absoluteFill, {
                                // transform: [{ translateX: layer.x }, { translateY: layer.y }, { rotateZ: `${layer.r}deg` }],
                                zIndex: i,
                            }]}>
                                <CardFace cardId={cardRaw.id}/>
                            </View>
                        );
                    })}

                    {/* Top card */}
                    <View style={[StyleSheet.absoluteFill, {zIndex: 10}]}>
                        {mainSlotRaw ? (
                            <CardFace cardId={mainSlotRaw.id}/>
                        ) : (
                            <AppText variant="secondary">Empty</AppText>
                        )}
                    </View>
                </View>
                <View style={{flex:1, width:"100%",height:"100%", position: "absolute" }} ref={discardRef}
                      onLayout={() => updateLayout('discard', discardRef, 1)}>
                    {/* FANNED DISCARD CARDS */}
                    {offsetSlotCards.length > 0 && (

                        offsetSlotCards.map((card, index) => {
                            const isFlying = flyingCards.some(f => f.card === card);

                            if (isFlying) return null;
                            return (
                                <FannedCardItem

                                    key={`${card}-${index}`}
                                    card={card}
                                    index={index}
                                    isClosing={isClosingFan}
                                    // scale={10}
                                    styles={styles}/>
                            );
                        })
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
}