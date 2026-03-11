import { THEMES } from "@/theme/theme"
import { useGameStore } from "@/state/useGameStore"

export const useTheme = () => {
    const themeId = useGameStore((state) => state.local.themeId)

    return THEMES[themeId]
}