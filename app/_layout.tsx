import { Stack } from "expo-router";
import {GestureHandlerRootView} from "react-native-gesture-handler";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{
            headerShown: false, // 🌟 2. Kills the navigation header
            animation: 'fade'
        }} />
        </GestureHandlerRootView>
    );
}