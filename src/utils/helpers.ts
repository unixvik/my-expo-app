import {runOnJS, runOnUI} from "react-native-worklets";
import { useVisualStore} from "@/state/useVisualStore";
import {measure} from "react-native-reanimated";

export function sessionTag() {
    return Math.random().toString(36).slice(2, 10);
}
// @ts-ignore
export const updateLayout = (type,ref, key ) => {
    if (!ref) return;
    const setLayoutAction = useVisualStore.getState().setLayout;
    runOnUI(() => {
        'worklet';
        const m = measure(ref);
        if (m) {
            const data = { x: m.pageX, y: m.pageY, width: m.width, height: m.height };
            // Capture the state inside the worklet context carefully
            const layoutData = {
                x: m.pageX,
                y: m.pageY,
                width: m.width,
                height: m.height
            };
            runOnJS(setLayoutAction)(type, data, key);
        }
    })();
};