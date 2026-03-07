// src/components/Piles/DiscardPile/useDiscardPileState.ts

import { useRef, useEffect } from "react";
import { Animated } from "react-native";
import { useGameSelector, shallowEqual } from "@/state/machine/useGameSelector";
import { DISCARD_SPRING } from "./discardPileConfig";
import type { FaceCard } from "@/types/game";

export function useDiscardPileState(mul: number, SCALE: number) {
    const topCard = useGameSelector(
        (s) => s.game.discardPile[s.game.discardPile.length - 1] ?? null,
        shallowEqual
    );

    // discardDrawableCard = original top before the current discard batch.
    // discardPileDrawing  = suppress under card while it is mid-flight.
    const underCard = useGameSelector((s) => {
        if (s.ui.discardPileDrawing) return null;
        return s.ui.discardDrawableCard ?? s.game.discardPile[s.game.discardPile.length - 2] ?? null;
    }, shallowEqual);

    const cardsDiscarded = useGameSelector((s) => s.game.discardPile.length);

    // Intermediate fan cards: all batch cards except the animated top.
    const fanCards = useGameSelector((s) => {
        if (s.ui.discardPileDrawing) return [] as FaceCard[];
        const n = s.ui.discardPile.discardedBatchCount;
        if (n <= 1) return [] as FaceCard[];
        const pile = s.game.discardPile;
        return pile.slice(pile.length - n, pile.length - 1);
    }, shallowEqual);

    const { offset, offsetSeq, discardedBatchCount } = useGameSelector(
        (s) => s.ui.discardPile,
        shallowEqual
    );

    const hasOffset = offset.x !== 0 || offset.y !== 0 || offset.rot !== 0;

    // ── Animated values (native driver → 60 FPS) ──────────────────────────
    // These are shared by both the top card AND the DiscardFan (via Animated.multiply).
    // A single spring drives the entire pile offset simultaneously.
    const animOffsetX = useRef(new Animated.Value(0)).current;
    const animOffsetY = useRef(new Animated.Value(0)).current;
    const animRot     = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const isSlidingBack = offset.x === 0 && offset.y === 0 && offset.rot === 0 && !!topCard;

        if (isSlidingBack) {
            // Slide-back: fast, decisive spring with slight overshoot.
            Animated.parallel([
                Animated.spring(animOffsetX, { toValue: 0, useNativeDriver: true, ...DISCARD_SPRING.slideBack }),
                Animated.spring(animOffsetY, { toValue: 0, useNativeDriver: true, ...DISCARD_SPRING.slideBack }),
                Animated.spring(animRot,     { toValue: 0, useNativeDriver: true, ...DISCARD_SPRING.slideBack }),
            ]).start();
        } else {
            // Landing: instantly place the card at the PEEK position so it appears
            // exactly where the flying card just arrived — no spring-from-0 snap.
            animOffsetX.setValue(offset.x * SCALE * mul);
            animOffsetY.setValue(offset.y * SCALE * mul);
            animRot.setValue(offset.rot);
        }
    }, [offset.x, offset.y, offset.rot, offsetSeq, animOffsetX, animOffsetY, animRot, SCALE, mul, topCard]);

    return {
        topCard,
        underCard,
        cardsDiscarded,
        fanCards,
        discardedBatchCount,
        hasOffset,
        animOffsetX,
        animOffsetY,
        animRot,
    };
}
