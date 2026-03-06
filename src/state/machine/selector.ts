import type {ReadyRow, RootState} from "./types";
import type {ThemeId} from "@/theme";
import type {Opponent} from "@/types/game";

export type ReadyUiRow = ReadyRow & { isMe: boolean };

export const selectThemeId = (s: any): ThemeId | undefined => s.ui?.themeId;

export const selectDeckReady = (s: RootState) => !!s.game.deckReady;
export const selectAtuCards = (s: RootState) => s.game.atuCards ?? [];
export const selectPlayerCards = (s: RootState) => s.game.playerCards;

export const selectIsMyTurn = (s: RootState) =>
    !!s.game.myPlayerId && s.game.currentTurn === s.game.myPlayerId;

export const selectMandatoryDraw = (s: RootState) => s.game.mandatoryDraw;

export const selectHandValue = (s: RootState) =>
    s.game.playerCards.reduce((sum, c) => sum + (c.value ?? 0), 0);

// ✅ discard allowed only during animTx idle (start of your action)
export const selectCanDiscard = (s: RootState) => {
    const isMyTurn = !!s.game.myPlayerId && s.game.currentTurn === s.game.myPlayerId;
    if (!isMyTurn) return false;

    // ✅ block while any animation/tx is running
    if (s.ui.mode !== "idle") return false;
    if (s.ui.locks.input || s.ui.locks.discard) return false;

    // ✅ can't discard if mandatory draw is pending
    if (s.game.mandatoryDraw) return false;

    // ✅ must have selection
    if (!s.ui.selectedIds.length) return false;

    return true;
};


export const selectClaimPending = (s: RootState) => !!(s.ui as any).claimPending;


export const selectOpponentsInTurnOrder = (state: RootState) => {
    const order = state.game.turnOrder ?? [];
    const opponents = state.game.opponents ?? [];
    const myId = state.game.myPlayerId;

    if (!order.length || !myId) return opponents;

    const myIndex = order.indexOf(myId);
    if (myIndex < 0) return opponents;

    const rotated = order.slice(myIndex + 1).concat(order.slice(0, myIndex));
    const map = new Map(opponents.map((o) => [o.id, o]));
    return rotated.map((id) => map.get(id)).filter(Boolean) as Opponent[];
};

export const selectPlayersReady = (s: RootState): ReadyUiRow[] => {
    const list = s.game.readyList ?? [];
    const me = s.game.myPlayerId;
    return list.map((p) => ({...p, isMe: !!me && p.playerId === me}));
};