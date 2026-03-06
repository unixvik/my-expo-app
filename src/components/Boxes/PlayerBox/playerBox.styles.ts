import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    identityRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(4, 3, 14, 0.7)",
        paddingRight: 20,
        borderRadius: 50,
        borderWidth: 1,
        maxWidth: "50%",
        borderColor: "rgba(180, 160, 255, 0.1)",
    },
    compassWrapper: {
        width: 72,
        height: 72,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarWrap: {
        width: 54,
        height: 54,
        borderRadius: 27,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(140, 100, 255, 0.3)",
    },
    avatarLetter: {
        color: "rgba(200, 180, 255, 0.95)",
        fontWeight: "900",
        fontSize: 20,
        fontStyle: "italic",
    },
    nameText: {
        color: "rgba(200, 180, 255, 0.8)",
        fontWeight: "800",
        fontSize: 13,
        letterSpacing: 2,
    },
    turnText: {
        color: "#a855f7",
        fontSize: 9,
        fontWeight: "900",
        letterSpacing: 0,
        marginTop: 2,
    },
    handText: {
        color: "rgba(160,139,225,0.8)",
        fontWeight: "900",
        textAlign: "right",
        fontSize: 10,
        zIndex: 0
    },
    handPoints: {
        color: "rgba(204,204,204,0.8)",
        textAlign: "right",
        fontSize: 30,
    }
});
