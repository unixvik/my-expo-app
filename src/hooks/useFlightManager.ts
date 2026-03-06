// import { useState, useRef, useCallback } from 'react';
// import type { Flight, HandCard } from '../types/game';
//
// export function useFlightManager() {
//     const [flights, setFlights] = useState<Flight[]>([]);
//
//     // Stores card data for 'draw' flights so we can resolve them when they land
//     const pendingDrawsRef = useRef<Map<string, HandCard>>(new Map());
//
//     const addFlight = useCallback((flight: Flight) => {
//         setFlights(prev => [...prev, flight]);
//     }, []);
//
//     // ✅ OPTIMIZATION: Removed 'flights' from dependency array
//     // We now ask the caller to tell us the 'type' so we don't have to search state.
//     const removeFlight = useCallback((
//         id: string,
//         type: 'draw' | 'discard' | 'other', // 👈 Added this argument
//         onDrawComplete?: (card: HandCard) => void,
//         onDiscardComplete?: () => void
//     ) => {
//         // 1. Functional update ensures we never have stale state issues
//         setFlights(prev => prev.filter(f => f.id !== id));
//
//         // 2. Handle Side Effects (Landing Logic)
//         if (type === 'draw') {
//             const uniqueCard = pendingDrawsRef.current.get(id);
//
//             if (uniqueCard && onDrawComplete) {
//                 onDrawComplete(uniqueCard);
//                 pendingDrawsRef.current.delete(id);
//                 // Dispatch event for UI sounds/effects
//                 window.dispatchEvent(new Event('card-landed-in-hand'));
//             }
//         } else if (type === 'discard') {
//             if (onDiscardComplete) onDiscardComplete();
//             window.dispatchEvent(new Event('card-landed-on-discard'));
//         }
//     }, []); // 👈 Dependency array is now empty! This function is stable.
//
//     const storePendingDraw = useCallback((flightId: string, card: HandCard) => {
//         pendingDrawsRef.current.set(flightId, card);
//     }, []);
//
//     return {
//         flights,
//         addFlight,
//         removeFlight,
//         storePendingDraw,
//     };
// }