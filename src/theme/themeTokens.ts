import {THEMES} from "@/theme/theme";

export interface CardBackEmblem {
    symbol: string;
    fontSize: number;
    color: string;
    opacity: number;
    fontWeight: string;
}


export interface CardBackTheme {
    backgroundColor: string;
    image?: any; // require('@/assets/images/card-back.png') — overrides pattern/stripe/emblem when set
    emblem: CardBackEmblem;
}

export interface CardFrontTheme {
    backgroundColor: string;
    suitRed: string;
    suitBlack: string;
    image?: any; // require('@/assets/images/card-back.png') — overrides pattern/stripe/emblem when set
}

export interface CardBorderTheme {
    selectedBorder: string;
    defaultBorder: string;
    borderSize: number;
    borderRadius: number;
}

export interface CardsTheme {
    cardBack: CardBackTheme;
    cardFront: CardFrontTheme;
    cardBorders: CardBorderTheme;

}

export interface TableTheme {

}

export interface PlayerZone {
    backgroundArea: string;
}

export interface GameTheme {
    id: "midnight" | "casino";
    background: string;
    surface: string;
    accent: string;
    cards: CardsTheme;

    text: {
        primary: string;
        secondary: string;
    }
    shadow: string;
    table: TableTheme;
    playerZone: PlayerZone;
}

export interface ThemeTokens {
    background: string
    surface: string
    accent: string

    text: {
        primary: string
        secondary: string
    }

    cards: CardsTheme;

    table: {}
    playerZone: {
        backgroundArea: string;
    }
}

export const midnightTokens: ThemeTokens = {
    background: "#37373a",
    surface: "#255bb3",
    accent: "#656871",

    text: {
        primary: "#F8FAFC",
        secondary: "#3371af",
    },
    suitRed: "#ba2525",
    suitBlack: "#000",

    shadow: "rgba(0,0,0,0.5)",

    // visual identity
    cards: {
        cardBack: {
            emblem: {
                symbol: "◆",
                fontSize: 0,
                color: "",
                opacity: 0,
                fontWeight: ""
            },
            backgroundColor: "",
        },
        cardFront: {
            backgroundColor: "",
            suitRed: "",
            suitBlack: ""
        },
        cardBorders: {
            selectedBorder: "",
            defaultBorder: "",
            borderSize: 0,
            borderRadius: 0
        }
    },

    cardBackImage: require('@/assets/images/cards.png'),
    cardBorder: "#eac408",
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

    text: {
        primary: "#ffffff",
        secondary: "#94a3b8",
    },


    cards: {
        cardBack: {
            backgroundColor: "",
            emblem: {
                symbol: "♠",
                fontSize: 10,
                color: "#FF0000",
                opacity: 1,
                fontWeight: "normal"
            },
            image: require('@/assets/themes/casino/cardBack.png'),
        },
        cardFront: {
            backgroundColor: "#FFF",
            suitRed: "#83120e",
            suitBlack: "#272525",
            image: require('@/assets/themes/casino/cardFront.jpg'),
        },
        cardBorders: {
            selectedBorder: "#ffdf00",
            defaultBorder: "rgb(50,45,45)",
            borderSize: 1,
            borderRadius: 4,
        }
    },

}