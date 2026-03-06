import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useDevice } from "@/hooks/useDevice";

function DiscardButton({
                           selectedCount,
                           handleDiscard,
                       }: {
    selectedCount: number;
    handleDiscard: () => void;
}) {
    const { isDesktop } = useDevice();
    const top = isDesktop ? -208 : -96;

    const show = selectedCount > 0;

    const pop = useMemo(
        () => ({
            from: { opacity: 0, translateY: 14, scale: 0.92 },
            animate: { opacity: 1, translateY: 0, scale: isDesktop ? 1 : 0.85 },
            exit: { opacity: 0, translateY: 14, scale: 0.95 },
            transition: { type: "spring", damping: 118, stiffness: 260 },
        }),
        [isDesktop]
    );

    const sheenTransition = useMemo(
        () => ({
            type: "timing",
            duration: 900,
            loop: true,
            repeatReverse: false,
            delay: 500,
        }),
        []
    );

    return (
        <AnimatePresence>
            {show && (
                <MotiView
                    from={pop.from}
                    animate={pop.animate}
                    exit={pop.exit}
                    transition={pop.transition as any}
                    style={[styles.container, { top }]}
                >
                    <View style={styles.centerWrap}>
                        <Pressable onPress={handleDiscard} style={styles.pressable}>
                            <LinearGradient
                                colors={["#ef4444", "#dc2626", "#7f1d1d"]}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={styles.bg}
                            />

                            <View style={styles.insetHighlight} />
                            <View style={styles.glow} />

                            <MotiView
                                from={{ translateX: -220, opacity: 0.0 }}
                                animate={{ translateX: 220, opacity: 0.35 }}
                                transition={sheenTransition as any}
                                style={styles.sheenWrap}
                                pointerEvents="none"
                            >
                                <LinearGradient
                                    colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sheen}
                                />
                            </MotiView>

                            <View style={styles.textRow} pointerEvents="none">
                                <Text style={styles.text}>DISCARD</Text>

                                {selectedCount > 1 && (
                                    <View style={styles.badgeOuter}>
                                        <BlurView intensity={18} tint="light" style={styles.badgeBlur}>
                                            <Text style={styles.badgeText}>×{selectedCount}</Text>
                                        </BlurView>
                                    </View>
                                )}
                            </View>

                            <View style={styles.border} pointerEvents="none" />
                        </Pressable>
                    </View>
                </MotiView>
            )}
        </AnimatePresence>
    );
}

export default React.memo(DiscardButton);


const styles = StyleSheet.create({
    container: {
        position: "absolute",
        zIndex: 50,
        width: "100%",
        alignItems: "center",
        // backgroundColor: '#fff'
    },
    centerWrap: {
        alignItems: "center",
    },
    pressable: {
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 16,
        overflow: "hidden",
    },
    pressed: {
        transform: [{translateY: -4}, {scale: 1.01}],
    },

    bg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
    },
    insetHighlight: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        // subtle top highlight
        shadowColor: "#ffffff",
        shadowOpacity: 0.25,
        shadowRadius: 1,
        shadowOffset: {width: 0, height: 1},
    },

    glow: {
        position: "absolute",
        left: -20,
        right: -20,
        top: -20,
        bottom: -20,
        borderRadius: 999,
        backgroundColor: "rgba(220, 38, 38, 0.35)",
        opacity: 0.6,
        // On iOS this reads as a soft bloom; Android is harsher (still ok)
    },

    sheenWrap: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 140,
        transform: [{skewX: "-12deg" as any}],
    },
    sheen: {
        flex: 1,
    },

    textRow: {
        position: "relative",
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    text: {
        color: "white",
        fontWeight: "900",
        fontSize: 12,
        letterSpacing: 3, // ~ tracking-[0.25em]
        textTransform: "uppercase",
        // drop shadow-ish
        textShadowColor: "rgba(0,0,0,0.35)",
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },

    badgeOuter: {
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },
    badgeBlur: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        backgroundColor: "rgba(255,255,255,0.18)",
    },
    badgeText: {
        color: "white",
        fontWeight: "700",
        fontSize: 10,
    },

    border: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.22)",
    },
});
