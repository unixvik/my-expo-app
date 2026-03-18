import {
    withTiming,
    withDelay,
    Easing
} from "react-native-reanimated";
import {Platform} from 'react-native';
import {spawnDiscardFlight} from "@/utils/spawnDiscardFlight";
import {useVisualStore} from "@/state/useVisualStore";


const IS_WEB = Platform.OS === 'web';
const OVERLAP_RATIO = IS_WEB ? 0 : -0.2;
const handPositions = useVisualStore(s=>s.layouts.opponents);

export const calculateCardFan = (
    index: number,
    totalCards: number,
    cardWidth: number,
    isSelected: boolean,
    isHovered: boolean
) => {
    'worklet';
    const middleIndex = (totalCards - 1) / 2;
    const relativeIndex = index - middleIndex;


    const FAN_ANGLE = 25;
    const ARC_CURVE = -2;

    let translateX = relativeIndex * (cardWidth * OVERLAP_RATIO);
    let translateY = Math.pow(Math.abs(relativeIndex), 2) * ARC_CURVE;
    let rotateZ = relativeIndex * FAN_ANGLE;

    if (isSelected) {
        translateY -= 40;
        rotateZ = 0;
    } else if (isHovered) {
        translateY -= 15;
    }

    return {
        translateX,
        translateY,
        rotateZ,
    };
};


// export const createDiscardAnimation = (playerId: string, cardIds: string[]
//
// ) => {
//
//     // console.log(playerId);
//     // const selectedDiscardIds = cardIds;
//     // console.log(handPositions);
//     // spawnDiscardFlight({
//     //     selectedDiscardIds,
//     //     hand: [],
//     //     handPositions,
//     //     discardLayout,
//     //     spawnFlyingCard
//     // });
// console.log("nimic")
//
// };