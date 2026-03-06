// import React from 'react';
// import { Pressable, StyleSheet } from 'react-native';
// import Animated from 'react-native-reanimated';
// import { CardFace } from '@/components/Cards/CardFace';
// import { useAnimatedCards } from './hooks/useAnimatedCards';
// import type { HandCard } from '@/types/game';
//
// type Props = {
//     card: HandCard;
//     handMul: number;
//     fanPosition: {
//         translateX: number;
//         translateY: number;
//         rotate: number;
//         zIndex: number;
//         scale: number;
//     };
// };
//
// export const AnimatedCard = React.memo(({
//                                             card,
//                                             handMul,
//                                             fanPosition
//                                         }: Props) => {
//     const { animatedStyle, handleHoverIn, handleHoverOut } = useAnimatedCards();
//
//     return (
//         <Pressable
//             onHoverIn={handleHoverIn}
//             onHoverOut={handleHoverOut}
//             style={[
//                 styles.pressable,
//                 { zIndex: fanPosition.zIndex }
//             ]}
//         >
//             <Animated.View
//                 style={[
//                     styles.animatedView,
//                     {
//                         transform: [
//                             { translateX: fanPosition.translateX },
//                             { translateY: fanPosition.translateY },
//                             { rotate: `${fanPosition.rotate}deg` },
//                             { scale: fanPosition.scale },
//                         ],
//                     },
//                     animatedStyle,
//                 ]}
//             >
//                 <CardFace card={card} scaleMul={handMul} />
//             </Animated.View>
//         </Pressable>
//     );
// });
//
// const styles = StyleSheet.create({
//     pressable: {
//         position: 'absolute',
//         overflow: 'visible',
//     },
//     animatedView: {
//         overflow: 'visible',
//     },
// });