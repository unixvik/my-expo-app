import { View } from "react-native";
import { StatusBar } from "expo-status-bar"; // 🌟 Import this
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { GameController } from "@/components/GameController";

export default function Index() {
    const { conn, room, connect, disconnect } = useRoomConnection();

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* 🌟 1. Hide the top time/battery bar */}
            <StatusBar hidden={true} />

            <GameController />
        </View>
    );
}