import React, {useEffect, useRef, useState} from 'react';
import {Pressable, Text, useWindowDimensions, View} from 'react-native';
import {useVisualStore} from '@/state/useVisualStore';
import {DISCARD_OFFSET} from "@/state/constants";
import {useResponsive} from "@/hooks/useResponsive";
import {convertServerCardToUICard} from "@/utils/suitHelper";
import {spawnDiscardFlight} from "@/utils/spawnDiscardFlight";
import {useGameStore} from "@/state/useGameStore";
const TEST_CARD = {
    suit: 'hearts',
    rank: 'K',
    value: 10,
    id: 'test' + Math.random().toString(36).substr(2, 4)
};

let counter = 0;

const DebugFlightSpawner = () => {
    const discardLayout = useVisualStore(s => s.layouts.discard);
    const deckLayout = useVisualStore(s => s.layouts.deck);
    const playerLayout = useVisualStore(s => s.layouts.player);
    const flyingCards = useVisualStore(s => s.flyingCards);
    const spawnFlyingCard = useVisualStore(s => s.spawnFlyingCard);
    const selectedDiscardIds = useGameStore((s) => s.local.selectedDiscardIds || []);

    const {width, height} = useWindowDimensions();
    const {moderateScale} = useResponsive();

    const [auto, setAuto] = useState(false);
    const autoRef = useRef(auto);
    autoRef.current = auto;

    const spawnFromDeck = () => {
        if (!deckLayout || !playerLayout) {
            console.warn('⚠️ Missing deck or player layout');
            return;
        }

        const firstCard = Object.values(playerLayout)[0];
        if (!firstCard) {
            console.warn('⚠️ No player card layout found');
            return;
        }

        spawnFlyingCard({
            id: `deck_fly_${counter++}`,
            card: { suit: 'hearts', rank: 'A', value: 11, id: 'debug-deck-draw' },
            startX: deckLayout.x + deckLayout.width / 2,
            startY: deckLayout.y + deckLayout.height / 2,
            endX: firstCard.x + firstCard.width / 2,
            endY: firstCard.y + firstCard.height / 2,
            isFacedown: true,
            type: 'draw',
        });

        setTimeout(() => {
            useVisualStore.getState().removeFlyingCard(`deck_fly_${counter - 1}`);
        }, 700);
    };

    const spawn = () => {
        if (!discardLayout || !playerLayout) {
            console.warn('⚠️ Missing layouts');
            return;
        }

        // 🎯 Discard center (TRUE center)
        const discardCenterX =
            discardLayout.x + discardLayout.width / 2 + moderateScale(DISCARD_OFFSET.x);

        const discardCenterY =
            discardLayout.y + discardLayout.height / 2 + moderateScale(DISCARD_OFFSET.y);

        // 🎯 Take FIRST available player card
        const firstCard = Object.values(playerLayout)[0];

        if (!firstCard) {
            console.warn('⚠️ No player card layout found');
            return;
        }

        const startX = firstCard.x + firstCard.width / 2;
        const startY = firstCard.y + firstCard.height / 2;

        const flightData = {
            id: `test_fly_${counter++}`,
            card: convertServerCardToUICard(TEST_CARD),
            startX,
            startY,
            endX: discardCenterX,
            endY: discardCenterY,
        };

        // spawnFlyingCard(flightData);
// console.log("Spaewn!");
        //test
        spawnDiscardFlight({
            selectedDiscardIds,
            hand:[],
            handPositions: playerLayout,
            discardLayout,
            spawnFlyingCard
        });


    };

    // 🔁 Auto spawn
    useEffect(() => {
        if (!auto) return;

        if (flyingCards.length === 0) {
            const t = setTimeout(spawn, 300);
            return () => clearTimeout(t);
        }
    }, [auto, flyingCards.length]);

    return (
        <>
            {/* 🎮 Controls */}
            <View style={{
                position: 'absolute',
                top: 60,
                right: 8,
                zIndex: 101,
                gap: 6,
                alignItems: 'flex-end',
            }}>
                <Pressable
                    onPress={spawn}
                    style={{
                        backgroundColor: '#7c3aed',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6
                    }}
                >
                    <Text style={{color: '#fff', fontSize: 11, fontWeight: 'bold'}}>
                        ▶ SPAWN
                    </Text>
                </Pressable>

                <Pressable
                    onPress={spawnFromDeck}
                    style={{
                        backgroundColor: '#b45309',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6
                    }}
                >
                    <Text style={{color: '#fff', fontSize: 11, fontWeight: 'bold'}}>
                        🂠 DECK→ME
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setAuto(v => !v)}
                    style={{
                        backgroundColor: auto ? '#16a34a' : '#374151',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6
                    }}
                >
                    <Text style={{color: '#fff', fontSize: 11, fontWeight: 'bold'}}>
                        {auto ? '⏹ AUTO ON' : '⏵ AUTO'}
                    </Text>
                </Pressable>
            </View>

            {/* 🟠 DECK DEBUG */}
            {deckLayout && (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: deckLayout.x,
                        top: deckLayout.y ,
                        width: deckLayout.width,
                        height: deckLayout.height,
                        borderWidth: 2,
                        borderColor: 'orange',
                        zIndex: 2,
                    }}
                >
                    <Text style={{
                        color: 'orange',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'absolute',
                        top: -16,
                    }}>
                        Deck
                    </Text>
                </View>
            )}

            {/* 🔴 DISCARD DEBUG */}
            {discardLayout && (
                <>
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: discardLayout.x,
                            top: discardLayout.y,
                            width: discardLayout.width,
                            height: discardLayout.height,
                            borderWidth: 2,
                            borderColor: 'red',
                            // backgroundColor: 'rgba(255,0,0,0.2)',
                            zIndex: 2,
                        }}
                    >
                        <Text style={{
                            color: 'red',
                            fontSize: 10,
                            fontWeight: 'bold',
                            position: 'absolute',
                            top: -16
                        }}>
                            Discard
                        </Text>
                    </View>

                    {/* center */}
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: discardLayout.x + discardLayout.width / 2 - 10,
                            top: discardLayout.y + discardLayout.height / 2 - 10,
                            width: 20,
                            height: 20,
                            zIndex: 11,
                        }}
                    >
                        <View style={{
                            position: 'absolute',
                            left: 9,
                            top: 0,
                            width: 2,
                            height: 20,
                            backgroundColor: 'lime'
                        }}/>
                        <View style={{
                            position: 'absolute',
                            left: 0,
                            top: 9,
                            width: 20,
                            height: 2,
                            backgroundColor: 'lime'
                        }}/>
                    </View>
                </>
            )}

            {/* 🔵 PLAYER DEBUG */}
            {playerLayout && Object.entries(playerLayout).map(([key, layout]) => (
                <React.Fragment key={`player_${key}`}>

                    {/* blue box */}
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: layout.x,
                            top: layout.y,
                            width: layout.width,
                            height: layout.height,
                            borderWidth: 2,
                            borderColor: 'blue',
                            backgroundColor: 'rgba(0,0,255,0.15)',
                            zIndex: 10,
                        }}
                    >
                        <Text style={{
                            color: 'blue',
                            fontSize: 10,
                            fontWeight: 'bold',
                            position: 'absolute',
                            top: -16
                        }}>
                            Player {key}
                        </Text>
                    </View>

                    {/* center */}
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: layout.x + layout.width / 2 - 10,
                            top: layout.y + layout.height / 2 - 10,
                            width: 20,
                            height: 20,
                            zIndex: 11,
                        }}
                    >
                        <View style={{
                            position: 'absolute',
                            left: 9,
                            top: 0,
                            width: 2,
                            height: 20,
                            backgroundColor: 'cyan'
                        }}/>
                        <View style={{
                            position: 'absolute',
                            left: 0,
                            top: 9,
                            width: 20,
                            height: 2,
                            backgroundColor: 'cyan'
                        }}/>
                    </View>

                </React.Fragment>
            ))}
        </>
    );
};

export default DebugFlightSpawner;