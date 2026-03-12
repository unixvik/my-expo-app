// Auto-generated - DO NOT EDIT

import {ArraySchema, MapSchema, Schema, type} from "@colyseus/schema";

export class Card extends Schema {

    @type("string") suit = "";
    @type("string") rank = "";
    @type("number") value = 0;
    @type("string") id = "";
}

export class Player extends Schema {
    @type("string") id!: string;            // stable id (playerKey or bot id)
    @type("string") sessionId!: string;     // current connection session id
    @type("boolean") connected!: boolean;
    @type("string") name!: string;
    @type("boolean") ready = false;
    @type("boolean") awaitingMandatoryDraw!: boolean;
    @type([Card]) hand!: ArraySchema<Card>;
    @type(["string"]) stagedDiscardIds = new ArraySchema<string>();
    @type([Card]) toDiscardCard: ArraySchema<Card> = new ArraySchema<Card>(); // ToDiscard
    @type("number") totalPoints: number | undefined;
    @type("string") lastDiscardBatchId?: string;
    @type("boolean") isHost: boolean = false;
    @type("boolean") isBot: boolean = false;
    @type("string") botTargetRank: string = "";
    @type("number") botTargetTTL: number = 0;

    @type("string") botLastDecision: string = "";   // short reason string
    @type("string") botLastAction: string = "";     // "claim" | "discard" | "draw"
    @type("boolean") botLastFromDiscard: boolean = false;

    @type("number") botThinkMs: number = 0;         // last “thinking” delay used
    @type("number") botTurnSeq: number = 0;         // increments each bot turn
}

export class ClaimRoomState extends Schema {
    @type({ map: Player }) players!: MapSchema<Player>;
    @type("number") cardsRemaining!: number;
    @type("number") cardsDiscarded!: number;
    @type("string") gameStatus!: string;
    @type("number")  minPlayers!: number;
    @type("number") countdown!: number;
    @type("number") round!: number;
    @type("number") claimRoundOpen!: number;
    @type("string") currentTurn: string;
    @type("string") atuRank!: string;
    @type(Card) topDiscardCard?: Card;
    @type([Card]) discardPile = new ArraySchema<Card>();
    @type([Card]) atuCard = new ArraySchema<Card>();
    @type(["string"]) turnOrder: ArraySchema<string>;
    @type("number") currentTurnIndex!: number;
    @type("number") roundStarterIndex = 0;

}