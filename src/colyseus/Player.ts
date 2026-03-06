// //
// // THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// // DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// //
// // GENERATED USING @colyseus/schema 4.0.7
// //
//
// import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
// import { Card } from './Card'
//
// export class Player extends Schema {
//     @type("string") public id!: string;
//     @type("boolean") public connected!: boolean;
//     @type("string") public name!: string;
//     @type("boolean") public ready!: boolean;
//     @type("number") public joinedAt!: number;
//     @type("number") handValue: number = 0;
//     @type([ Card ]) public hand: ArraySchema<Card> = new ArraySchema<Card>();
// }
