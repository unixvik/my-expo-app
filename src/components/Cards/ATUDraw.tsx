// src/components/Cards/ATUDraw.tsx
import React, {memo} from "react";
import {View, Text, StyleSheet} from "react-native";
import {useCardSize} from "@/hooks/useCardSize";
import {useGameSelector, shallowEqual} from "@/state/machine/useGameSelector";
import {selectDeckReady, selectAtuCards} from "@/state/machine/selector";
import {CardFace} from "@/components/Cards/CardFace/CardFace";

type Props = { scaleMul?: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default memo(function ATUDraw({scaleMul = 1}: Props) {
    const {CARD_W, CARD_H, CARD_RADIUS, SCALE} = useCardSize();
    const deckReady = useGameSelector(selectDeckReady);
    const atuCards = useGameSelector(selectAtuCards, shallowEqual);

    const atu0 = atuCards.length > 0 ? atuCards[0] : null;
    if (!deckReady || !atu0) return null;

    const mul = clamp(scaleMul, 0.6, 1.2);
    const W = Math.round(CARD_W * mul);
    const H = Math.round(CARD_H * mul);
    const R = Math.round(CARD_RADIUS * mul);

    const borderW = Math.max(1, Math.round(3 * SCALE * mul));
    const labelSize = Math.max(8, Math.round(15 * SCALE * mul));
    const labelTop = Math.round(-18 * SCALE * mul);

    return (
        <View pointerEvents="none" className={"left-[95%] top-[15%]"} style={{
            width: W, height: H, zIndex: -1,
            transform: [
                {rotateZ: "100deg"},  // Must include "deg" as a string
                {rotateY: "-33deg"},
                { scaleX: 0.86 }
            ],


        }}>
            <View className={"-translate-y-4 -translate-x-0"} style={StyleSheet.absoluteFill}>
                <Text style={[styles.label, {fontSize: labelSize, top: labelTop}]}>ATU</Text>
                <View
                    style={{
                        width: W + 20,
                        height: H,
                        borderWidth: borderW,
                        borderRadius: R,
                        borderColor: "rgba(202,138,4,0.60)",
                    }}
                />
            </View>
            <CardFace card={atu0}/>
            {/* render your ATU card here later */}

        </View>
    );
});

const styles = StyleSheet.create({
    label: {
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        color: "rgba(202,138,4,0.70)",
        fontWeight: "800",
        letterSpacing: 2,
    },
});
