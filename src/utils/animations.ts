import {
    EntryExitAnimationFunction,
    withSpring,
    withTiming,
    FadeOutDown, // Fallback pentru Web
    ComplexAnimationBuilder, FadeOut
} from "react-native-reanimated";
import { Platform } from 'react-native';
import {runOnJS} from "react-native-worklets";
import {useGameStore} from "@/state/useGameStore";


const IS_WEB = Platform.OS === 'web';
const OVERLAP_RATIO = IS_WEB ? 1.45 : 0.78;

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
        rotateZ: `${rotateZ}deg`
    };
};

const updateDebugPath = (path: any) => {
    useGameStore.getState().setDebugPath(path);
};

// 🌟 LOGICA DE DISCARD ADAPTATĂ
export const createDiscardAnimation = (discardTarget: any): any => {
    if (IS_WEB) return FadeOutDown.duration(400);

    const animation: EntryExitAnimationFunction = (values) => {
        'worklet';
        if (!discardTarget) {
            return {
                animations: { opacity: withTiming(0) },
                initialValues: { opacity: 1 },
            };
        }

        const startX = (values.currentGlobalOriginX || values.targetGlobalOriginX) + values.currentWidth / 2;
        const startY = (values.currentGlobalOriginY || values.targetGlobalOriginY) + values.currentHeight / 2;

        const toX = discardTarget.x + discardTarget.width / 2;
        const toY = discardTarget.y + discardTarget.height / 2;

        console.log(startX,startY);
        // Trimitem la debug
        runOnJS(updateDebugPath)({
            from: { x: startX, y: startY },
            to: { x: toX, y: toY }
        });

        const deltaX = toX - startX;
        const deltaY = toY - startY;

        return {
            animations: {
                transform: [
                    { translateX: withSpring(deltaX, { damping: 20, stiffness: 90 }) },
                    { translateY: withSpring(deltaY, { damping: 20, stiffness: 90 }) },
                    { scale: withSpring(0.4) },
                    { rotateZ: withSpring('15deg') },
                    { rotateX: withSpring('45deg') }
                ],
                opacity: withTiming(0, { duration: 400 }),
            },
            initialValues: {
                transform: [
                    { translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotateZ: '0deg' }, { rotateX: '0deg' }
                ],
                opacity: 1,
            },
        };
    };

    return animation;
};

export const getSmartExitAnimation = (discardTarget: any) => {
    if (Platform.OS === 'web') {
        // Pe Web returnăm un FadeOut simplu, Reanimated îl suportă nativ fără erori
        return FadeOut.duration(300);
    }

    // Pe Mobile folosim funcția ta custom de zbor (createDiscardAnimation)
    return createDiscardAnimation(discardTarget);
};
