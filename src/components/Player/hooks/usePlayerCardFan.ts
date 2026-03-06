// hooks/usePlayerCardFan.ts
import { useMemo } from 'react';
import { calculateCinematicFan } from '@/helpers/cardFanLayout';
import { useDevice } from '@/hooks/useDevice';
import { useCardSize } from '@/hooks/useCardSize';

export const usePlayerCardFan = (cardCount: number) => {
    const { isDesktop } = useDevice();
    const { SCALE } = useCardSize();

    return useMemo(
        () => calculateCinematicFan(cardCount, isDesktop, SCALE),
        [cardCount, isDesktop, SCALE]
    );
};