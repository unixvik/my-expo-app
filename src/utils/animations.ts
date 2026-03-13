import {
    withTiming,
    withDelay,
    Easing
} from "react-native-reanimated";
import {Platform} from 'react-native';


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


export const createDiscardAnimation = (
    discardLayout: { x: number, y: number, width: number, height: number } | null,
    fromPos: { x: number, y: number } | null
) => {
    return (values: any) => {
        'worklet';

        // fromPos is measured via measure() at press time and includes all fan transforms.
        // values.currentGlobalOriginX does NOT include translateX/translateY from animatedStyle,
        // causing wrong deltaX for cards at the edges of the fan.
        const cardGlobalCenterX = fromPos
            ? fromPos.x
            : values.currentGlobalOriginX + (values.currentWidth / 2);
        const cardGlobalCenterY = fromPos
            ? fromPos.y
            : values.currentGlobalOriginY + (values.currentHeight / 2);

        let targetX = cardGlobalCenterX;
        let targetY = cardGlobalCenterY - 300;

        if (discardLayout) {
            targetX = discardLayout.x + (discardLayout.width / 2);
            targetY = discardLayout.y + (discardLayout.height / 2);
        }

        const deltaX = targetX - cardGlobalCenterX;
        const deltaY = targetY - cardGlobalCenterY;

        return {
            initialValues: {
                originX: values.currentOriginX,
                originY: values.currentOriginY,
                rotateZ: '0deg',
                scale: 1,
                opacity: 1,
                zIndex: 9999,
            },
            animations: {
                originX: withTiming(values.currentOriginX + deltaX, {
                    duration: 400,
                    easing: Easing.out(Easing.quad)
                }),
                originY: withTiming(values.currentOriginY + deltaY, {
                    duration: 400,
                    easing: Easing.in(Easing.quad)
                }),
                scale: withTiming(0.6, { duration: 400 }),
                opacity: withDelay(350, withTiming(0, { duration: 50 })),
            },
        };
    };
};