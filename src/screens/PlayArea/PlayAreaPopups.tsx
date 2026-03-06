// // src/screens/PlayArea/PlayAreaPopups.tsx
// import React from "react";
// import RoundEndedPopup from "../../components/UIElements/RoundEndedPopup";
//
// export function PlayAreaPopups({ roundEnded, lastRound, setRoundEnded }: any) {
//     if (!roundEnded || !lastRound) return null;
//
//     return (
//         <RoundEndedPopup
//             open={roundEnded}
//             claim={{
//                 claimerName: lastRound.claimerName,
//                 success: lastRound.success,
//                 claimerHandValue: lastRound.claimerHandValue,
//                 lowestOtherValue: lastRound.lowestOtherValue,
//             }}
//             history={lastRound.history ?? []}
//             leaderboard={lastRound.leaderboard ?? []}
//             onClose={() => setRoundEnded(false)}
//         />
//     );
// }
