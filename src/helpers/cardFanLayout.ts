// src/helpers/cardFanLayout.ts

import {useDevice} from "@/hooks/useDevice";

/**
 * Clamps a number between min and max
 */
function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

/**
 * Individual card position in a fan layout
 */
export interface CardPosition {
    id: string;
    index: number;
    angle: number;    // Rotation angle in degrees
    lift: number;     // Vertical lift in pixels
    leftPx: number;   // Horizontal position in pixels
}

/**
 * Complete card fan layout
 */
export interface CardFanLayout {
    cards: CardPosition[];
    visible: number;
    total: number;
}

/**
 * Configuration for card fan layout
 */
export interface CardFanConfig {
    spreadDegrees?: number;   // Total angle spread (default: 14)
    cardSpacingPx?: number;   // Horizontal spacing between cards (default: 20)
    liftMultiplier?: number;  // How much cards lift at edges (default: 0.25)
}

/**
 * Calculates a fan layout for opponent's cards
 * Creates a symmetric spread with rotation and lift effects
 *
 * @param cardCount - Total number of cards
 * @param showCards - Maximum cards to show
 * @param config - Optional layout configuration
 * @returns Card fan layout with positions for each card
 */
export function calculateCardFanLayout(
    cardCount: number,
    showCards: number = 4,
    config: CardFanConfig = {}
): CardFanLayout {
    const {
        spreadDegrees = 20,
        cardSpacingPx = 20,
        liftMultiplier = 0.25,
    } = config;

    const visible = clamp(Math.min(cardCount, showCards), 0, showCards);

    // Calculate starting angle for symmetric spread
    const start = -(spreadDegrees * (visible - 1)) / 2;

    const cards: CardPosition[] = Array.from({ length: visible }, (_, i) => {
        const angle = start + i * spreadDegrees;
        const lift = Math.abs(angle) * liftMultiplier;
        const leftPx = i * cardSpacingPx;

        return {
            id: `card-${i}`,
            index: i,
            angle,
            lift,
            leftPx,
        };
    });

    return {
        cards,
        visible,
        total: cardCount,
    };


}
export function calculateCinematicFan(
    count: number,
    isDesktop: boolean,
    scale: number // Added scale factor for responsiveness
) {

    const maxVisible = 6;
    const visible = Math.min(count, maxVisible);

    // Spread settings multiplied by the UI scale
    const radius = (!isDesktop ? 0 : -30) * scale;
    const angleStep = !isDesktop ? 18 : 26;
    const startAngle = -((visible - 1) * angleStep) / 2;

    return Array.from({ length: visible }, (_, i) => {
        const angleDeg = startAngle + i * angleStep;
        const angleRad = (angleDeg * Math.PI) / 180;

        return {
            id: `card-${i}`,
            // Trigonometry for true arc positioning
            translateX: (isDesktop  ? Math.sin(angleRad) * radius : Math.sin(angleRad) * radius -10),
            translateY:  (isDesktop  ? -Math.cos(angleRad) * radius + radius: -Math.cos(angleRad) * radius + radius -20),
            rotate: angleDeg,
            zIndex: i,
            // Slight depth scaling: cards at edges are "further"
            scale: 1 - Math.abs(angleDeg) * 0.000,
        };
    });
}