// src/components/PlayerHand/useSwipeHover.ts
import { useRef, useCallback } from "react";
import { Gesture } from "react-native-gesture-handler";

interface Slot {
    centerX: number; // card center in cardsArea local coords
    id: string;
}

export function useSwipeHover(
    onHoverIn:  (id: string) => void,
    onHoverOut: (id: string) => void,
) {
    const hoveredId    = useRef<string | null>(null);
    const slotsRef     = useRef<Slot[]>([]);
    const areaOffsetX  = useRef(0); // cardsArea's x in screen coords

    // Call this from cardsArea's onLayout + measure
    const registerArea = useCallback((screenX: number) => {
        areaOffsetX.current = screenX;
    }, []);

    // Call this whenever cards / geo changes
    const registerSlots = useCallback((slots: { id: string | number; centerX: number }[]) => {
        slotsRef.current = slots;
    }, []);

    const hitTest = useCallback((screenX: number): string | null => {
        const localX = screenX - areaOffsetX.current;
        const slots  = slotsRef.current;
        if (!slots.length) return null;

        // Find the closest card center within a generous hit radius
        let bestId   = null as string | null;
        let bestDist = Infinity;
        const HIT_RADIUS = 60; // px — generous for fat fingers

        for (const slot of slots) {
            const dist = Math.abs(localX - slot.centerX);
            if (dist < HIT_RADIUS && dist < bestDist) {
                bestDist = dist;
                bestId   = slot.id;
            }
        }
        return bestId;
    }, []);

    const gesture = Gesture.Pan()
        .runOnJS(true)
        .minDistance(4)           // don't steal taps
        .onUpdate(e => {
            const id = hitTest(e.absoluteX);

            if (id !== hoveredId.current) {
                if (hoveredId.current) onHoverOut(hoveredId.current);
                if (id)                onHoverIn(id);
                hoveredId.current = id;
            }
        })
        .onEnd(() => {
            if (hoveredId.current) {
                onHoverOut(hoveredId.current);
                hoveredId.current = null;
            }
        })
        .onFinalize(() => {
            if (hoveredId.current) {
                onHoverOut(hoveredId.current);
                hoveredId.current = null;
            }
        });

    return { gesture, registerSlots, registerArea };
}