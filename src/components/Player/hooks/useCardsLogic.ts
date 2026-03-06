// src/components/Player/hooks/useCardsLogic.ts
import type { HandCard } from "@/types/game";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameSelector } from "@/state/machine/useGameSelector";
import { useGameCommands } from "@/state/machine/useGameCommands";
import type { CardRect } from "@/components/Player/AnimatedCard";

type Origin = { id: string; rect: CardRect; card: HandCard };

export const useCardsLogic = (cards: HandCard[]) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    // Keep pending as array in state (easy serialization), expose as Set
    const [pendingDiscardIds, setPendingDiscardIds] = useState<string[]>([]);

    const rectByIdRef = useRef<Record<string, CardRect>>({});

    const registerCardRect = useCallback((id: string, rect: CardRect) => {
        rectByIdRef.current[id] = rect;
    }, []);

    const mandatoryDraw = useGameSelector((s) => s.game.mandatoryDraw);
    const cardsRemaining = useGameSelector((s) => s.game.cardsRemaining);

    const { discard, setSelection, clearSelection: clearSelectionGlobal } = useGameCommands();

    const byId = useMemo(() => {
        const m = new Map<string, HandCard>();
        for (const c of cards) m.set(c.id, c);
        return m;
    }, [cards]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const pendingSet = useMemo(() => new Set(pendingDiscardIds), [pendingDiscardIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
        clearSelectionGlobal();
    }, [clearSelectionGlobal]);

    const onCardPress = useCallback(
        (id: string) => {
            if (mandatoryDraw) return;

            const clicked = byId.get(id);
            if (!clicked) return;

            setSelectedIds((prev) => {
                let next: string[];

                if (prev.includes(id)) {
                    next = prev.filter((x) => x !== id);
                } else if (prev.length === 0) {
                    next = [id];
                } else {
                    const first = byId.get(prev[0]);
                    next = first && first.rank === clicked.rank ? [...prev, id] : [id];
                }

                setSelection(next);
                return next;
            });
        },
        [mandatoryDraw, byId, setSelection]
    );

    const handleDiscard = useCallback(() => {
        if (!cardsRemaining) return;
        if (selectedIds.length === 0) return;

        // Build origins ONLY for cards we can measure + still exist.
        const origins: Origin[] = [];
        const okIds: string[] = [];

        for (const id of selectedIds) {
            const rect = rectByIdRef.current[id];
            const card = byId.get(id);
            if (!rect || !card) continue;

            origins.push({ id, rect, card });
            okIds.push(id);
        }

        // If we can't measure any, do nothing (don’t ghost, don’t discard).
        if (okIds.length === 0) return;

        // ✅ Ghost only the cards that we will actually animate + send.
        setPendingDiscardIds(okIds);

        // ✅ Send discard with the same okIds + origins.
        // (This lets overlay start from correct rects.)
        discard(okIds, origins);

        clearSelection();
    }, [cardsRemaining, selectedIds, discard, clearSelection, byId]);

    /**
     * ✅ Pending cleanup:
     * Remove IDs from pending ONLY when they're no longer present in hand.
     * This avoids "ghost popping back in" during animation.
     */
    useEffect(() => {
        if (pendingDiscardIds.length === 0) return;

        const current = new Set(cards.map((c) => c.id));

        setPendingDiscardIds((prev) => {
            // keep only those still in hand (still pending visually)
            // BUT: we actually want the opposite (pending should persist while in hand),
            // and be removed once the server removes from hand.
            // So remove from pending when NOT in current.
            const next = prev.filter((id) => current.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [cards, pendingDiscardIds.length]);

    /**
     * Optional: if mandatoryDraw flips on, selection should clear (can’t select while draw is mandatory).
     */
    useEffect(() => {
        if (!mandatoryDraw) return;
        if (selectedIds.length === 0) return;
        clearSelection();
    }, [mandatoryDraw, selectedIds.length, clearSelection]);

    return {
        onCardPress,
        selectedIds: selectedSet,
        pendingDiscardIds: pendingSet,
        handleDiscard,
        clearSelection,
        hasSelection: selectedIds.length > 0,
        registerCardRect,
    };
};