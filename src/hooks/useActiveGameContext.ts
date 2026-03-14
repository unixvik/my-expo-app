import { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { useAwaitingDraw, useSelf } from "@/state/gameSelectors";
import {convertServerCardToUICard, parseStringCardsToUI} from "@/utils/suitHelper";
import {useVisualStore} from "@/state/useVisualStore";
import {useAnimatedRef} from "react-native-reanimated";
import {View} from "react-native";

export const useActiveGameContext = () => {
    const me = useSelf();
    const mandatoryDraw = useAwaitingDraw();
    const server = useGameStore((s) => s.server);
    const local = useGameStore((s) => s.local);

    // Identificatori
    const myId = me?.id;
    const isMyTurn = server.currentTurn === myId;

    // Logica pentru Discard/Claim
    const selectedDiscardIds = local.selectedDiscardIds || [];
    const canDiscard = selectedDiscardIds.length > 0 && isMyTurn && !mandatoryDraw;

    const isClaimOpen = useMemo(() => {
        const isRoundEligible = server.round >= server.claimRoundOpen;
        return isMyTurn && isRoundEligible;
    }, [isMyTurn, server.round, server.claimRoundOpen]);

    // Derivări din 'me'
    const handValue = me?.handValue ?? 0;
    const hand = me?.hand ?? [];
    const avatarLetter = useMemo(() =>
            (me?.name ?? "??").charAt(0).toUpperCase(),
        [me?.name]);
    const { currentTurn } = useGameStore((s) => s.server);

    const discardPile = useGameStore((s) => s.server.discardPile);
    const heldTopDiscardRaw = useGameStore((s) => s.local.heldTopDiscard);
    const offsetSlotCardX = useGameStore((s) => s.local.discardedCards);
    const drawCards = useGameStore((s) => s.drawCards);

    // Animation State
    const mainSlotRaw = heldTopDiscardRaw || (discardPile.length > 0 ? discardPile[discardPile.length - 1] : null);
    const mainSlotCard = mainSlotRaw ? convertServerCardToUICard(mainSlotRaw) : null;
    const offsetSlotCards = useMemo(() => parseStringCardsToUI(offsetSlotCardX), [offsetSlotCardX]);

    const atuCard = useGameStore((s) => s.server.atuCard);
    const cardsRemaining = useGameStore((s) => s.server.cardsRemaining);
    const flyingCards = useVisualStore(s => s.flyingCards);

    const discardRef = useAnimatedRef<View>();
    const setDiscardLayout = useGameStore((s) => s.setDiscardLayout);
    const isClosingFan = useVisualStore((s) => s.isClosingFan);


    return {
        discardPile,
        heldTopDiscardRaw,
        offsetSlotCardX,
        drawCards,
        mainSlotRaw,
        mainSlotCard,
        offsetSlotCards,
        atuCard,
        cardsRemaining,
        flyingCards,
        discardRef,
        setDiscardLayout,
        isClosingFan,
        me,
        myId,
        hand,
        handValue,
        avatarLetter,
        isMyTurn,
        mandatoryDraw,
        isClaimOpen,
        canDiscard,
        selectedDiscardIds,
        currentTurn,
        // Expunem și acțiunile direct pentru a nu le mai importa separat
        toggleCardSelection: useGameStore((s) => s.toggleCardSelection),
        discardCards: useGameStore((s) => s.discardCards),
        clearSelection: useGameStore((s) => s.clearSelection),
        claimGame: useGameStore((s) => s.claimGame)
    };
};
