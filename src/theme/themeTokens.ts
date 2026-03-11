export interface CardBackPattern {
    margins: string;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
}

export interface CardBackEmblem {
    symbol: string;
    fontSize: number;
    color: string;
    opacity: number;
    fontWeight: string;
}

export interface CardBackStripe {
    backgroundColor: string;
    opacity: number;
    height: number;
    transform: any[];
}

export interface CardBackTheme {
    backgroundColor: string;
    pattern: CardBackPattern;
    stripe: CardBackStripe;
    emblem: CardBackEmblem;
}

export interface CardFrontTheme {
    backgroundColor: string;
}

export interface CardsTheme {
    cardBack: CardBackTheme;
    cardFront: CardFrontTheme;
    suitRed: string;
    suitBlack: string;
    selectedBorder: string;
}

export interface TableTheme {
    vignette?: string;
    rail?: string;
    rim?: string;
    rimGradient?: [string, string, string, string?, string?];
    surfaceGradient?: [string, string, string?];
    gridOpacity?: number;
}

export interface PlayerZone {
    backgroundArea: string;
}

export interface GameTheme {
    id: "midnight";
    background: string;
    surface: string;
    accent: string;
    cards: CardsTheme;
    text: {
        primary: string;
        secondary: string;
    };
    shadow: string;
    table: TableTheme;
    playerZone: PlayerZone;
}

export interface ThemeTokens {
    background: string
    surface: string
    accent: string

    textPrimary: string
    textSecondary: string

    suitRed: string
    suitBlack: string
    shadow: string

    // visual identity tokens
    cardSymbol: string
    cardBackColor: string
    table: {
        vignette?: string
        rail?: string
        rim?: string
        surfaceGradient?: [string, string, string?]
        rimGradient?: [string, string, string, string?, string?]
        gridOpacity?: number
    }
    playerZone: {
        backgroundArea: string;
    }
}
export const midnightTokens: ThemeTokens = {
    background: "#37373a",
    surface: "#255bb3",
    accent: "#656871",

    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",

    suitRed: "#ba2525",
    suitBlack: "#000",

    shadow: "rgba(0,0,0,0.5)",

    // visual identity
    cardSymbol: "◆",
    cardBackColor: "#1E293B",

    table: {
        vignette: "rgba(0,20,60,0.35)",
        rail: "rgba(0,180,255,0.62)",
        rim: "rgba(7,51,71,0.75)",

        surfaceGradient: [
            "#1d477c",
            "#2662ae",
            "#133873"
        ],

        rimGradient: [
            "rgba(50,40,30,0.91)",
            "rgba(50,40,30,0.15)",
            "rgba(50,40,30,0.91)"
        ],

        gridOpacity: 0
    },
    playerZone: {
        backgroundArea: "rgba(19,56,115,0.59)",
    }
}
export const casinoTokens: ThemeTokens = {
    playerZone: {backgroundArea: ""},
    table: {},
    background: "#0f172a",
    surface: "#1b5e20",
    accent: "#ffd700",

    textPrimary: "#ffffff",
    textSecondary: "#94a3b8",

    suitRed: "#e53935",
    suitBlack: "#000",

    shadow: "rgba(0,0,0,0.6)",

    cardSymbol: "♠",
    cardBackColor: "#0b3d0b"
}