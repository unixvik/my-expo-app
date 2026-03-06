// src/components/Table/StagingZone.tsx

import React, { memo, useCallback, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { HandCard } from "@/types/game";
import { CardFace } from "@/components/Cards/CardFace/CardFace";

type Rect = { x: number; y: number; w: number; h: number };

export const StageZone = memo(function StageZone({
                                                     stagedCards,
                                                     onAnchor,
                                                 }: {
    stagedCards: HandCard[];
    onAnchor?: (r: Rect) => void;
}) {
    const ref = useRef<View>(null);

    const report = useCallback(() => {
        const node: any = ref.current;
        if (!node?.measureInWindow) return;
        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w > 0 && h > 0) onAnchor?.({ x, y, w, h });
        });
    }, [onAnchor]);

    useEffect(() => {
        report();
    }, [report]);

    const stack = useMemo(() => {
        // top card last so it draws above
        return stagedCards.slice(0, 6); // cap visible stack to keep it cheap
    }, [stagedCards]);

    return (
        <View ref={ref} onLayout={report} pointerEvents="none" style={styles.wrap}>
            <View style={styles.slot} />

            {stack.map((c, i) => {
                const dx = i * 6;
                const dy = i * 4;
                const rot = (-6 + i * 2) as any;
                return (
                    <View
                        key={c.id}
                        style={[
                            styles.card,
                            {
                                transform: [
                                    { translateX: dx },
                                    { translateY: dy },
                                    { rotateZ: `${rot}deg` as any },
                                ],
                            },
                        ]}
                    >
                        <CardFace card={c} />
                    </View>
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    wrap: {
        position: "absolute",
        left: "50%",
        top: "72%",
        transform: [{ translateX: -55 }, { translateY: -75 }],
        width: 140,
        height: 170,
    },
    slot: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.12)",
    },
    card: {
        position: "absolute",
        left: 0,
        top: 0,
        width: 110,
        height: 150,
    },
});