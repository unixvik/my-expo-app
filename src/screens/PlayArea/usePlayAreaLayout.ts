// // src/screens/PlayArea/usePlayAreaLayout.ts
// import { useEffect } from "react";
// import { animate, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
// import { useDevice } from "../../hooks/useDevice";
//
// export function usePlayAreaLayout() {
//     const { isMobileLandscape, isMobilePortrait, isDesktop } = useDevice();
//     const reduceMotion = useReducedMotion();
//
//     const overlayScale = isMobileLandscape ? 0.6 : isMobilePortrait ? 0.6 : 1;
//
//     const breath = useMotionValue(0);
//
//     useEffect(() => {
//         if (reduceMotion) return;
//         const controls = animate(breath, [0, 1, 0], {
//             duration: 25,
//             repeat: Infinity,
//             ease: "easeInOut",
//         });
//         return () => controls.stop();
//     }, [reduceMotion, breath]);
//
//     const tableBreathY = useTransform(breath, [0, 1], [-10, 8]);
//     const cardsBreathY = useTransform(breath, [0, 1], [-4, 3]);
//     const cardsBreathS = useTransform(breath, [0, 1], [1, 1.01]);
//     const cardsBreathX = useTransform(breath, [0, 1], [2, -2]); // optional
//
//     return {
//         isDesktop,
//         overlayScale,
//         tableDims,
//         reduceMotion,
//         tableBreathY,
//         cardsBreathY,
//         cardsBreathS,
//         cardsBreathX,
//     };
// }
