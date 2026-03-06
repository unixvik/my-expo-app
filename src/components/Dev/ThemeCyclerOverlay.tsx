import React, { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";

import { THEMES, DEFAULT_THEME_ID, type ThemeId } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { useGameSelector } from "@/state/machine/useGameSelector";
import { useGameCommands } from "@/state/machine/useGameCommands";
import { selectThemeId } from "@/state/machine/selector";

function ThemeCyclerOverlayImpl() {
    const t = useTheme();
    const themeId = useGameSelector(selectThemeId) ?? DEFAULT_THEME_ID;
    const { setTheme } = useGameCommands();

    const ids = useMemo(() => Object.keys(THEMES) as ThemeId[], []);
    const idx = ids.indexOf(themeId);
    const nextId = ids[(idx + 1) % ids.length] ?? DEFAULT_THEME_ID;

    const onPress = useCallback(() => {
        setTheme(nextId);
    }, [setTheme, nextId]);

    const label = THEMES[themeId]?.name ?? themeId;

    return (
        <View pointerEvents="box-none" style={styles.root}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.btn,
                    {
                        backgroundColor: t.components.ui.popupBg,
                        borderColor: t.components.ui.popupBorder,
                        opacity: pressed ? 0.85 : 1,
                        ...(Platform.OS === "ios"
                            ? {
                                shadowColor: "#000",
                                shadowOpacity: 0.22,
                                shadowRadius: 16,
                                shadowOffset: { width: 0, height: 10 },
                            }
                            : { elevation: 8 }),
                    },
                ]}
            >
                <View style={[styles.dot, { backgroundColor: t.semantic.accent }]} />
                <Text style={[styles.text, { color: t.semantic.text }]}>
                    Theme: {label}
                </Text>
                <Text style={[styles.hint, { color: t.semantic.textMuted }]}>
                    tap → {THEMES[nextId]?.name ?? nextId}
                </Text>
            </Pressable>
        </View>
    );
}

export const ThemeCyclerOverlay = memo(ThemeCyclerOverlayImpl);

const styles = StyleSheet.create({
    root: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 9999,
    },
    btn: {
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minWidth: 170,
        maxWidth: 240,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginBottom: 6,
    },
    text: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    hint: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: "700",
        opacity: 0.9,
    },
});
