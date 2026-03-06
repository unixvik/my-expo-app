import { PredictionState, Prediction } from "./types";

export const initialPredictionState: PredictionState = {
    seq: 0,
    active: [],
};

export function predictionReducer(
    state: PredictionState,
    action: any
): PredictionState {
    switch (action.type) {
        case "PREDICT_OPPONENT_DRAW": {
            const pred: Prediction = {
                id: state.seq + 1,
                type: "opponentDraw",
                opponentId: action.opponentId,
                fromDiscard: action.fromDiscard,
            };

            return {
                seq: state.seq + 1,
                active: [...state.active, pred],
            };
        }

        case "PREDICT_OPPONENT_DISCARD": {
            const pred: Prediction = {
                id: state.seq + 1,
                type: "opponentDiscard",
                opponentId: action.opponentId,
                count: action.count ?? 1,
            };

            return {
                seq: state.seq + 1,
                active: [...state.active, pred],
            };
        }

        case "PREDICTION_CONFIRMED":
            return {
                ...state,
                active: state.active.filter((p) => p.id !== action.id),
            };

        case "CLEAR_PREDICTIONS":
            return initialPredictionState;

        default:
            return state;
    }
}