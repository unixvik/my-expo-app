import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, // 🌟 2. Kills the navigation header
            animation: 'fade'
        }} />
    );
}