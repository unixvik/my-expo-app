import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { CardData } from '@/types/game';
import {PLAYER_CARD_WIDTH} from "@/state/constants";

interface GameCardProps {
    card?: CardData | null;
    isFacedown?: boolean;
    isSelected?: boolean;
    cardWidth?: number;
    style?: StyleProp<ViewStyle>;
}

export const GameCard = React.memo(({
                                        card,
                                        isFacedown = false,
                                        isSelected = false,
                                        cardWidth = PLAYER_CARD_WIDTH,
                                        style
                                    }: GameCardProps) => {

    if (isFacedown || !card) {
        return <CardBack cardWidth={cardWidth} />;
    }

    return (
        <CardFace
            card={card}
            isSelected={isSelected}
            cardWidth={cardWidth}
            style={style}
        />
    );
});