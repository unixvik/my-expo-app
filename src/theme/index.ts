import { THEME_REGISTRY } from "@/theme/themeRegistry";
import { createTheme, type Theme } from "./createTheme";
import { ThemeId } from "./themes";

export const THEMES: Record<ThemeId, Theme> = Object.fromEntries(
    Object.entries(THEME_REGISTRY).map(([id, spec]) => [id, createTheme(spec)])
) as any;

export const DEFAULT_THEME_ID: ThemeId = "monochromeInk";

export function getTheme(id: ThemeId | undefined): Theme {
    return THEMES[id ?? DEFAULT_THEME_ID] ?? THEMES[DEFAULT_THEME_ID];
}

export type { ThemeId, Theme };
