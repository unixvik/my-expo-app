import { TouchableOpacity, View } from "react-native";
import {useEffect, useMemo} from "react";
import { createStyles } from "@/components/Screens/GameBoard.styles";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { useGameStore } from "@/state/useGameStore";
import { GameCard } from "@/components/Cards/GameCard";
import { BASE_CARD_WIDTH } from "@/state/constants";
import { convertServerCardToUICard } from "@/utils/suitHelper";
import { useAwaitingDraw } from "@/state/gameSelectors";
import { AppText } from "@/Common/AppText";
import {measure, useAnimatedRef} from "react-native-reanimated";
import {runOnJS, runOnUI} from "react-native-worklets";
import {DebugTrajectory} from "@/components/Dev/DebugTrajectory";

export function CenterTable(props: any) {
    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale, isLandscape]);

    const discardPile = useGameStore((s) => s.server.discardPile);
    const topDiscardRaw = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
    const topDiscard = topDiscardRaw ? convertServerCardToUICard(topDiscardRaw) : null;

    const atuCard = useGameStore((s) => s.server.atuCard);
    const mandatoryDraw = useAwaitingDraw();
    const drawCards = useGameStore((s) => s.drawCards);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);

    const discardRef = useAnimatedRef<View>();
    const setDiscardLayout = useGameStore((s) => s.setDiscardLayout);

    const handleLayout = () => {
        runOnUI(() => {
            'worklet';
            const measurement = measure(discardRef);
            if (measurement) {
                runOnJS(setDiscardLayout)({
                    // 🌟 SCHIMBARE: Folosim coordonatele de PAGINĂ (globale)
                    x: measurement.pageX,
                    y: measurement.pageY,
                    width: measurement.width,
                    height: measurement.height
                });
            }
        })();
    };


    const discardLayout = useGameStore(s => s.discardLayout);
    // console.log(discardLayout);
    return (
        <View style={styles.centerTable}>

            {/* ATU UNDERNEATH */}
            {atuCard && atuCard.length > 0 && (
                <View style={[styles.cardSlot, styles.atuSlot]}>
                    <GameCard
                        card={convertServerCardToUICard(atuCard[0])}
                        cardWidth={BASE_CARD_WIDTH}
                        style={styles.tableCardArtwork} // 🌟 ADD THIS
                    />
                </View>
            )}

            {/* DRAW PILE */}
            <TouchableOpacity
                style={[styles.cardSlot, styles.cardSlotDraw]} // Ensure cardSlot base is applied
                disabled={!mandatoryDraw}
                onPress={() => drawCards(false)}
            >
                <AppText style={styles.slotLabel}>DECK ({cardsRemaining})</AppText>
                <GameCard
                    isFacedown
                    cardWidth={BASE_CARD_WIDTH}
                    style={styles.tableCardArtwork} // 🌟 ADD THIS
                />
            </TouchableOpacity>

            {/* DISCARD PILE */}
            <TouchableOpacity
                ref={discardRef}
                onLayout={handleLayout}
                style={[styles.cardSlot, styles.discardSlot]}
                disabled={!mandatoryDraw}
                onPress={() => drawCards(true)}
            >
                <AppText style={styles.slotLabel}>DISCARD</AppText>
                {topDiscard ? (
                    <GameCard
                        card={topDiscard}
                        cardWidth={BASE_CARD_WIDTH}
                        style={styles.tableCardArtwork} // 🌟 ADD THIS
                    />
                ) : (
                    <AppText variant="secondary">Empty</AppText>
                )}
            </TouchableOpacity>
            {/* 🔴 ANCHOR DEBUGGER: Apare doar dacă avem date în store */}
            {discardLayout && (
                <View
                    pointerEvents="none" // Să nu blocheze click-urile
                    style={{
                        position: 'absolute',
                        left: discardLayout.x,
                        top: discardLayout.y,
                        width: discardLayout.width,
                        height: discardLayout.height,
                        borderWidth: 2,
                        borderColor: 'red', // Culoare stridentă pentru debug
                        backgroundColor: 'rgba(255, 0, 0, 0.2)', // Fundal semi-transparent
                        zIndex: 9999,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    {/*<Text>DISCARD ANCHOR</Text>*/}
                </View>
            )}

        </View>
    );
}