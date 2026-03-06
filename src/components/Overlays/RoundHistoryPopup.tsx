import React, { useMemo, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Animated,
    useWindowDimensions,
} from "react-native";
import { useGameSelector } from "@/state/machine/useGameSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryRow = {
    sessionId: string;
    name: string;
    startTotal: number;
    delta: number;
    endTotal: number;
    wasClaimer: boolean;
};

type HistoryRec = {
    roundIndex: number;
    turnRound?: number;
    rows: HistoryRow[];
};

type Props = {
    open: boolean;
    history: HistoryRec[];
    onClose: () => void;
    title?: string;
};

type PodiumPlayer = {
    sessionId: string;
    name: string;
    score: number;
    rank: 1 | 2 | 3;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDelta(n: number) {
    if (n > 0) return `+${n}`;
    if (n < 0) return `${n}`;
    return `+0`;
}

function isEchoRecord(rec: HistoryRec) {
    return (
        rec.rows.length > 0 &&
        rec.rows.every(
            (r) => (r.delta ?? 0) === 0 && (r.startTotal ?? 0) === (r.endTotal ?? 0)
        )
    );
}

// ─── Rank colours ─────────────────────────────────────────────────────────────

const RANK_COLORS = {
    1: { ring: "#FFD700", glow: "rgba(255,215,0,0.6)", bg: "rgba(255,215,0,0.13)" },
    2: { ring: "#C0C0C0", glow: "rgba(192,192,192,0.5)", bg: "rgba(192,192,192,0.10)" },
    3: { ring: "#CD7F32", glow: "rgba(205,127,50,0.5)", bg: "rgba(205,127,50,0.10)" },
} as const;

// ─── Initials avatar ──────────────────────────────────────────────────────────

function Avatar({ name, size, rank }: { name: string; size: number; rank: 1 | 2 | 3 }) {
    const initials = name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
    const { ring, glow } = RANK_COLORS[rank];
    return (
        <View
            style={{
                width: size, height: size, borderRadius: size / 2,
                borderWidth: rank === 1 ? 3 : 2, borderColor: ring,
                backgroundColor: "rgba(20,12,44,0.95)",
                alignItems: "center", justifyContent: "center",
                shadowColor: glow, shadowOpacity: 1, shadowRadius: rank === 1 ? 14 : 8, elevation: rank === 1 ? 10 : 6,
            }}
        >
            <Text style={{ color: ring, fontWeight: "900", fontSize: size * 0.3, letterSpacing: 0.5 }}>
                {initials}
            </Text>
        </View>
    );
}

// ─── Vertical rank card (side-panel mode) ─────────────────────────────────────

function RankCard({ player, compact, delay }: { player: PodiumPlayer; compact: boolean; delay: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(-24)).current;
    const { ring, bg } = RANK_COLORS[player.rank];
    const medals = ["🥇", "🥈", "🥉"];

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(anim, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
                Animated.spring(slide, { toValue: 0, tension: 70, friction: 7, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity: anim, transform: [{ translateX: slide }],
                flexDirection: "row", alignItems: "center",
                backgroundColor: bg, borderRadius: 12,
                borderWidth: 1, borderColor: ring + "44",
                paddingHorizontal: compact ? 6 : 8, paddingVertical: compact ? 5 : 7,
                gap: 6,
                shadowColor: ring, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
            }}
        >
            <Text style={{ fontSize: compact ? 16 : 20 }}>{medals[player.rank - 1]}</Text>
            <Avatar name={player.name} size={compact ? 28 : 34} rank={player.rank} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: "rgba(230,220,255,0.95)", fontWeight: "900", fontSize: compact ? 9 : 11 }}>
                    {player.name}
                </Text>
                <Text style={{ color: ring, fontWeight: "900", fontSize: compact ? 10 : 12, marginTop: 1 }}>
                    {player.score.toLocaleString()}
                </Text>
            </View>
        </Animated.View>
    );
}

// ─── Horizontal podium (portrait / stacked layout) ────────────────────────────

