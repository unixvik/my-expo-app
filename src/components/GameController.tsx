import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { LobbyScreen } from '@/components/Screens/LobbyScreen';
import { GameBoard } from '@/components/Screens/GameBoard';
import { useGameStore } from '@/state/useGameStore';
import { AppText } from '@/Common/AppText';
import { useSyncServer } from "@/hooks/useSyncServer";

// 🌟 FIX: Import the stable global instance
import { globalRoom } from "@/api/roomInstance";

export const GameController = () => {

    // 🌟 Engages the Sync & Mutex Pipeline
    useSyncServer(globalRoom);

    // 1. Watch the status from the Server Truth
    const status = useGameStore((s) => s.server.gameStatus);
    const isSynced = useGameStore((s) => s.isInitialStateSynced);

    // 2. Handle the "Waiting for Data" state
    if (!isSynced) {
        return <LoadingOverlay message="Connecting to Claim..." />;
    }

    // 3. The State-Driven Switch
    switch (status) {
        case 'waiting': // Lobby
            return <LobbyScreen />;

        // case 'starting': // Countdown / Animation phase
        //     return <LoadingOverlay message="Dealing Cards..." />;
        case 'starting':
        case 'playing': // The actual game
            return <GameBoard />;

        case 'roundEnded':
            return <AppText>Game Over!</AppText>;

        default:
            return <LobbyScreen />;
    }
};

const LoadingOverlay = ({ message }: { message: string }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <AppText style={{ marginTop: 10 }}>{message}</AppText>
    </View>
);