// src/state/bindings/colyseusBinding.ts
import { Callbacks } from "@colyseus/sdk";
import type { Event } from "../machine/types";
import {
    convertServerCardToUICard,
    convertServerCardsToUICards,
    convertSuitToSymbol,
} from "@/helpers/suitHelpers";

import {
    predictOpponentDraw,
    predictOpponentDiscard,
} from "../prediction/engine";

// ---- tiny utils ----
type Unsub = (() => void) | undefined | null;

const safe = (fn: Unsub) => {
    try { fn?.(); } catch {}
};

const safeOffMessage = (room: any, name: string, fn: any) => {
    try { room.offMessage?.(name, fn); } catch {}
};

const markBoundOnce = (room: any) => {
    if (room.__bindingsBound)
        console.warn("[bindRoom] bindings already bound for this room");
    room.__bindingsBound = true;
};

const arr = <T>(v: any): T[] => (v ? Array.from(v) : []);

type Identity = { sessionId: string; playerId?: string | null };

function mapPlayerToOpponent(stableId: string, player: any) {
    return {
        id: stableId,
        name: player?.name || "Anonymous",
        cardCount: player?.hand?.length ?? 0,
        bank: player?.totalPoints ?? 0,

        isBot: !!(player?.isBot ?? String(stableId).startsWith("bot_")),

        botTargetRank: player?.botTargetRank ?? "",
        botTargetTTL: player?.botTargetTTL ?? 0,
        botLastDecision: player?.botLastDecision ?? "",
        botLastAction: player?.botLastAction ?? "",
        botLastFromDiscard: player?.botLastFromDiscard ?? false,
        botThinkMs: player?.botThinkMs ?? 0,
        botTurnSeq: player?.botTurnSeq ?? 0,
    };
}

function buildReadyList(room: any) {
    const readyList: any[] = [];
    try {
        room.state.players?.forEach((p: any, key: string) => {
            readyList.push({
                playerId: key,
                name: p?.name ?? "Anonymous",
                ready: !!p?.ready,
                connected: p?.connected !== false,
                isBot: String(key).startsWith("bot_") || !!p?.isBot,
            });
        });
    } catch {}
    return readyList;
}

function buildAtu(room: any) {
    const list = room.state.atuCard
        ? arr<any>(room.state.atuCard).map((c) => ({
            id: c.id,
            suit: convertSuitToSymbol(c.suit),
            rank: c.rank,
            value: c.value,
        }))
        : [];

    return list;
}

function buildInitialSnapshot(room: any) {
    const atuCards = buildAtu(room);

    return {
        gameStatus: room.state.gameStatus || "waiting",
        round: room.state.round || 1,

        cardsRemaining: room.state.cardsRemaining || 0,
        cardsDiscarded: room.state.cardsDiscarded || 0,

        currentTurn: room.state.currentTurn || null,
        currentTurnIndex: room.state.currentTurnIndex ?? 0,

        topDiscard: room.state.topDiscardCard
            ? convertServerCardToUICard(room.state.topDiscardCard)
            : undefined,

        atuCards,
        deckReady: atuCards.length > 0,

        turnOrder: room.state.turnOrder
            ? arr<string>(room.state.turnOrder)
            : [],

        readyList: buildReadyList(room),

        discardPile: room.state.discardPile
            ? convertServerCardsToUICards(arr(room.state.discardPile))
            : [],
    };
}

