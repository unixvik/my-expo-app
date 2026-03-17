import {runOnJS, runOnUI} from "react-native-worklets";
import { useVisualStore} from "@/state/useVisualStore";
import {measure} from "react-native-reanimated";
import {BASE_CARD_WIDTH, CARD_ASPECT_RATIO, DISCARD_OFFSET, TABLE_PERSPECTIVE, TABLE_TILT} from "@/state/constants";
import {useResponsive} from "@/hooks/useResponsive";
import {Platform} from "react-native";

export function sessionTag() {
    return Math.random().toString(36).slice(2, 10);
}
// @ts-ignore
export const updateLayout = (type, ref, key, subKey?) => {
    if (!ref) return;
    const setLayoutAction = useVisualStore.getState().setLayout;
    runOnUI(() => {
        'worklet';
        const m = measure(ref);
        if (m) {
            const data = { x: m.pageX, y: m.pageY, width: m.width, height: m.height };

            // console.log("Data updated for " + type + " key: " + key + " subKey: " + subKey);
            runOnJS(setLayoutAction)(type, data, key, subKey);
        }
    })();
};

// src/utils/helpers.ts
export const discardLayoutToScene = (layout: { x: number, y: number, width: number, height: number }) => {
    const centerX = layout.x + layout.width / 2;
    const centerY = layout.y + layout.height / 2;

    // Transform screen coordinates to scene3d coordinates
    // If your table has a tilt/perspective, adjust here if needed
    return { x: centerX, y: centerY };
};

export const getFanTransform = (index: number) => {
    const fanSpacing = 20;
    const fanRotation = 12 + index * 8;
    const fanX = index * fanSpacing;
    const fanY = -index * 2;

    return { x: fanX, y: fanY, rotation: fanRotation };
};

export const getSceneTransform = () => {
    return [
        { perspective: TABLE_PERSPECTIVE },
        { rotateX: `${TABLE_TILT}deg` },
    ];
};

export const getFlightYOffset = () => {
    const { scale } = useResponsive();
    const cardHeight = scale(BASE_CARD_WIDTH) * CARD_ASPECT_RATIO;

    // e.g., fly 0.25 of card height above discard center

    return -cardHeight *  (Platform.OS === 'web' ? 0.8: 0.5);
};