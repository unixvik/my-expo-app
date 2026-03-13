// src/components/Dev/DebugTrajectory.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useGameStore } from "@/state/useGameStore";
import { AppText } from "@/Common/AppText";
import {useSelf} from "@/state/gameSelectors";

export const DebugTrajectory = () => {
    const handPositions = useGameStore((s) => s.handPositions);
    const discard = useGameStore((s) => s.discardLayout);
    const me = useSelf();

    if (!discard || !me) return null;
console.log(discard);
    // Centrul absolut al pachetului
    const toX = discard.x + (discard.width / 2);
    const toY = discard.y + (discard.height / 2);

    return (
        <View
            pointerEvents="none"
            style={{
                // 🌟 FORȚĂM STARTUL DIN (0,0) REAL AL ECRANULUI
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                zIndex: 999999,
            }}
        >
            {/* Punctul END */}
            <View style={[
                styles.dot,
                {
                    left: toX - 4, // 4 e jumătate din lățimea dot-ului (8)
                    top: toY - 4,
                    backgroundColor: 'red'
                }
            ]} />

            {/* Linii pentru cărți */}
            {me.hand.map((card) => {
                const from = handPositions[card.id];
                if (!from) return null;

                const dx = toX - from.x;
                const dy = toY - from.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                return (
                    <React.Fragment key={card.id}>
                        <View style={{
                            position: 'absolute',
                            left: from.x,
                            top: from.y,
                            width: dist,
                            height: 1,
                            backgroundColor: 'cyan',
                            transformOrigin: 'left center', // CRITIC pentru rotație
                            transform: [{ rotate: `${angle}rad` }]
                        }} />
                        <View style={[styles.dot, { left: from.x - 4, top: from.y - 4, backgroundColor: 'yellow' }]} />
                    </React.Fragment>
                );
            })}
        </View>
    );
};
const styles = StyleSheet.create({
    dot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
    },
    label: {
        fontSize: 8,
        color: 'white',
        position: 'absolute',
        top: 10,
        fontWeight: 'bold',
        backgroundColor: 'black',
        paddingHorizontal: 2,
    }
});
