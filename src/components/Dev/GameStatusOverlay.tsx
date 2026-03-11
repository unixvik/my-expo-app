import {memo} from "react";
import {useRoomConnection} from "@/hooks/useRoomConnection";
import {ScrollView,StyleSheet,Text} from "react-native";
import {useGameStore} from "@/state/useGameStore";
import {useAwaitingDraw, useSelf} from "@/state/gameSelectors";

export const GameStatusOverlay = memo(function GameStatusOverlay() {
    // const { conn, room, connect, disconnect } = useRoomConnection();

    const me = useSelf();
    const mandatoryDraw = useAwaitingDraw();

    const conn = useGameStore((s) => s.conn);
    const status = useGameStore((s)=>s.server.gameStatus);
    const isSynced = useGameStore((s) => s.isInitialStateSynced);
    const playerKey = useGameStore((s)=> s.playerKey);
    const isMyTurn = useGameStore((s)=> s.checkIfMyTurn(conn.sessionId));
    // const mandatoryDraw = useGameStore((s) => s.isAwaitingDraw());
    // 2. Grab Player list from Server Truth
    const players = useGameStore((s) => s.server.players);
    const playerEntries = Object.values(players);
    return(
        <ScrollView  style={hud.wrap}>

            <Text style={hud.title}>STATE</Text>
            {/* Connection */}
            <Text style={hud.row}><Text style={hud.k}>connection status:</Text> {String(conn.status)}</Text>
            <Text style={hud.row}><Text style={hud.k}>Server status:</Text> {String(status)}</Text>
            <Text style={hud.row}><Text style={hud.k}>Room:</Text> {String(conn?.roomId)}</Text>
            <Text style={hud.row}><Text style={hud.k}>SessionId:</Text> {String(conn?.sessionId)}</Text>
            <Text style={hud.row}><Text style={hud.k}>Is Synced?:</Text> {String(isSynced)}</Text>
            <Text style={hud.row}><Text style={hud.k}>Player Key:</Text> {String(playerKey)}</Text>
            <Text style={hud.title}>---</Text>
            <Text style={hud.row}><Text style={hud.k}>mandatoryDraw:</Text> {String(mandatoryDraw)}</Text>

        </ScrollView>
            );

});
const hud = StyleSheet.create({
    wrap: {
        position: "absolute",
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.65)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        zIndex: 100,
        maxWidth: 260,
        flex: 1
    },
    title: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 4,
    },
    row: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 12,
        lineHeight: 16,
    },
    k: {
        color: "rgba(0,255,255,0.6)",
        fontWeight: "700",
    },
    sep: {
        marginTop: 6,
        color: "rgba(255,255,255,0.4)",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
    },
    sub: {
        marginTop: 4,
        color: "rgba(255,255,255,0.6)",
        fontSize: 10,
    },
});
