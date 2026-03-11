import {StyleSheet,TouchableOpacity, View} from "react-native";
import {AppText} from "@/Common/AppText";
import {convertServerCardToUICard} from "@/utils/suitHelper";
import {GameCard} from "@/components/Cards/GameCard";
import React, {useMemo} from "react";
import {useTheme} from "@/hooks/useTheme";
import {useResponsive} from "@/hooks/useResponsive";
import {createStyles} from "@/components/Screens/GameBoard.styles";
import {useGameStore} from "@/state/useGameStore";
import {useAwaitingDraw, useSelf} from "@/state/gameSelectors";
import {PLAYER_CARD_WIDTH} from "@/state/constants";
import {ClaimButton} from "@/components/UI/ClaimButton";
import Animated from "react-native-reanimated";
import {LinearGradient} from "expo-linear-gradient";

export function PlayerLayer() {
    const theme = useTheme();
    // 🌟 1. Track screen size dynamically
    const {scale, moderateScale, isLandscape} = useResponsive(); // 🌟 One hook for everything
    // 🌟 2. Generate the scale functions for the CURRENT frame
    const styles = useMemo(() => createStyles(theme, scale, moderateScale, isLandscape), [theme, scale]);

    const mandatoryDraw = useAwaitingDraw();
    const me = useSelf();
    const {currentTurn} = useGameStore((s) => s.server);
    const myId = me?.id;

    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds || []);
    const toggleCardSelection = useGameStore((s) => s.toggleCardSelection);
    const clearSelection = useGameStore((s) => s.clearSelection);
    const discardCards = useGameStore((s) => s.discardCards);
    const claimGame = useGameStore((s) => s.claimGame);

    const displayName = me?.name ?? "??" ;
    const avatarLetter = useMemo(() => (displayName.charAt(0)).toUpperCase(), [displayName]);


    // const { breatheAnim } = useTurnActiveFx(isMyTurn, {
    //     hapticOnActivate: true,
    //     breatheTo: 1.05,
    //     breatheMs: 1600,
    // });
    //

    return (
        <View style={styles.playerZone}>

            {/* DISCARD ACTION OVERLAY */}
            {selectedDiscardIds.length > 0 && currentTurn === myId && !mandatoryDraw && (
                <TouchableOpacity
                    style={[
                        styles.discardButton,
                        // 🌟 Shift button to the right in landscape so it doesn't cover cards
                        // isLandscape && { top: scale(20), right: scale(20), alignSelf: 'flex-end' }
                    ]}
                    onPress={() => {
                        discardCards(selectedDiscardIds);
                        clearSelection();
                    }}
                >
                    <AppText style={styles.actionText}>
                        DISCARD {selectedDiscardIds.length} {selectedDiscardIds.length === 1 ? 'CARD' : 'CARDS'}
                    </AppText>
                </TouchableOpacity>
            )}
            {/* 🌟 Show CLAIM if NO cards are selected */}


            <View style={styles.myAreaHeader}>
                <AppText>{me?.name || 'Me'}</AppText>
                {currentTurn === me?.id && (
                    <AppText style={{color: theme.accent, fontWeight: 'bold'}}> - YOUR TURN</AppText>
                )}
            </View>
            <View style={styles.myArea}>
                <View style={styles.sideZone}>

                    <Animated.View style={[styles.avatarWrap, { transform: [{ scale: 1 }] }]}>
                        <LinearGradient colors={["#3d1a6e", "#1a0a3a"]} style={StyleSheet.absoluteFill} />
                        <AppText style={styles.avatarLetter}>{avatarLetter}</AppText>
                    </Animated.View>
                    {/*<AppText>Left Info</AppText>*/}
                </View>
                <View style={styles.handContainer}>
                    {me?.hand?.map((rawCard, index) => {
                        const card = convertServerCardToUICard(rawCard);
                        const isSelected = selectedDiscardIds.some(c => c === card.id);

                        return (
                            <TouchableOpacity
                                key={card.id || index}
                                activeOpacity={1}
                                onPress={() => toggleCardSelection(card.id)}
                                style={styles.playerCard}
                            >
                                <GameCard
                                    card={card}
                                    isSelected={isSelected}
                                    cardWidth={PLAYER_CARD_WIDTH}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View style={[styles.sideZone]}>
                    <ClaimButton onPress={() => claimGame()}/>
                </View>
            </View>
        </View>
    )
}