import Animated from "react-native-reanimated";
import {LinearGradient} from "expo-linear-gradient";
import {StyleSheet, View} from "react-native";
import {AppText} from "@/Common/AppText";
import React, {useMemo} from "react";
import {useAppStyles} from "@/hooks/useAppStyles";
import {useSelf} from "@/state/gameSelectors";

export function Avatar() {
const {styles} = useAppStyles();
const myName = useSelf()?.name;

    return (<View style={styles.sideZone}>
        <Animated.View style={[styles.avatarWrap, {transform: [{scale: 1}]}]}>
            <LinearGradient colors={["#3d1a6e", "#1a0a3a"]} style={StyleSheet.absoluteFill}/>
            <AppText style={styles.avatarLetter}>{myName?.charAt(0).toUpperCase()}</AppText>
        </Animated.View>
    </View>);
}