// src/state/constants.ts
/**
 * CLAIM (Cabo) - Global Engine Constants
 */

// 1. GEOMETRY & RATIOS
export const CARD_ASPECT_RATIO = 1.45; // Height / Width
export const CARD_RADIUS_RATIO = 0.2;  // Radius / Width
export const BASE_CARD_WIDTH   = 40;   // Design-unit width of center/table cards
export const PLAYER_CARD_WIDTH = 40;   // Design-unit width of hand cards
export const TABLE_OVAL_RATIO  = 1.8;  // Aspect ratio of the table oval
export const CARD_ATU_ROTATE_Z = "100deg";
export const TABLE_TILT = 38;         // Degrees for 3D Perspective
export const TABLE_PERSPECTIVE = 600;


// 3. SANDIA PHYSICS (Reanimated Spring Configs)
export const SPRING_CONFIGS = {
    // Airy, smooth flight for draws/dealing
    FLIGHT: { damping: 18, stiffness: 120, mass: 1 },

    // Snappy, heavy landing for discards
    THUD: { damping: 12, stiffness: 200, mass: 1.2 },

    // Fast, stiff correction for illegal moves/prediction fails
    REVERT: { damping: 20, stiffness: 300 },

    // Gentle UI transitions
    UI_GENTLE: { damping: 25, stiffness: 150 },
};

// 4. Z-INDEX REGISTRY (Uniformity)
export const Z_INDEX = {
    TABLE: 1,
    PILES: 100,
    ATU: -1,
    HAND: 10,
    UI_OVERLAYS: 100,
    CARD_PORTAL: 999, // The "King" layer
    MODALS: 2000,
};


// 5. SHADOW REGISTRY
export const SHADOW_TOKENS = {
    color: "rgba(0,0,0,1)",
    soft:   { opacity: 0.28, radius: 14, offsetY: 10, elevation: 10 },
    medium: { opacity: 0.40, radius: 16, offsetY: 12, elevation: 12 },
    heavy:  { opacity: 0.65, radius: 22, offsetY: 16, elevation: 18 },
    contact:{ opacity: 0.50, radius: 4,  offsetY: 10,  elevation: 3  },
    glow:   { opacity: 0.55, radius: 14, offsetY: 10,  elevation: 3  },
};

/**
 * Helper to generate React Native shadow objects from tokens
 */
export function rnShadow(p: keyof typeof SHADOW_TOKENS | typeof SHADOW_TOKENS['soft']) {
    const config = typeof p === 'string' ? SHADOW_TOKENS[p] : p;

    // Safety check in case of wrong key
    if (!config || typeof config === 'string') return {};

    return {
        shadowColor: SHADOW_TOKENS.color,
        shadowOpacity: config.opacity,
        shadowRadius: config.radius,
        shadowOffset: { width: 0, height: config.offsetY },
        elevation: config.elevation,
    } as const;
}