import React from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { CardData } from '@/types/game';
import {PLAYER_CARD_WIDTH} from "@/state/constants";
import {AppText} from "@/Common/AppText";

interface GameCardProps {
    card: CardData | null;
    isFacedown?: boolean;
    isSelected?: boolean;
    cardWidth?: number;
    style?: StyleProp<ViewStyle>;
}

export const GameCard = ({ card, isFacedown=false,isSelected, style,}: GameCardProps) => {

    return (
        // 🌟 The inner container shapes the actual artwork
        <View style={style}>
            {/* If it's the front of the card: */}
            {!isFacedown ? ( <CardFace card={card} /> ) :
                (
                <CardBack />
                )}

        </View>
    );
};