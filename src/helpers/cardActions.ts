// // src/helpers/cardActions.ts
// import type { Flight, FaceCard, HandCard } from '../types/game';
// import { generateFlightId, generateCardId } from './idGenerator';
//
// // ============================================================================
// // PLAYER ACTIONS
// // ============================================================================
//
// /**
//  * Creates a draw flight animation from draw pile to player's hand
//  * @returns Object containing the flight and the unique card to add to hand after animation
//  */
// export function createDrawFlight(
//     drawnCard: FaceCard,
//     drawPileRef: React.RefObject<HTMLDivElement>
// ): { flight: Flight; uniqueCard: HandCard } | null {
//     if (!drawPileRef.current) return null;
//
//     const drawPileElement = drawPileRef.current.querySelector('.draw-pile-card');
//     const element = drawPileElement || drawPileRef.current;
//     const originRect = element.getBoundingClientRect();
//
//     const handContainer = document.querySelector('.player-hand-container');
//     if (!handContainer) return null;
//
//     const targetRect = handContainer.getBoundingClientRect();
//     const targetX = targetRect.left + targetRect.width / 2;
//     const targetY = targetRect.top + targetRect.height / 2;
//
//     const uniqueFlightId = generateFlightId('draw');
//     const uniqueCardForHand: HandCard = {
//         ...drawnCard,
//         id: generateCardId('hand')
//     };
//
//     const flight: Flight = {
//         id: uniqueFlightId,
//         card: drawnCard,
//         origin: {
//             top: originRect.top,
//             left: originRect.left,
//             width: originRect.width,
//             height: originRect.height
//         },
//         target: {
//             x: targetX,
//             y: targetY
//         },
//         type: 'draw',
//         rotate: Math.random() * 10 - 5
//     };
//
//     return { flight, uniqueCard: uniqueCardForHand };
// }
//
// /**
//  * Creates multiple discard flight animations from player's hand to discard pile
//  * @returns Array of flights for each discarded card
//  */
// export function createDiscardFlights(
//     ids: string[],
//     origins: Array<{ rect: DOMRect; id: string; card: HandCard }>,
//     discardTargetRef: React.RefObject<HTMLDivElement>
// ): Flight[] {
//     if (!discardTargetRef.current) return [];
//
//     const t = discardTargetRef.current.getBoundingClientRect();
//     const tx = t.left + t.width / 2;
//     const ty = t.top + t.height / 2;
//
//     const flights: Flight[] = [];
//
//     for (let i = 0; i < origins.length; i++) {
//         const originData = origins[i];
//         const { rect, id, card } = originData;
//
//         if (!rect) continue;
//
//         const flight: Flight = {
//             origin: rect,
//             target: { x: tx, y: ty },
//             id: `${generateFlightId('discard')}-${i}`,
//             card: card,
//             type: 'discard',
//             rotate: Math.random() * 30 - 15
//         };
//
//         flights.push(flight);
//     }
//
//     return flights;
// }
//
// // ============================================================================
// // OPPONENT ACTIONS
// // ============================================================================
//
// /**
//  * Creates a discard flight from opponent's hand to discard pile
//  * Card is face-down since it's from opponent
//  */
// export function createOpponentDiscardFlight(
//     opponentId: string,
//     cardIndex: number,
//     discardTargetRef: React.RefObject<HTMLDivElement>
// ): Flight | null {
//     const opponentSeat = document.querySelector(`[data-opponent-id="${opponentId}"]`);
//     if (!opponentSeat) return null;
//
//     const cardElement = opponentSeat.querySelector(`[data-card-index="${cardIndex}"]`);
//     if (!cardElement || !discardTargetRef.current) return null;
//
//     const originRect = cardElement.getBoundingClientRect();
//     const targetRect = discardTargetRef.current.getBoundingClientRect();
//
//     const targetX = targetRect.left + targetRect.width / 2;
//     const targetY = targetRect.top + targetRect.height / 2;
//
//     // Face-down card for opponent
//     const hiddenCard: FaceCard = {
//         id: generateCardId('opponent-discard'),
//         suit: '🂠',
//         rank: '?',
//         value: 0
//     };
//
//     const flight: Flight = {
//         id: generateFlightId('discard'),
//         card: hiddenCard,
//         origin: {
//             top: originRect.top,
//             left: originRect.left,
//             width: originRect.width,
//             height: originRect.height
//         },
//         target: {
//             x: targetX,
//             y: targetY
//         },
//         type: 'discard',
//         rotate: Math.random() * 30 - 15
//     };
//
//     return flight;
// }
//
// /**
//  * Creates a draw flight from draw pile to opponent's hand
//  */
// export function createOpponentDrawFlight(
//     opponentId: string,
//     drawnCard: FaceCard,
//     drawPileRef: React.RefObject<HTMLDivElement>
// ): Flight | null {
//     if (!drawPileRef.current) return null;
//
//     const drawPileElement = drawPileRef.current.querySelector('.draw-pile-card');
//     const element = drawPileElement || drawPileRef.current;
//     const originRect = element.getBoundingClientRect();
//
//     const opponentSeat = document.querySelector(`[data-opponent-id="${opponentId}"]`);
//     if (!opponentSeat) return null;
//
//     const targetRect = opponentSeat.getBoundingClientRect();
//     const targetX = targetRect.left + targetRect.width / 2;
//     const targetY = targetRect.top + targetRect.height / 2;
//
//     const flight: Flight = {
//         id: generateFlightId('draw'),
//         card: drawnCard,
//         origin: {
//             top: originRect.top,
//             left: originRect.left,
//             width: originRect.width,
//             height: originRect.height
//         },
//         target: {
//             x: targetX,
//             y: targetY
//         },
//         type: 'draw',
//         rotate: Math.random() * 10 - 5
//     };
//
//     return flight;
// }
//
// // ============================================================================
// // GAME STATE UPDATES
// // ============================================================================
//
// /**
//  * Updates opponent card count after an action
//  */
// export function updateOpponentCardCount(
//     opponents: Array<{ id: string; cardCount: number }>,
//     opponentId: string,
//     delta: number
// ) {
//     return opponents.map(opp =>
//         opp.id === opponentId
//             ? { ...opp, cardCount: Math.max(0, opp.cardCount + delta) }
//             : opp
//     );
// }
//
// /**
//  * Removes a card from deck and returns updated deck
//  */
// export function drawFromDeck<T>(deck: T[]): { drawnCard: T | null; remainingDeck: T[] } {
//     if (remainingDeck=== 0) {
//         return { drawnCard: null, remainingDeck: [] };
//     }
//
//     const [drawnCard, ...remainingDeck] = deck;
//     return { drawnCard, remainingDeck };
// }