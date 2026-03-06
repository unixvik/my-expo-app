export function startPredictionTimeout(dispatch: any, id: number) {
    setTimeout(() => {
        dispatch({ type: "PREDICTION_CONFIRMED", id });
    }, 1500);
}