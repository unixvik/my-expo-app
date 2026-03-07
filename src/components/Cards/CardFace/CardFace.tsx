// src/components/Cards/CardFace/CardFace.tsx
import React, { memo, useMemo } from "react";
import { View, Text } from "react-native";
import { useCardSize } from "@/hooks/useCardSize";
import type {FaceCard, HandCard} from "@/types/game";
import { useTheme } from "@/theme/ThemeProvider";
import { getCardTheme } from "./cardFace.theme";
import { computeCardMetrics } from "./cardFace.metrics";
import { cardFaceStatic, createCardFaceStyles } from "./cardFace.styles";

const isRed = (suit: string) =>
    ["♥", "♦", "hearts", "diamonds"].includes((suit ?? "").toLowerCase());

type Props = {
    card?: FaceCard | null;
    isSelected?: boolean;
    isPending?: boolean;
    isMini?: boolean;
    scaleMul?: number;
};

export const CardFace = memo(function CardFace({
                                                   card,
                                                   isSelected = false,
                                                   isPending = false,
                                                   isMini = false,
                                                   scaleMul = 1,
                                               }: Props) {
    const t = useTheme();
    const tCard = useMemo(() => getCardTheme(t), [t]);

    const { CARD_W, CARD_H, CARD_RADIUS, SCALE } = useCardSize();

    const m = useMemo(
        () =>
            computeCardMetrics({
                CARD_W,
                CARD_H,
                CARD_RADIUS,
                SCALE,
                isMini,
                scaleMul,
            }),
        [CARD_W, CARD_H, CARD_RADIUS, SCALE, isMini, scaleMul]
    );

    // ✅ Compute these BEFORE any early return, with safe fallbacks
    const suit = (card?.suit ?? "") as string;
    const red = isRed(suit);
    const ink = red ? tCard.pipRed : tCard.pipBlack;

    const dyn = useMemo(
        () =>
            createCardFaceStyles({
                tCard,
                m,
                isSelected,
                isPending,
                ink,
            }),
        [tCard, m, isSelected, isPending, ink]
    );

    // ✅ Now it's safe to early-return
    if (!card) {
        return <Text style={[cardFaceStatic.empty, { color: tCard.textMuted }]}>No card</Text>;
    }

    return (
        <View style={dyn.outerBox}>
            <View style={dyn.liftWrap}>
                <View style={dyn.contactWrap}>
                    <View style={dyn.body}>
                        <View style={dyn.content}>
                            {/* top-left */}
                            <View style={dyn.cornerPlateTL}>
                                <Text allowFontScaling={false} style={dyn.rankText}>
                                    {card.rank}
                                </Text>
                                <Text allowFontScaling={false} style={dyn.suitSmall}>
                                    {card.suit}
                                </Text>
                            </View>

                            <View pointerEvents="none" style={dyn.centerSuitWrap}>
                                <Text allowFontScaling={false} style={dyn.centerSuitText}>
                                    {card.suit}
                                </Text>
                            </View>

                            {/* bottom-right */}
                            <View style={dyn.cornerPlateBR}>
                                <View style={cardFaceStatic.rot180}>
                                    <Text allowFontScaling={false} style={dyn.rankText}>
                                        {card.rank}
                                    </Text>
                                    <Text allowFontScaling={false} style={dyn.suitSmall}>
                                        {card.suit}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* selected kiss */}
                        {/* {dyn.selectedKiss ? <View style={dyn.selectedKiss} /> : null} */}
                    </View>
                </View>
            </View>
        </View>
    );
});
