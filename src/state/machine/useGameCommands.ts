// src/state/machine/useGameCommands.ts
import { useMemo } from "react";
import { actions } from "./actions";
import { useGameContext } from "./GameProvider";
import type { ThemeId } from "@/theme";

export function useGameCommands() {
    const { dispatch } = useGameContext();

    return useMemo(
        () => ({
            drawDeck: () => dispatch(actions.drawDeck()),
            drawDiscard: () => dispatch(actions.drawDiscard()),
            claim: () => dispatch(actions.claim()),
            revealDone: () => dispatch(actions.revealDone()),
            closeRoundEnded: () => dispatch(actions.closeRoundEnded()),
            discard: (ids: string[], origins?: any) => dispatch(actions.discard(ids, origins)),
            setTheme: (themeId: ThemeId) => dispatch({ type: "SET_THEME", themeId }),
            selectToggle: (id: string) => dispatch({ type: "UI_SELECT_TOGGLE", id }),
            clearSelection: () => dispatch({ type: "UI_CLEAR_SELECTION" }),
            setSelection: (ids: string[]) => dispatch({ type: "UI_SET_SELECTION", ids }),
            animFlightDone: (id: number) => dispatch({ type: "ANIM_FLIGHT_DONE", id }),
        }),
        [dispatch]
    );
}
