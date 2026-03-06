// import React from "react";
// import { View, Text, Pressable, Platform } from "react-native";
// import { useDevice } from "@/hooks/useDevice";
// import {HandCard} from "@/types/game";
//
// type Suit = "hearts" | "diamonds" | "clubs" | "spades";
//
// type Props = {
//     card: HandCard;
//     showValue?: boolean;
//     offset?: boolean;
//     onPress?: () => void;
// };
//
// const suitSymbols: Record<Suit, string> = {
//     hearts: "♥",
//     diamonds: "♦",
//     clubs: "♣",
//     spades: "♠",
// };
//
// const suitTextClass: Record<Suit, string> = {
//     hearts: "text-red-500",
//     diamonds: "text-red-500",
//     clubs: "text-gray-900",
//     spades: "text-gray-900",
// };
//
// export function Card({ card, showValue = true, offset = false, onPress }: Props) {
//     const { isDesktop } = useDevice();
//
//     return (
//         <Pressable
//             onPress={onPress}
//             className={[
//                 // base card
//                 "relative w-24 h-36 bg-white rounded-xl border-2 border-slate-300",
//                 "flex flex-col items-center justify-between p-3",
//                 // shadow-ish (works on iOS; Android needs elevation class too)
//                 "shadow-md",
//                 // pointer cursor only matters on web
//                 Platform.OS === "web" ? "cursor-pointer" : "",
//                 // offset style
//                 offset ? "translate-x-5 -translate-y-3 rotate-6 z-10" : "",
//             ].join(" ")}
//             style={({ pressed }) => [
//                 // emulate hover/raise with press feedback
//                 pressed ? { transform: [{ translateY: -6 }] } : null,
//                 // on desktop/web you can still make it feel hover-y via pressed,
//                 // real hover would need CSS/web or RNW-specific handling.
//                 isDesktop && pressed ? { shadowOpacity: 0.35 } : null,
//             ]}
//         >
//             <View className="flex flex-col items-center gap-2">
//                 <Text className={`text-4xl font-bold ${suitTextClass[card.suit]}`}>
//                     {card.rank}
//                 </Text>
//                 <Text className={`text-3xl ${suitTextClass[card.suit]}`}>
//                     {suitSymbols[card.suit]}
//                 </Text>
//             </View>
//
//             {showValue ? (
//                 <View className="px-2 py-1 rounded bg-slate-900">
//                     <Text className="text-xs font-semibold text-yellow-300">
//                         {card.value ?? ""}
//                     </Text>
//                 </View>
//             ) : null}
//         </Pressable>
//     );
// }
