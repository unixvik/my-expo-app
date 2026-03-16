import React, {useEffect, useRef} from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useGameStore } from '@/state/useGameStore';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/Common/AppText';
import { globalRoom } from "@/api/roomInstance";

export const LobbyScreen = () => {
    const theme = useTheme();

    // 1. Connection & Sync status
    const conn = useGameStore((s) => s.conn);
    const isSynced = useGameStore((s) => s.isInitialStateSynced);

    // const { room } =useRoomConnection();
    // 2. Server Truth Data
    const players = useGameStore((s) => s.server.players);
    const minPlayers = useGameStore((s) => s.server.minPlayers);
    const playerEntries = Object.values(players);

    // 3. UI Actions
    const themeId = useGameStore((s) => s.local.themeId);
    const setTheme = useGameStore((s) => s.setTheme);
    // Assuming you added requestAddBot to your store as discussed!
    const requestAddBot = useGameStore((s) => s.requestAddBot);

    const setPlayerReady = useGameStore((s) => s.setPlayerReady);


    const room= globalRoom;

// console.log(globalRoom);
    // ========================================
    // AUTO ADD BOTS AND PLAY IN ORDER TO TEST
    // ========================================

    const BOTS_TO_ADD = 1;
    const hasInitializedBots = useRef(false);

    useEffect(() => {
        if (BOTS_TO_ADD <= 0) return;
        if (!room?.state?.players) return;

        if (room.state.players.size >= 8) return;

        for (let i = 0; i < BOTS_TO_ADD; i++) {
            if (room.state.players.size + i >= 8) break;
            requestAddBot(room);
        }

        room.send("playerReady");
        hasInitializedBots.current = true;
    }, [room]);


    // ========================================

    // --- LOADING STATE ---
    if (!isSynced || conn.status !== 'connected') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.accent} />
                <AppText style={{ marginTop: 20, textAlign: 'center' }}>
                    Syncing with Claim Server...
                </AppText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* --- HEADER --- */}
            <View style={styles.header}>
                <AppText style={styles.title}>CLAIM LOBBY</AppText>
                <View style={[styles.badge, { backgroundColor: theme.surface }]}>
                    <AppText variant="secondary" style={styles.badgeText}>
                        ROOM: {conn.roomId}
                    </AppText>
                </View>
            </View>

            {/* --- PLAYER LIST --- */}
            <View style={styles.listHeader}>
                <AppText variant="secondary" style={styles.sectionLabel}>
                    PLAYERS ({playerEntries.length}/{minPlayers}+)
                </AppText>

                {/* Only show Add Bot if there is room. (Assuming max 4 for Claim) */}
                {playerEntries.length < 4 && (
                    <TouchableOpacity onPress={() => requestAddBot(globalRoom)}>
                        <AppText style={{ color: theme.accent, fontSize: 14 }}>+ Add Bot</AppText>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.playerList}>
                {playerEntries.map((player) => {
                    const isMe = player.sessionId === conn.sessionId;

                    // Determine border color based on status
                    let borderColor = 'transparent';
                    if (isMe) borderColor = theme.accent;
                    if (!player.connected) borderColor = '#EF4444'; // Red for offline

                    return (
                        <View
                            key={player.id}
                            style={[styles.playerRow, { backgroundColor: theme.surface, borderColor }]}
                        >
                            <View style={styles.playerInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <AppText style={{ textDecorationLine: player.connected ? 'none' : 'line-through' }}>
                                        {player.name} {isMe ? "(You)" : ""}
                                    </AppText>

                                    {/* --- NEW SCHEMA TAGS --- */}
                                    {player.isHost && (
                                        <View style={[styles.tag, { backgroundColor: theme.accent }]}>
                                            <AppText style={styles.tagText}>HOST</AppText>
                                        </View>
                                    )}
                                    {player.isBot && (
                                        <View style={[styles.tag, { backgroundColor: '#8B5CF6' }]}>
                                            <AppText style={styles.tagText}>AI</AppText>
                                        </View>
                                    )}
                                </View>

                                <AppText variant="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                                    {!player.connected ? "Offline" : `ID: ${player.id.slice(0, 6)}...`}
                                </AppText>
                            </View>

                            {/* Ready Dot is grayed out if offline */}
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: !player.connected ? '#334155' : player.ready ? '#22C55E' : '#64748B' }
                            ]} />
                        </View>
                    );
                })}
            </ScrollView>

            {/* --- FOOTER / CONTROLS --- */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.themeToggle, { borderColor: theme.accent }]}
                    // onPress={() => setTheme(themeId === 'midnight' ? 'classic' : 'midnight')}
                >
                    <AppText style={{ color: theme.accent }}>
                        Switch to {themeId === 'midnight' ? 'Classic' : 'Midnight'}
                    </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.readyButton, { backgroundColor: theme.accent }]}
                     onPress={() => setPlayerReady(globalRoom)}>

                    <AppText style={{ color: theme.background, fontWeight: 'bold' }}>
                        I'M READY
                    </AppText>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    header: { marginBottom: 32, alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionLabel: { fontSize: 14, fontWeight: 'bold' },
    playerList: { flex: 1 },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 2
    },
    playerInfo: { flex: 1 },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    footer: { marginTop: 20, gap: 12 },
    themeToggle: { padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    readyButton: { padding: 18, borderRadius: 16, alignItems: 'center' }
});