import { makeTheme } from "./makeTheme"
import {casinoTokens, midnightTokens} from "./themeTokens"
import { GameTheme } from "./themeTokens"

export const THEMES: Record<string, GameTheme> = {
    // midnight: makeTheme(midnightTokens),
    casino: makeTheme(casinoTokens),
}