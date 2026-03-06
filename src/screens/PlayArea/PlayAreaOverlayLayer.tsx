// // src/screens/PlayArea/PlayAreaOverlayLayer.tsx
// import React, { RefObject } from "react";
// import { motion, MotionValue } from "framer-motion";
// import ATUDraw from "../../components/Cards/ATUDraw";
// import DrawPile from "../../components/Piles/DrawPile/DrawPile";
// import DiscardPile from "../../components/Piles/DiscardPile/DiscardPile";
//
// export function PlayAreaOverlayLayer({
//                                          isDesktop,
//                                          overlayScale,
//                                          reduceMotion,
//                                          cardsBreathY,
//                                          drawPileRef,
//                                          deckReady,
//                                          setDeckReady,
//                                          atuCards,
//                                          atuRef,
//                                          cardsRemaining,
//                                          cardsDiscarded,
//                                          topDiscardedCard,
//                                          handleDrawFromDeck,
//                                          handleDrawFromDiscard,
//                                      }: {
//     isDesktop: boolean;
//     overlayScale: number;
//     reduceMotion: boolean;
//     cardsBreathY: MotionValue<number>;
//     drawPileRef: RefObject<HTMLDivElement | null>;
//     deckReady: boolean;
//     setDeckReady: (v: boolean) => void;
//     atuCards: any;
//     atuRef: RefObject<HTMLDivElement | null>;
//     cardsRemaining: number;
//     cardsDiscarded: number;
//     topDiscardedCard: any;
//     handleDrawFromDeck: () => void;
//     handleDrawFromDiscard: () => void;
// }) {
//     const FLOAT_Y = -18;
//
//     return (
//         <motion.div
//             className="
//         absolute left-1/2 top-1/2
//         -translate-x-1/2 -translate-y-1/2
//         z-30 w-[70dvw] max-w-[1000px]
//         pointer-events-none select-none
//       "
//             style={{
//                 transformStyle: "preserve-3d",
//                 transformOrigin: "top center",
//                 y: reduceMotion ? 0 : cardsBreathY,
//             }}
//             initial={false}
//             animate={{ scale: overlayScale }}
//             transition={{ type: "spring", stiffness: 260, damping: 28 }}
//         >
//             <div className="absolute inset-0 z-30 pointer-events-none">
//                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-70 md:-translate-y-1/2">
//                     <div className={`grid grid-cols-1 gap-y-60 items-end rotate-x-55 md:grid-cols-2 md:gap-y-0 md:gap-x-100`}>
//                         {/* COL 1 */}
//                         <motion.div
//                             className="relative pointer-events-auto will-change-transform rotate-25"
//                             style={{ filter: isDesktop ? "drop-shadow(0 18px 40px rgba(0,0,0,0.35))":"" }}
//                             animate={{ y: FLOAT_Y, scale: 1.05 }}
//                             whileHover={{ y: FLOAT_Y - 6, scale: 1.07 }}
//                             transition={{ type: "spring", stiffness: 520, damping: 30 }}
//                         >
//                             {atuCards && deckReady && (
//                                 <div
//                                     className="absolute z-0 pointer-events-none"
//                                     style={{ top: "50%", transform: "scale(0.95)", opacity: 0.95 }}
//                                 >
//                                     <ATUDraw deckReady={deckReady} atuRef={atuRef} myCards={atuCards} />
//                                 </div>
//                             )}
//
//                             <div className="relative z-10">
//                                 <DrawPile
//                                     drawCount={cardsRemaining}
//                                     pileRef={drawPileRef}
//                                     onAnimationComplete={() => setDeckReady(true)}
//                                     onDraw={handleDrawFromDeck}
//                                 />
//                             </div>
//                         </motion.div>
//
//                         {/* COL 2 */}
//                         <motion.div
//                             className="pointer-events-auto will-change-transform"
//                             style={{ filter: isDesktop ? "drop-shadow(0 18px 40px rgba(0,0,0,0.35))":"" }}
//                             animate={{ y: FLOAT_Y, scale: 1.04 }}
//                             whileHover={{ y: FLOAT_Y - 6, scale: 1.07 }}
//                             transition={{ type: "spring", stiffness: 520, damping: 30 }}
//                         >
//                             <DiscardPile
//                                 cardsDiscarded={cardsDiscarded}
//                                 topDiscardedCard={topDiscardedCard}
//                                 onDraw={handleDrawFromDiscard}
//                             />
//                         </motion.div>
//                     </div>
//                 </div>
//             </div>
//         </motion.div>
//     );
// }
