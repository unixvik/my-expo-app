// src/helpers/idGenerator.ts

let idCounter = 0;

export function generateUniqueId(prefix: string = 'id'): string {
    return `${prefix}-${Date.now()}-${++idCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateFlightId(type: 'draw' | 'discard'): string {
    return generateUniqueId(type);
}

export function generateCardId(prefix: string = 'card'): string {
    return generateUniqueId(prefix);
}