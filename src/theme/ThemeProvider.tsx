import React, { createContext, useContext, useMemo } from "react";
import { getTheme, type Theme, type ThemeId } from "./index";

const ThemeContext = createContext<Theme>(getTheme(undefined));

export function ThemeProvider({
                                  themeId,
                                  children,
                              }: {
    themeId?: ThemeId;
    children: React.ReactNode;
}) {
    const theme = useMemo(() => getTheme(themeId), [themeId]);
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
