// src/theme/themeRegistry.ts
import { THEME_SPECS, type ThemeId, type ThemeSpec } from "./themes";

import { emeraldCathedral } from "./specs/emeraldCathedral";
import { arcticGlass } from "./specs/arcticGlass";
import { infernoNoir } from "./specs/infernoNoir";
import { neonSynthwave } from "./specs/neonSynthwave";
import { bourbonLeather } from "./specs/bourbonLeather";

const EXTRA_SPECS: Record<ThemeId, ThemeSpec> = {
    emeraldCathedral,
    arcticGlass,
    infernoNoir,
    neonSynthwave,
    bourbonLeather,
} as any;

// ✅ Final source of truth
export const THEME_REGISTRY: Record<ThemeId, ThemeSpec> = {
    ...THEME_SPECS,   // your original 10
    ...EXTRA_SPECS,   // new files
};
