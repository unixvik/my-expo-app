import {View} from "react-native";
import {AppText} from "@/Common/AppText";
import Animated from "react-native-reanimated";
import React from "react";
import {useAppStyles} from "@/hooks/useAppStyles";
import {SPRING_CONFIGS} from "@/state/constants";
import {useSelf} from "@/state/gameSelectors";

export function HandValue() {
    const { styles, theme } = useAppStyles();
    const me = useSelf();
    const handValue = me?.handValue ?? 0;
    //   const springConfig = LinearTransition.springify().damping(16).stiffness(160);
    // @ts-ignore

    return (<View style={[styles.sideZoneRight]}>
        <AppText style={styles.sideZoneRightHand}>Hand</AppText>
        {/*<Animated.Text layout={SPRING_CONFIGS.THUD} style={styles.avatarLetter}>*/}
        {/*    {handValue}*/}
        {/*</Animated.Text>*/}
    </View>);
}