function PodiumHorizontal({ players, compact }: { players: PodiumPlayer[]; compact: boolean }) {
    // order: 2nd, 1st, 3rd
    const order: (1 | 2 | 3)[] = [2, 1, 3];
    const ordered = order.map((r) => players.find((p) => p.rank === r)).filter(Boolean) as PodiumPlayer[];
    const blockH = compact ? { 1: 46, 2: 32, 3: 24 } : { 1: 60, 2: 42, 3: 32 };
    const blockW = compact ? { 1: 64, 2: 56, 3: 50 } : { 1: 78, 2: 66, 3: 58 };
    const avSize = compact ? { 1: 34, 2: 26, 3: 24 } : { 1: 46, 2: 36, 3: 32 };
    const delays = { 1: 0, 2: 130, 3: 250 };

    return (
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3, paddingTop: 4 }}>
            {ordered.map((p) => {
                const { ring, bg } = RANK_COLORS[p.rank];
                const anim = useRef(new Animated.Value(0)).current;
                const scale = useRef(new Animated.Value(0.4)).current;
                const avatarAnim = useRef(new Animated.Value(0)).current;
                useEffect(() => {
                    Animated.sequence([
                        Animated.delay(delays[p.rank] ?? 0),
                        Animated.parallel([
                            Animated.spring(anim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
                            Animated.spring(scale, { toValue: 1, tension: 65, friction: 6, useNativeDriver: true }),
                        ]),
                        Animated.spring(avatarAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
                    ]).start();
                }, []);

                return (
                    <Animated.View key={p.sessionId} style={{ alignItems: "center", justifyContent: "flex-end", opacity: anim, transform: [{ scale }] }}>
                        <Animated.View
                            style={{
                                alignItems: "center", marginBottom: 4,
                                opacity: avatarAnim,
                                transform: [{ translateY: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                            }}
                        >
                            {p.rank === 1 && <Text style={{ fontSize: compact ? 11 : 15, marginBottom: 1 }}>👑</Text>}
                            <Avatar name={p.name} size={avSize[p.rank]} rank={p.rank} />
                            <Text numberOfLines={1} style={{ color: "rgba(230,220,255,0.95)", fontWeight: "900", fontSize: compact ? 8 : 10, marginTop: 2, maxWidth: blockW[p.rank] + 4, textAlign: "center" }}>
                                {p.name}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 7, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2, borderWidth: 1, borderColor: ring + "55" }}>
                                <Text style={{ fontSize: 6, marginRight: 2 }}>🎵</Text>
                                <Text style={{ color: ring, fontWeight: "900", fontSize: compact ? 8 : 10 }}>{p.score.toLocaleString()}</Text>
                            </View>
                        </Animated.View>
                        <View style={{ width: blockW[p.rank], height: blockH[p.rank], backgroundColor: bg, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 1, borderBottomWidth: 0, borderColor: ring + "44", alignItems: "center", justifyContent: "center", shadowColor: ring, shadowOpacity: 0.25, shadowRadius: 7, elevation: 4 }}>
                            <Text style={{ color: ring, fontWeight: "900", fontSize: compact ? (p.rank === 1 ? 20 : 15) : (p.rank === 1 ? 26 : 20), opacity: 0.65 }}>{p.rank}</Text>
                        </View>
                    </Animated.View>
                );
            })}
        </View>
    );
}

// ─── Body row ─────────────────────────────────────────────────────────────────