export function bindRoom(
    room: any,
    identity: Identity,
    dispatch: (ev: Event) => any
) {
    markBoundOnce(room);

    const callbacks = Callbacks.get(room);

    let myStableId: string | null = identity.playerId ?? null;

    // ---------------- PATCH BATCHING ----------------

    let patchPending = false;
    let patchBuf: Record<string, any> | null = null;

    const flushPatch = () => {
        patchPending = false;
        const p = patchBuf;
        patchBuf = null;

        if (!p) return;

        dispatch({ type: "SERVER_PATCH", patch: p } as any);
    };

    const enqueuePatch = (partial: Record<string, any>) => {
        patchBuf = { ...(patchBuf ?? {}), ...partial };

        if (patchPending) return;

        patchPending = true;
        queueMicrotask(flushPatch);
    };

    // ---------------- TURN ORDER ----------------

    let lastTurnOrderSig = "";

    const syncTurnOrder = () => {
        const order = room.state.turnOrder
            ? arr<string>(room.state.turnOrder)
            : [];

        const sig = order.join("|");
        if (sig === lastTurnOrderSig) return;

        lastTurnOrderSig = sig;

        enqueuePatch({ turnOrder: order });
    };

    const syncReadyList = () => {
        enqueuePatch({ readyList: buildReadyList(room) });
    };

    // ---------------- SNAPSHOT ----------------

    dispatch({
        type: "SERVER_SNAPSHOT",
        snapshot: buildInitialSnapshot(room),
    } as any);

    syncTurnOrder();
    syncReadyList();

    // ---------------- PLAYER DISCOVERY ----------------

    const syncSelfNow = (stableId: string, player: any) => {
        if (!myStableId) myStableId = stableId;

        dispatch({ type: "YOU_ARE", stableId } as any);

        dispatch({
            type: "HAND_UPDATED",
            cards: convertServerCardsToUICards(arr(player?.hand)),
        } as any);

        if (typeof player?.awaitingMandatoryDraw === "boolean") {
            dispatch({
                type: "MANDATORY_DRAW",
                value: !!player.awaitingMandatoryDraw,
            } as any);
        }

        dispatch({ type: "OPPONENT_REMOVED", id: stableId } as any);
    };

    try {
        room.state.players?.forEach((player: any, key: string) => {
            const stableId = key;

            const isMe =
                player?.sessionId === identity.sessionId ||
                stableId === identity.playerId;

            if (isMe) syncSelfNow(stableId, player);
            else
                dispatch({
                    type: "OPPONENT_UPDATED",
                    opponent: mapPlayerToOpponent(stableId, player),
                } as any);
        });
    } catch (e) {
        console.warn("[bindRoom] initial scan failed", e);
    }

    // ---------------- GLOBAL LISTENERS ----------------

    const unsubs: Unsub[] = [];

    unsubs.push(
        callbacks.listen("currentTurn", (v: any) => {
            enqueuePatch({ currentTurn: v ?? null });
            syncTurnOrder();
        })
    );

    unsubs.push(
        callbacks.listen("currentTurnIndex", (v: number) => {
            enqueuePatch({ currentTurnIndex: v ?? 0 });
            syncTurnOrder();
        })
    );

    unsubs.push(
        callbacks.listen("cardsRemaining", (v: number) =>
            enqueuePatch({ cardsRemaining: v ?? 0 })
        )
    );

    unsubs.push(
        callbacks.listen("cardsDiscarded", (v: number) =>
            enqueuePatch({ cardsDiscarded: v ?? 0 })
        )
    );

    unsubs.push(
        callbacks.listen("topDiscardCard", (v: any) =>
            enqueuePatch({
                topDiscard: v
                    ? convertServerCardToUICard(v)
                    : undefined,
            })
        )
    );

    unsubs.push(
        callbacks.listen("gameStatus", (v: string) =>
            enqueuePatch({ gameStatus: v ?? "waiting" })
        )
    );

    unsubs.push(
        callbacks.listen("round", (v: number) =>
            enqueuePatch({ round: v ?? 1 })
        )
    );

    unsubs.push(
        callbacks.onAdd("atuCard", () => {
            const cards = buildAtu(room);

            dispatch({ type: "ATU_UPDATED", cards } as any);

            enqueuePatch({ deckReady: cards.length > 0 });
        })
    );

    const syncDiscardPile = () => {
        const pile = arr<any>(room.state.discardPile).map((c) => convertServerCardToUICard(c));
        enqueuePatch({ discardPile: pile });
    };

    unsubs.push(callbacks.onAdd("discardPile", syncDiscardPile));
    unsubs.push(callbacks.onRemove("discardPile", syncDiscardPile));

    // ---------------- PLAYERS ----------------

    const attachPlayer = (player: any, stableId: string) => {
        const isMe =
            stableId === myStableId ||
            player?.sessionId === room.sessionId;

        const upsertOpponent = () =>
            dispatch({
                type: "OPPONENT_UPDATED",
                opponent: mapPlayerToOpponent(stableId, player),
            } as any);

        if (isMe) syncSelfNow(stableId, player);
        else upsertOpponent();

        const localUnsubs: Unsub[] = [];

        localUnsubs.push(
            callbacks.listen(player, "ready", syncReadyList)
        );

        localUnsubs.push(
            callbacks.listen(player, "connected", syncReadyList)
        );

        localUnsubs.push(
            callbacks.listen(player, "name", () => {
                syncReadyList();
                if (!isMe) upsertOpponent();
            })
        );

        localUnsubs.push(
            callbacks.listen(player, "totalPoints", () => {
                if (!isMe) upsertOpponent();
            })
        );

        const syncHand = () =>
            isMe ? syncSelfNow(stableId, player) : upsertOpponent();

        if (player?.hand) {
            localUnsubs.push(callbacks.onAdd(player.hand, syncHand));
            localUnsubs.push(callbacks.onRemove(player.hand, syncHand));
            localUnsubs.push(callbacks.onChange(player.hand, syncHand));
        }

        localUnsubs.push(
            callbacks.listen(
                player,
                "awaitingMandatoryDraw",
                (val: boolean) => {
                    if (isMe)
                        dispatch({
                            type: "MANDATORY_DRAW",
                            value: !!val,
                        } as any);
                }
            )
        );



        (player as any).__unbind = () =>
            localUnsubs.forEach(safe);
    };

    unsubs.push(
        callbacks.onAdd("players", (player: any, key: string) =>
            attachPlayer(player, key)
        )
    );

    unsubs.push(
        callbacks.onRemove("players", (player: any, key: string) => {
            safe((player as any).__unbind);

            if (key === myStableId) {
                dispatch({ type: "HAND_UPDATED", cards: [] } as any);
                dispatch({
                    type: "MANDATORY_DRAW",
                    value: false,
                } as any);
            } else {
                dispatch({ type: "OPPONENT_REMOVED", id: key } as any);
            }

            syncReadyList();
        })
    );

    // ---------------- SERVER MESSAGES ----------------

    const onRoundEnded = (payload: any) =>
        dispatch({ type: "ROUND_ENDED", payload } as any);

    const onGameEnded = (payload: any) =>
        dispatch({ type: "GAME_ENDED", payload } as any);

    const onPlayerDrew = (payload: {
        playerId: string;
        fromDiscard: boolean;
    }) => {
        if (myStableId && payload.playerId === myStableId) {
            dispatch({
                type: "MY_DREW",
                fromDiscard: payload.fromDiscard,
            } as any);
            return;
        }

        predictOpponentDraw(dispatch, payload);
    };

    const onPlayerDiscarded = (payload: {
        playerId: string;
        count: number;
    }) => {
        if (myStableId && payload.playerId === myStableId) return;

        predictOpponentDiscard(dispatch, payload);
    };

    const onClaimResult = (payload: {
        ok: boolean;
        reason?: string;
        playerId: string;
    }) => {
        if (!myStableId || payload.playerId !== myStableId) return;

        dispatch({
            type: "CLAIM_RESULT",
            ok: !!payload.ok,
            reason: payload.reason,
        } as any);
    };

    const onAction = (action: any) =>
        dispatch({ type: "SERVER_ACTION", action } as any);

    room.onMessage("claimResult", onClaimResult);
    room.onMessage("roundEnded", onRoundEnded);
    room.onMessage("gameEnded", onGameEnded);
    room.onMessage("playerDrew", onPlayerDrew);
    room.onMessage("playerDiscarded", onPlayerDiscarded);
    room.onMessage("ACTION", onAction);

    // ---------------- CLEANUP ----------------

    return () => {
        unsubs.forEach(safe);

        safeOffMessage(room, "claimResult", onClaimResult);
        safeOffMessage(room, "roundEnded", onRoundEnded);
        safeOffMessage(room, "gameEnded", onGameEnded);
        safeOffMessage(room, "playerDrew", onPlayerDrew);
        safeOffMessage(room, "playerDiscarded", onPlayerDiscarded);
        safeOffMessage(room, "ACTION", onAction);

        try {
            delete room.__bindingsBound;
        } catch {}
    };
}