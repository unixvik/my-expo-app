import {TouchableOpacity, View} from "react-native";
import {useMemo} from "react";
import {createStyles} from "@/components/Screens/GameBoard.styles";
import {useTheme} from "@/hooks/useTheme";
import {useResponsive} from "@/hooks/useResponsive";
import {useGameStore} from "@/state/useGameStore";
import {GameCard} from "@/components/Cards/GameCard";
import {BASE_CARD_WIDTH, DISCARD_OFFSET} from "@/state/constants";
import {convertServerCardToUICard} from "@/utils/suitHelper";
import {useAwaitingDraw} from "@/state/gameSelectors";
import {AppText} from "@/Common/AppText";
import {measure, useAnimatedRef} from "react-native-reanimated";
import {runOnJS, runOnUI} from "react-native-worklets";
import {useVisualStore} from "@/state/useVisualStore";

export function CenterTable(props: any) {
    const theme = useTheme();
    const {scale, moderateScale, isLandscape} = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);

    // 1. Get the raw states
    const discardPile = useGameStore((s) => s.server.discardPile);
    const heldTopDiscardRaw = useGameStore((s) => s.local.heldTopDiscard);

// 🌟 2. MAIN SLOT (Underneath): Show the snapshot if it exists, otherwise show normal server top
    const mainSlotRaw = heldTopDiscardRaw
        ? heldTopDiscardRaw
        : (discardPile.length > 0 ? discardPile[discardPile.length - 1] : null);
    const mainSlotCard = mainSlotRaw ? convertServerCardToUICard(mainSlotRaw) : null;

// 🌟 3. OFFSET SLOT (Hovering): Show the newly thrown card ONLY if we are holding a snapshot
    const offsetSlotRaw = (heldTopDiscardRaw && discardPile.length > 0)
        ? discardPile[discardPile.length - 1]
        : null;
    const offsetSlotCard = offsetSlotRaw ? convertServerCardToUICard(offsetSlotRaw) : null;

    const atuCard = useGameStore((s) => s.server.atuCard);
    const mandatoryDraw = useAwaitingDraw();
    const drawCards = useGameStore((s) => s.drawCards);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);

    // --- Layout Measurement Engine ---
    const discardRef = useAnimatedRef<View>();
    const setDiscardLayout = useGameStore((s) => s.setDiscardLayout);
    const flyingCards    = useVisualStore(s => s.flyingCards);

    const isFlying = useMemo(() => {
        if (!offsetSlotRaw) return false;
        return flyingCards.some(f => f.card.id === offsetSlotRaw.id);
    }, [flyingCards, offsetSlotRaw?.id]);

    const handleLayout = () => {
        runOnUI(() => {
            'worklet';
            const m = measure(discardRef);
            if (m) {
                runOnJS(setDiscardLayout)({ x: m.pageX, y: m.pageY, width: m.width, height: m.height });
            }
        })();
    };

    return (
        <View style={styles.centerTable}>

            {/* ATU UNDERNEATH */}
            {atuCard && atuCard.length > 0 && (
                <View style={[styles.cardSlot, styles.atuSlot]}>
                    <GameCard
                        card={convertServerCardToUICard(atuCard[0])}
                        cardWidth={BASE_CARD_WIDTH}
                        style={styles.tableCardArtwork}
                    />
                </View>
            )}

            {/* DRAW PILE */}
            <TouchableOpacity
                style={[styles.cardSlot, styles.cardSlotDraw]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(false)}
            >
                <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
                <GameCard
                    isFacedown
                    cardWidth={BASE_CARD_WIDTH}
                    style={styles.tableCardArtwork}
                />
            </TouchableOpacity>

            {/* DISCARD PILE */}
            <TouchableOpacity
                ref={discardRef}
                onLayout={handleLayout} // 🌟 Measure reliably when the UI renders
                style={[styles.cardSlot, styles.discardSlot]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(true)}
            >
                <AppText style={styles.slotLabel}>DISCARD</AppText>

                {/* The actual clickable server card underneath */}
                {mainSlotCard ? (
                    <GameCard
                        card={mainSlotCard}
                        cardWidth={BASE_CARD_WIDTH}
                        style={styles.tableCardArtwork}
                    />
                ) : (
                    <AppText variant="secondary">Empty</AppText>
                )}

                {/* 🌟 The card HOVERING (The one you just threw) */}
                {offsetSlotCard && flyingCards.length == 0 && (
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: scale(DISCARD_OFFSET.x), // Offset to the right
                            top: scale(DISCARD_OFFSET.y),
                            transform: [{ rotateZ: '24deg' }],
                            zIndex: 10,
                            elevation: 10,
                            ...styles.cardSlot
                        }}
                    >
                        <GameCard
                            card={offsetSlotCard}
                            cardWidth={BASE_CARD_WIDTH}
                            style={styles.tableCardArtwork}
                        />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}