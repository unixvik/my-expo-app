// App.tsx
import "./global.css";
import {useEffect} from "react";
import {SafeAreaProvider} from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {RoomPage} from "@/screens/RoomPage";
import LobbyScreen from "@/screens/LobbyScreen";
import {GameProvider} from "@/state/machine/GameProvider";
import {useGameMachine} from "@/state/machine/useMachine";


export default function App() {
    useEffect(() => {
        // Lock to landscape for the game
        ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
        );

        return () => {
            // Optional: unlock when app unmounts
            ScreenOrientation.unlockAsync();
        };
    }, []);

    return (

            <SafeAreaProvider>
                <GestureHandlerRootView style={{flex: 1}}>
                    <RoomPage/>
                {/*<LobbyScreen/>*/}
                </GestureHandlerRootView>
            </SafeAreaProvider>


                );
                }
