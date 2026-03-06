// import React from "react";
// import { View, ImageBackground, StyleSheet, Dimensions } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
//
// const { width, height } = Dimensions.get("window");
//
// export function PlayAreaBackground() {
//     // Mobile best practice: use blurRadius for the native blur effect
//     // Standard desktop-like blur of 8px translates roughly to a radius of 10-15 on mobile
//     const blurAmount = 10;
//
//     return (
//         <View className="absolute inset-0 bg-black">
//             {/* 1. THE MAIN BACKGROUND IMAGE */}
//             <ImageBackground
//                 source={require("@/assets/images/bg2.jpg")}
//                 className=""
//                 resizeMode="cover"
//                 blurRadius={blurAmount}
//             >
//                 {/* 2. ATMOSPHERIC VIGNETTE OVERLAY */}
//                 {/* Since we can't do a true 'ellipse at center' radial gradient easily without SVG,
//                     we layer gradients to create a deep atmospheric 'Claim' look */}
//                 {/*<LinearGradient*/}
//                 {/*    colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}*/}
//                 {/*    className="absolute inset-0"*/}
//                 {/*/>*/}
//
//                 {/* Horizontal Gradient for corner darkening */}
//                 {/*<LinearGradient*/}
//                 {/*    colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}*/}
//                 {/*    start={{ x: 0, y: 0.5 }}*/}
//                 {/*    end={{ x: 1, y: 0.5 }}*/}
//                 {/*    className="absolute inset-0"*/}
//                 {/*/>*/}
//             </ImageBackground>
//
//             {/* 3. OPTIONAL: DARK WASH TO ENSURE TEXT READABILITY */}
//             <View className="absolute inset-0 bg-black/20" pointerEvents="none" />
//         </View>
//     );
// }