// src/components/Player/PlayerArea.tsx
import {PlayerCards} from "@/components/Player/PlayerCards";
import {View} from "react-native";
import {PlayerBox} from "@/components/Boxes/PlayerBox/PlayerBox";
import React from "react";

type Rect = { x: number; y: number; w: number; h: number; pose?: { rx?: number; ry?: number; rz?: number; s?: number } };
export function PlayerArea({ onHandAnchor }: { onHandAnchor?: (r: Rect) => void }) {
    return (
        <View className={"absolute bottom-0 w-[100%] h-[25%] z-[10]"} >
            <View className={"relative h-full justify-center "} >


                <PlayerBox name={"Vik"} onHandAnchor={onHandAnchor} />

            </View>

        </View>
    );
}
