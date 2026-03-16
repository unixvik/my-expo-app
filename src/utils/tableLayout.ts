// utils/tableLayout.ts

import { ClaimServerState } from "@/types/game";

export type SeatPosition = 'TOP' | 'TOP_LEFT' | 'TOP_RIGHT' | 'MID_LEFT' | 'MID_RIGHT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';



const seatMaps: Record<number, SeatPosition[]> = {
    // 1 Opponent: Direct center top
    1: ['TOP'],

    // 2 Opponents: Balanced corners
    // Order: TOP_LEFT -> TOP_RIGHT (Clockwise)
    2: ['MID_LEFT', 'MID_RIGHT'],

    // 3 Opponents:
    // Order: TOP_LEFT -> TOP -> TOP_RIGHT (Clockwise)
    3: ['MID_LEFT', 'TOP', 'MID_RIGHT'],

    // 4 Opponents:
    // Order: MID_LEFT -> TOP_LEFT -> TOP_RIGHT -> MID_RIGHT
    4: ['BOTTOM_LEFT', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT'],

    // 5 Opponents:
    // Order: MID_LEFT -> TOP_LEFT -> TOP -> TOP_RIGHT -> MID_RIGHT
    5: ['MID_LEFT', 'TOP_LEFT', 'TOP', 'TOP_RIGHT', 'MID_RIGHT'],

    // 6-7 Opponents: Use the full horseshoe
    6: ['BOTTOM_LEFT', 'MID_LEFT', 'TOP_LEFT', 'TOP_RIGHT', 'MID_RIGHT', 'BOTTOM_RIGHT'],
    7: ['BOTTOM_LEFT', 'MID_LEFT', 'TOP_LEFT', 'TOP', 'TOP_RIGHT', 'MID_RIGHT', 'BOTTOM_RIGHT'],
};

export function getSeatedOpponents(
    turnOrder: string[] | undefined,
    myId: string | undefined
) {
    // 1. Verificări de bază: dacă nu avem date, returnăm listă goală
    if (!turnOrder || !myId || turnOrder.length <= 1) return [];

    const myIndex = turnOrder.indexOf(myId);
    if (myIndex === -1) return [];

    // 2. Rotim lista astfel încât primul element să fie jucătorul de după mine
    const rotatedIds = [
        ...turnOrder.slice(myIndex + 1),
        ...turnOrder.slice(0, myIndex)
    ];

    const opponentCount = rotatedIds.length;
    // Mapăm configurația locurilor în funcție de numărul de oponenți
    const currentMap = seatMaps[opponentCount] || seatMaps[5];

    // 3. Returnăm DOAR ID-ul și seat-ul (fără datele despre mână/nume)
    return rotatedIds.map((id, index) => ({
        id,
        seat: currentMap[index]
    }));
}
