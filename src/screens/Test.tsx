import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useCardFlightController, CardFlightLayer, Anchor } from "./cardFlightController";

export function PlayArea() {
    const flight = useCardFlightController({ maxConcurrent: 1 });

    // fake data
    const handSlots = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

    const onDraw = (slotIndex: number) => {
        flight.enqueueFlight({
            id: `draw_${Date.now()}`,
            kind: "drawToHand",
            fromKey: "drawPile",
            toKey: `hand:${slotIndex}`,
            back: require("./assets/cardBack.png"),
            front: require("./assets/cardFront.png"),
            durationMs: 560,
            tableTiltXDeg: -14,
            perspective: 1400,
            arcHeightPx: 20,
            maxLiftPx: 24,
            curlDepthPx: 18,
            slices: 16,
            allowTranslateZ: false, // flip to true if stable for you
        });
    };

    return (
        <View style={styles.stage}>
            {/* TABLE UI */}
            <View style={styles.table}>
                <Anchor anchorKey="drawPile" controller={flight} style={styles.drawPile}>
                    <View style={styles.pileVisual} />
                </Anchor>

                <View style={styles.handRow}>
                    {handSlots.map((i) => (
                        <Anchor key={i} anchorKey={`hand:${i}`} controller={flight} style={styles.handSlot}>
                            <View style={styles.slotVisual} />
                        </Anchor>
                    ))}
                </View>

                {/* Call onDraw(…) when your server confirms a draw */}
                <View style={styles.debugButtonRow}>
                    {/* replace with your real button / event */}
                    <View style={{ width: 1, height: 1 }} />
                </View>
            </View>

            {/* FLIGHT OVERLAY */}
            <CardFlightLayer flights={flight.activeFlights as any} />
        </View>
    );
}

const styles = StyleSheet.create({
    stage: { flex: 1 },
    table: { flex: 1, justifyContent: "center", alignItems: "center" },
    drawPile: { width: 72, height: 100, marginBottom: 24 },
    pileVisual: { flex: 1, borderRadius: 10, backgroundColor: "#222" },

    handRow: { flexDirection: "row", gap: 10 },
    handSlot: { width: 56, height: 78 },
    slotVisual: { flex: 1, borderRadius: 10, backgroundColor: "#111", opacity: 0.25 },

    debugButtonRow: { height: 1 },
});
