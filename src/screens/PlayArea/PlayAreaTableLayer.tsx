// // src/screens/PlayArea/PlayAreaTableLayer.tsx
// import React from "react";
// import { motion, MotionValue } from "framer-motion";
// import Table from "../../components/Table/TableSurface";
//
// export function PlayAreaTableLayer({
//                                        tableDims,
//                                        reduceMotion,
//                                        tableBreathY,
//                                    }: {
//     tableDims: { w: string; h: string; y: string };
//     reduceMotion: boolean;
//     tableBreathY: MotionValue<number>;
// }) {
//     return (
//         <motion.div
//             className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
//             style={{
//                 transformStyle: "preserve-3d",
//                 transformOrigin: "center",
//                 width: tableDims.w,
//                 height: tableDims.h,
//                 translateY: tableDims.y,
//                 y: reduceMotion ? 0 : tableBreathY,
//             }}
//             initial={false}
//             animate={{ rotateX: 75 }}
//             transition={{ duration: 0 }}
//         >
//             <Table />
//         </motion.div>
//     );
// }
