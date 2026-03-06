// src/components/Piles/DiscardPile/DiscardPile.tsx
// ✨ SERVER-DRIVEN VERSION - Reads directly from server discardPile array

import React, {memo, useMemo, useRef, useCallback, useEffect} from "react";
import {View, Text, Pressable, StyleSheet, Animated} from "react-native";
import {useTheme} from "@/theme/ThemeProvider";
import {useCardSize} from "@/hooks/useCardSize";
import {useGameSelector, shallowEqual} from "@/state/machine/useGameSelector";
import {CardFace} from "@/components/Cards/CardFace/CardFace";
import {LightweightFace} from "./LightweightFace";
import {scene3d} from "@/theme/scene";
import {changePlaceholderInTemplate} from "@react-native-community/cli/build/commands/init/editTemplate";

type Props = {
    onPress?: () => void;
    scaleMul?: number;
    onAnchor?: (r: { x: number; y: number; w: number; h: number; pose?: any }) => void;
};

export const DiscardPile = memo(function DiscardPile({onPress, scaleMul = 1, onAnchor}: Props) {
    const t = useTheme();
    const {CARD_W, CARD_H, CARD_RADIUS, SCALE} = useCardSize();

    const wrapRef = useRef<View>(null);
    const anchorRef = useRef<View>(null);

    const mul = Math.min(Math.max(scaleMul, 0.6), 1.2);
    const W = Math.round(CARD_W * mul);
    const H = Math.round(CARD_H * mul);
    const R = Math.round(CARD_RADIUS * mul);

    // ✨ Read from server discardPile array (source of truth!)
    const discardPile = useGameSelector((s) => s.game.discardPile ?? []);
    const cardsDiscarded = discardPile.length;
console.log(discardPile.length);
    // ✨ Read offset from UI state only
    const { offset, offsetSeq } = useGameSelector(
        (s) => s.ui.discardPile,
        shallowEqual
    );

    // ✨ Simple: top = last card, under = second-to-last
    const topCard = discardPile[discardPile.length - 1];
    const underCard = discardPile[discardPile.length - 2];

    // Animated values for offset
    const animOffsetX = useRef(new Animated.Value(0)).current;
    const animOffsetY = useRef(new Animated.Value(0)).current;
    const animRot = useRef(new Animated.Value(0)).current;



    // ✅ Animate offset values when they change
    useEffect(() => {
        const isSlidingBack = offset.x === 0 && offset.y === 0 && offset.rot === 0 && topCard;



        // ✅ TUNED: Slower spring for visible slide-back
        const springConfig = isSlidingBack
            ? { tension: 30, friction: 10 }  // Slow for slide-back
            : { tension: 60, friction: 8 };   // Fast for offset appear

        Animated.parallel([
            Animated.spring(animOffsetX, {
                toValue: offset.x * SCALE * mul,
                useNativeDriver: true,
                ...springConfig,
            }),
            Animated.spring(animOffsetY, {
                toValue: offset.y * SCALE * mul,
                useNativeDriver: true,
                ...springConfig,
            }),
            Animated.spring(animRot, {
                toValue: offset.rot,
                useNativeDriver: true,
                ...springConfig,
            }),
        ]).start(() => {

        });
    }, [offset.x, offset.y, offset.rot, offsetSeq, animOffsetX, animOffsetY, animRot, SCALE, mul, topCard]);

    // ✅ Report anchor for flight animations
    const report = useCallback(() => {
        const node: any = anchorRef.current;
        if (!node?.measureInWindow) return;

        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w <= 0 || h <= 0) return;

            onAnchor?.({
                x,
                y,
                w,
                h,
                pose: {
                    rx: scene3d.tableTiltX ?? -38,
                    ry: scene3d.tableYawY ?? 0,
                    rz: 0,
                    s: 1,
                },
            });
        });
    }, [onAnchor]);

    const styles = useMemo(() => {
        const border = t.components.table?.rim ?? "rgba(255,255,255,0.10)";
        const persp = scene3d?.perspective ?? 900;
        const tiltX = scene3d?.tableTiltX ?? -38;
        const yawY = scene3d?.tableYawY ?? 0;

        return StyleSheet.create({
            root: {alignItems: "center", justifyContent: "center"},
            stack: {
                width: W,
                height: H,
                transform: [{perspective: persp}]
            },
            anchor: {
                position: "absolute",
                left: 0,
                top: 0,
                width: W,
                height: H,
                borderRadius: R,
                opacity: 0.01,
            },
            slot: {
                width: W,
                height: H,
                borderRadius: R,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: "rgba(0,0,0,0.12)",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transform: [
                    {rotateX: `${tiltX}deg` as any},
                    {rotateY: `${yawY}deg` as any},
                ],
            },
            label: {
                marginTop: 6,
                fontSize: 10 * SCALE * mul,
                color: t.semantic.textMuted,
                opacity: 0.75,
                letterSpacing: 1,
            },
            cardWrap: {position: "absolute", left: 0, top: 0},
        });
    }, [W, H, R, SCALE, mul, t]);

    return (
        <View ref={wrapRef} style={styles.root} pointerEvents="box-none">
            <Pressable onPress={onPress}>
                <View style={styles.stack} onLayout={report}>
                    {/* Untransformed anchor */}
                    <View ref={anchorRef} pointerEvents="none" style={styles.anchor}/>

                    {/* Visual pile */}
                    <View style={styles.slot}>
                        {/* Under card (visible when there's offset) */}
                        {/*{hasOffset && underCard && (*/}
                        {/*    <View style={styles.cardWrap}>*/}
                        {/*        <CardFace card={underCard} scaleMul={mul}/>*/}
                        {/*    </View>*/}
                        {/*)}*/}

                        {/* Top card at offset OR aligned */}
                        {topCard && (
                            <Animated.View
                                style={[
                                    styles.cardWrap,
                                    {
                                        transform: [
                                            { translateX: animOffsetX },
                                            { translateY: animOffsetY },
                                            { rotateZ: animRot.interpolate({
                                                    inputRange: [-180, 180],
                                                    outputRange: ['-180deg', '180deg'],
                                                }) as any },
                                        ],
                                    },
                                ]}
                            >
                                <CardFace card={topCard} scaleMul={mul}/>
                            </Animated.View>
                        )}

                        {/* Empty state */}
                        {!topCard && (
                            <LightweightFace w={W} h={H} r={R} rank={" "} suit={" "} />
                        )}
                    </View>

                </View>
            </Pressable>

            {cardsDiscarded > 0 && (
                <Text style={styles.label}>DISCARD</Text>
            )}
        </View>
    );
});