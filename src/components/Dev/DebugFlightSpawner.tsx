// DEV ONLY — lets you spam test flight cards without playing a real turn.
// Toggle auto-respawn to tweak landing params live.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useGameStore } from '@/state/useGameStore';
import { useVisualStore } from '@/state/useVisualStore';

const TEST_CARD = { suit: 'hearts', rank: 'K', value: 10, id: '__test__' };

let counter = 0;

export const DebugFlightSpawner = () => {
    const discardLayout  = useGameStore(s => s.discardLayout);
    const flyingCards    = useVisualStore(s => s.flyingCards);
    const spawnFlyingCard = useVisualStore(s => s.spawnFlyingCard);
    const { width, height } = useWindowDimensions();

    const [auto, setAuto] = useState(false);
    const autoRef = useRef(auto);
    autoRef.current = auto;

    const spawn = () => {
        if (!discardLayout) return;
        spawnFlyingCard({
            id: `test_fly_${counter++}`,
            card: TEST_CARD,
            // spawn from bottom-center of screen (where the hand sits)
            startX: width  * 0.5,
            startY: height * 0.82,
            endX: discardLayout.x + discardLayout.width  / 2,
            endY: discardLayout.y + discardLayout.height / 2,
        });
    };

    // Auto-respawn: fires a new card each time flyingCards empties
    useEffect(() => {
        if (!auto) return;
        if (flyingCards.length === 0) {
            const t = setTimeout(spawn, 300);
            return () => clearTimeout(t);
        }
    }, [auto, flyingCards.length]);

    return (
        <View style={{
            position: 'absolute', top: 60, right: 8, zIndex: 99999,
            gap: 6, alignItems: 'flex-end',
        }}>
            <Pressable
                onPress={spawn}
                style={{ backgroundColor: '#7c3aed', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
            >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>▶ SPAWN</Text>
            </Pressable>
            <Pressable
                onPress={() => setAuto(v => !v)}
                style={{ backgroundColor: auto ? '#16a34a' : '#374151', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
            >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{auto ? '⏹ AUTO ON' : '⏵ AUTO'}</Text>
            </Pressable>
        </View>
    );
};
