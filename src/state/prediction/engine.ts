// src/state/prediction/engine.ts

type Dispatch = (ev: any) => void;

/**
 * Predict that an opponent drew a card.
 * This fires instantly instead of waiting for the server snapshot.
 */
export function predictOpponentDraw(
    dispatch: Dispatch,
    payload: { playerId: string; fromDiscard: boolean }
) {
    dispatch({
        type: "PREDICT_OPPONENT_DRAW",
        opponentId: payload.playerId,
        fromDiscard: payload.fromDiscard,
    });
}

/**
 * Predict that an opponent discarded a card.
 */
export function predictOpponentDiscard(
    dispatch: Dispatch,
    payload: { playerId: string; count?: number }
) {
    dispatch({
        type: "PREDICT_OPPONENT_DISCARD",
        opponentId: payload.playerId,
        count: payload.count ?? 1,
    });
}