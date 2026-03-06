export type Prediction =
    | {
    id: number;
    type: "opponentDraw";
    opponentId: string;
    fromDiscard: boolean;
}
    | {
    id: number;
    type: "opponentDiscard";
    opponentId: string;
    count: number;
};

export type PredictionState = {
    seq: number;
    active: Prediction[];
};