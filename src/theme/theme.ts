import { makeTheme } from "./makeTheme"
import { midnightTokens } from "./themeTokens"
import { GameTheme } from "./themeTokens"

export const THEMES: Record<string, GameTheme> = {
    midnight: makeTheme(midnightTokens),
}