function BodyRow({
                     row, playerOrder, index, open, compact,
                 }: {
    row: { key: string; roundLabel: string; kind: "delta" | "grandTotal"; cells: Record<string, string> };
    playerOrder: Array<{ sessionId: string; name: string }>;
    index: number; open: boolean; compact: boolean;
}) {
    const anim = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(18)).current;

    useEffect(() => {
        if (!open) { anim.setValue(0); slide.setValue(18); return; }
        Animated.sequence([
            Animated.delay(Math.min(index * 55, 520)),
            Animated.parallel([
                Animated.spring(anim, { toValue: 1, tension: 75, friction: 7, useNativeDriver: true }),
                Animated.spring(slide, { toValue: 0, tension: 75, friction: 7, useNativeDriver: true }),
            ]),
        ]).start();
    }, [open]);

    const fs = compact ? 10 : 12;
    const py = compact ? 6 : 10;

    return (
        <Animated.View
            style={[
                { flexDirection: "row", alignItems: "center" },
                row.kind === "grandTotal" ? styles.grandTotalRow : null,
                { opacity: anim, transform: [{ translateX: slide }] },
            ]}
        >
            <View style={[styles.cellRound, { paddingVertical: py }]}>
                <Text style={[styles.roundText, { fontSize: fs }, row.kind === "grandTotal" ? styles.grandTotalText : null]}>
                    {row.roundLabel}
                </Text>
            </View>
            {playerOrder.map((p) => (
                <View key={p.sessionId} style={[styles.cell, { paddingVertical: py }]}>
                    <Text numberOfLines={1} style={[
                        styles.cellText, { fontSize: fs },
                        row.kind === "delta" && row.cells[p.sessionId]?.includes("★") ? styles.starCell : null,
                        row.kind === "grandTotal" ? styles.grandTotalText : null,
                    ]}>
                        {row.cells[p.sessionId] ?? "—"}
                    </Text>
                </View>
            ))}
        </Animated.View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RoundHistoryPopup({ open, history, onClose }: Props) {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const isWide = width > 600;
    // Side-by-side: podium left, table right
    const sideBySide = isLandscape || isWide;
    // Compact: tight landscape phone
    const compact = isLandscape && height < 500;

    const gameStatus = useGameSelector((s) => s.game.gameStatus);
    const isGameEnded = gameStatus !== "roundEnded";

    const scrollRef = useRef<ScrollView>(null);
    const cardAnim = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.88)).current;

    useEffect(() => {
        if (open) {
            Animated.parallel([
                Animated.spring(cardAnim, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
                Animated.spring(cardScale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
            ]).start();
        } else {
            cardAnim.setValue(0);
            cardScale.setValue(0.88);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 480);
            return () => clearTimeout(t);
        }
    }, [open, history]);

    const model = useMemo(() => {
        const raw = [...(history ?? [])].sort((a, b) =>
            a.roundIndex !== b.roundIndex ? a.roundIndex - b.roundIndex : (a.turnRound ?? 0) - (b.turnRound ?? 0)
        );
        const noEcho = raw.filter((r) => !isEchoRecord(r));
        const seenKeys = new Set<string>();
        const dedupedRev: HistoryRec[] = [];
        for (let i = noEcho.length - 1; i >= 0; i--) {
            const k = `${noEcho[i].roundIndex}|${noEcho[i].turnRound ?? 0}`;
            if (!seenKeys.has(k)) { seenKeys.add(k); dedupedRev.push(noEcho[i]); }
        }
        const deduped = dedupedRev.reverse();

        const playerOrder: Array<{ sessionId: string; name: string }> = [];
        const seenPlayers = new Set<string>();
        for (const rec of deduped) {
            for (const r of rec.rows) {
                if (!seenPlayers.has(r.sessionId)) { seenPlayers.add(r.sessionId); playerOrder.push({ sessionId: r.sessionId, name: r.name }); }
            }
        }

        const tableRows: Array<{ key: string; roundLabel: string; kind: "delta" | "grandTotal"; cells: Record<string, string> }> = [];
        const latestEndTotal: Record<string, number> = {};

        for (const rec of deduped) {
            const byId: Record<string, HistoryRow> = {};
            rec.rows.forEach((r) => (byId[r.sessionId] = r));
            const cells: Record<string, string> = {};
            for (const p of playerOrder) {
                const r = byId[p.sessionId];
                if (!r) { cells[p.sessionId] = "—"; continue; }
                cells[p.sessionId] = `${r.startTotal} ${fmtDelta(r.delta)}${r.wasClaimer ? " ★" : ""}`;
                latestEndTotal[p.sessionId] = r.endTotal;
            }
            tableRows.push({ key: `r${rec.roundIndex}|t${rec.turnRound ?? 0}`, roundLabel: `${rec.roundIndex}`, kind: "delta", cells });
        }

        const grand: Record<string, string> = {};
        for (const p of playerOrder) grand[p.sessionId] = `${latestEndTotal[p.sessionId] ?? 0}`;
        tableRows.push({ key: "grandTotal", roundLabel: "TOTAL", kind: "grandTotal", cells: grand });

        const podiumPlayers: PodiumPlayer[] = [...playerOrder]
            .map((p) => ({ ...p, score: latestEndTotal[p.sessionId] ?? 0 }))
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((p, i) => ({ ...p, rank: (i + 1) as 1 | 2 | 3 }));

        return { playerOrder, tableRows, podiumPlayers };
    }, [history]);

    if (!open) return null;

    // const showPodium = isGameEnded && model.podiumPlayers.length >= 2;
    const showPodium = true;
    const cardPad = compact ? 10 : 14;

    return (
        <View style={styles.overlay} pointerEvents="auto">
            {/* Backdrop */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: cardAnim, backgroundColor: "rgba(0,0,0,0.72)" }]}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
            </Animated.View>

            {/* Card */}
            <Animated.View
                style={[
                    styles.card,
                    {
                        padding: cardPad,
                        width: sideBySide ? Math.min(width * 0.94, 820) : Math.min(width * 0.92, 480),
                        maxHeight: height * (compact ? 0.97 : 0.9),
                        opacity: cardAnim,
                        transform: [
                            { scale: cardScale },
                            { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                        ],
                    },
                ]}
            >
                {/* Title */}
                <Text style={[styles.title, compact && { fontSize: 13, marginBottom: 8 }]}>
                    {isGameEnded ? "🏆  GAME ENDED!" : "📊  MATCH HISTORY"}
                </Text>

                {/* Content area */}
                <View style={[styles.content, sideBySide && showPodium ? { flexDirection: "row", gap: 10 } : { flexDirection: "column" }]}>

                    {/* ── Podium panel ── */}
                    {showPodium && (
                        <View
                            style={
                                sideBySide
                                    ? {
                                        width: compact ? 138 : 168,
                                        borderRightWidth: 1,
                                        borderRightColor: "rgba(180,160,255,0.14)",
                                        paddingRight: compact ? 8 : 10,
                                        justifyContent: "center",
                                        gap: compact ? 6 : 8,
                                    }
                                    : { marginBottom: 10 }
                            }
                        >
                            {sideBySide ? (
                                // Vertical rank cards in side panel
                                <View style={{ gap: compact ? 6 : 8 }}>
                                    <Text style={{ color: "rgba(180,160,255,0.7)", fontSize: compact ? 8 : 9, fontWeight: "900", letterSpacing: 1.5, textAlign: "center", marginBottom: 2 }}>
                                        RANKINGS
                                    </Text>
                                    {[...model.podiumPlayers]
                                        .sort((a, b) => a.rank - b.rank)
                                        .map((p) => (
                                            <RankCard key={p.sessionId} player={p} compact={compact} delay={(p.rank - 1) * 130} />
                                        ))}
                                </View>
                            ) : (
                                <PodiumHorizontal players={model.podiumPlayers} compact={compact} />
                            )}
                        </View>
                    )}

                    {/* ── Table ── */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                        {/* Fixed header */}
                        <View style={[styles.row, styles.headerRow]}>
                            <View style={[styles.cellRound, compact && { paddingVertical: 7 }]}>
                                <Text style={[styles.headerText, compact && { fontSize: 9 }]}>Rnd</Text>
                            </View>
                            {model.playerOrder.map((p) => (
                                <View key={p.sessionId} style={[styles.cell, compact && { paddingVertical: 7 }]}>
                                    <Text numberOfLines={1} style={[styles.headerText, compact && { fontSize: 9 }]}>{p.name}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Scrollable rows */}
                        <ScrollView
                            ref={scrollRef}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingBottom: 4 }}
                            showsVerticalScrollIndicator={false}
                            bounces
                        >
                            {model.tableRows.map((r, i) => (
                                <BodyRow key={r.key} row={r} playerOrder={model.playerOrder} index={i} open={open} compact={compact} />
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Action button */}
                <Pressable onPress={onClose} style={[styles.btn, compact && { paddingVertical: 8, marginTop: 8 }]}>
                    <Text style={[styles.btnText, compact && { fontSize: 11 }]}>
                        {isGameEnded ? "🎮  END GAME" : "⚡  NEXT ROUND"}
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        backgroundColor: "rgba(8,6,18,0.97)",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(180,160,255,0.22)",
        shadowColor: "rgba(168,85,247,1)",
        shadowOpacity: 0.45,
        shadowRadius: 32,
        elevation: 24,
	minHeight: "60%"
    },
    title: {
        color: "rgba(230,220,255,0.97)",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 12,
        textAlign: "center",
    },
    content: {
        flex: 1,
        minHeight: 80,
        overflow: "hidden",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(180,160,255,0.12)",
    },
    row: { flexDirection: "row", alignItems: "center" },
    headerRow: {
        backgroundColor: "rgba(180,160,255,0.11)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(180,160,255,0.14)",
    },
    headerText: { color: "rgba(200,180,255,0.95)", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
    cellRound: { flex: 0.55, paddingVertical: 10, paddingHorizontal: 10 },
    cell: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, borderLeftWidth: 1, borderLeftColor: "rgba(200,180,255,0.10)" },
    roundText: { color: "rgba(200,180,255,0.75)", fontWeight: "900", fontSize: 12 },
    cellText: { color: "rgba(230,220,255,0.90)", fontWeight: "800", fontSize: 12 },
    starCell: { color: "rgba(255,215,0,0.97)" },
    grandTotalRow: {
        borderTopWidth: 1,
        borderTopColor: "rgba(180,160,255,0.22)",
        backgroundColor: "rgba(168,85,247,0.07)",
    },
    grandTotalText: { color: "rgba(255,215,0,0.97)", fontWeight: "900" },
    btn: {
        alignSelf: "flex-end",
        marginTop: 12,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 14,
        backgroundColor: "rgba(168,85,247,0.22)",
        borderWidth: 1,
        borderColor: "rgba(168,85,247,0.45)",
        shadowColor: "rgba(168,85,247,1)",
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
    },
    btnText: { color: "rgba(230,220,255,0.97)", fontWeight: "900", letterSpacing: 2, fontSize: 13 },
});
