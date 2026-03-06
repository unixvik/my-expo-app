export type HandCard = {
    id: string | number;
    suit: string;
    rank: string;
    value?: number;
};

export type DiscardPayload = {
    ids: Array<HandCard["id"]>;
    origins: Array<{ id: HandCard["id"]; rect: DOMRect }>;
};

export type Props = {
    name: string;
    cards: HandCard[];
    handValue: number;
    onDiscard?: (payload: DiscardPayload) => void;
    isMyTurn: boolean;
    mandatoryDraw: boolean;
    drawPileRef?: React.RefObject<HTMLDivElement | null>
    handleClaim: null => void;

};
