// src/hooks/useCardSize.ts
import { useWindowDimensions } from "react-native";
import { useDevice } from "./useDevice";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function useCardSize() {
    const { width } = useWindowDimensions();
    const { isDesktop } = useDevice();

    // Base mobile size at 375pt width
    const baseW = 60;
    const baseH = 88;

    // Scale relative to 375, clamp so it doesn’t get silly on tablets
    const s = clamp(width / 375, 0.92, 1.25);

    const CARD_W = Math.round(baseW * s);
    const CARD_H = Math.round(baseH * s);

    // Desktop override (optional)
    const finalW = isDesktop ? Math.max(CARD_W, 122) : CARD_W;
    const finalH = isDesktop ? Math.max(CARD_H, 178) : CARD_H;

    return {
        CARD_W: finalW,
        CARD_H: finalH,
        CARD_RADIUS: Math.round(12 * s),
        SCALE: s,
    };
}
