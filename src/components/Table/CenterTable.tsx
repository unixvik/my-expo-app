import React, {useMemo} from 'react';
import {TouchableOpacity, View, StyleSheet} from "react-native";
import {useResponsive} from "@/hooks/useResponsive";
import {useGameStore} from "@/state/useGameStore";
import {CardFace} from "@/components/Cards/CardFace";
import {DISCARD_OFFSET, BASE_CARD_WIDTH, CENTER_TABLE_CARD_SCALE} from "@/state/constants";
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
    const centerCardWidth = BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE;

    // Store Selectors
    const discardPile = useGameStore((s) => s.server.discardPile);
    const heldTopDiscardRaw = useGameStore((s) => s.local.heldTopDiscard);
    const offsetSlotCards = useGameStore((s) => s.local.discardedCards);
    const atuCard = useGameStore((s) => s.server.atuCard);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);
    const cardsDiscarded = useGameStore((s) => s.server.cardsDiscarded);

    const {drawCards} = useGameActions();
    const mandatoryDraw = useAwaitingDraw();

    // Visual State
    const flyingCards = useVisualStore(s => s.flyingCards);
    const isClosingFan = useVisualStore((s) => s.isClosingFan);

    // Computed Values
    const mainSlotRaw = heldTopDiscardRaw || (discardPile.length > 0 ? discardPile[discardPile.length - 1] : null);

    const discardRef = useAnimatedRef<View>();
    const drawRef = useAnimatedRef<View>();

    // Accumulate jitter per pile slot — only add new entries, never regenerate existing ones
    const jitterCache = React.useRef<Array<{ x: number; y: number; r: number }>>([]);
    const needed = Math.min(Math.max(cardsDiscarded - 1, 0), 5);
    while (jitterCache.current.length < needed) {
        jitterCache.current.push({
            x: (Math.random() - 0.5) * 12,
            y: (Math.random() - 0.5) * -10,
            r: (Math.random() - 0.5) * 20,
        });
    }
    const pileLayersWithJitter = jitterCache.current.slice(0, needed).map((j, i) => ({ ...j, index: i }));

    return (
        <View style={styles.centerTable}>
            {/* DRAW DECK + ATU overlapping */}
            <View style={styles.deckWrapper}>
                {/* ATU sits behind the deck */}
                {atuCard && (
                    <View style={[styles.atuSlot]}>
                        <CardFace cardId={atuCard[0].id} cardWidth={centerCardWidth}/>
                    </View>
                )}

                {/* DRAW DECK on top */}
                <TouchableOpacity
                    ref={drawRef}
                    onLayout={() => updateLayout('deck', drawRef, null)}
                    style={[styles.cardSlotDraw]}
                    disabled={!mandatoryDraw}
                    onPress={() => drawCards(false)}
                >
                    <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
                    <CardFace cardId={null} isFacedown cardWidth={centerCardWidth}/>
                </TouchableOpacity>
            </View>

            {/* DISCARD PILE */}
            <TouchableOpacity
                style={[styles.discardSlot]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(true)}
            >
                <AppText style={styles.slotLabel}>DISCARD</AppText>

                {/* 1. Shared Container for Pile & Top Card */}
                {/* Removed flex: 1 to prevent it from fighting the absolute children */}
                <View style={styles.cardContainer}>

                    {/* ✅ Pile depth simulation */}
                    {pileLayersWithJitter.map((layer) => {
                        const cardRaw = discardPile[discardPile.length - 2 - layer.index];
                        if (!cardRaw) return null;

                        return (
                            <View
                                key={`pile-${layer.index}`}
                                style={[styles.absoluteCenter, {
                                    transform: [
                                        { translateX: layer.x },
                                        { translateY: layer.y },
                                        { rotateZ: `${layer.r}deg` }
                                    ],
                                    zIndex: layer.index,
                                }]}
                            >
                                <CardFace cardId={cardRaw.id} cardWidth={centerCardWidth}/>
                            </View>
                        );
                    })}

                    {/* Top card */}
                    <View style={[styles.absoluteCenter, { zIndex: 10 }]}>
                        {mainSlotRaw ? (
                            <CardFace cardId={mainSlotRaw.id} cardWidth={centerCardWidth}/>
                        ) : (
                            <AppText variant="secondary">Empty</AppText>
                        )}
                    </View>
                </View>

                {/* ✅ Fanned cards overlay */}
                {/* Added pointerEvents="none" if you only want the main slot to be touchable */}
                <View
                    style={[StyleSheet.absoluteFill, styles.centerContent]}
                    ref={discardRef}
                    onLayout={() => updateLayout('discard', discardRef, 1)}
                    pointerEvents="box-none"
                >
                    {offsetSlotCards.length > 0 && offsetSlotCards.map((card, index) => {
                        const isFlying = flyingCards.some(f => {
                            const flyId = typeof f.card === 'string' ? f.card : (f.card as any)?.id;
                            return flyId === card;
                        });

                        if (isFlying) return null;

                        return (
                            <FannedCardItem
                                key={`${card}-${index}`}
                                card={card}
                                index={index}
                                isClosing={isClosingFan}
                                isFlying={isFlying}
                                styles={styles}
                                cardWidth={centerCardWidth}
                            />
                        );
                    })}
                </View>
            </TouchableOpacity>
        </View>
    );
}