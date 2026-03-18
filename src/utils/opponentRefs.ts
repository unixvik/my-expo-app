import type { View } from 'react-native';
import type React from 'react';

const refs: Record<string, React.RefObject<View | null>> = {};

export const registerOpponentRef = (playerId: string, ref: React.RefObject<View | null>) => {
    refs[playerId] = ref;
};

export const measureOpponent = (
    playerId: string,
    callback: (layout: { x: number; y: number; width: number; height: number }) => void
) => {
    const ref = refs[playerId];
    ref?.current?.measureInWindow((x, y, width, height) => {
        callback({ x, y, width, height });
    });
};
