// components/Player/AnimatedCard.tsx
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { CardFace } from "@/components/Cards/CardFace";
import { useAnimatedCards } from "./hooks/useAnimatedCards";
import type { HandCard } from "@/types/game";

export type Pose3D = { rx?: number; ry?: number; rz?: number; s?: number };
export type CardRect = { x: number; y: number; w: number; h: number; pose?: Pose3D };

type Props = {
    isDiscarding: boolean;
    card: HandCard;
    handMul: number;
    fanPosition: {
        translateX: number;
        translateY: number;
        rotate: number;
        zIndex: number;
        scale: number;
    };
    isSelected: boolean;
    onCardPress: (id: string) => void;
    onCardRect?: (id: string, rect: CardRect) => void;
};

// ✅ Move outside component - no need to recreate
const toDeg = (v: number) => {
    if (Math.abs(v) <= 3.2) return (v * 180) / Math.PI;
    return v;
};

export const AnimatedCard = React.memo(function AnimatedCard({
                                                                 isDiscarding,
                                                                 card,
                                                                 handMul,
                                                                 fanPosition,
                                                                 isSelected,
                                                                 onCardPress,
                                                                 onCardRect,
                                                             }: Props) {
    const { animatedStyle, handleHoverIn, handleHoverOut, transformStyle } = useAnimatedCards(
        fanPosition,
        isSelected,
        isDiscarding
    );

    const wrapRef = useRef<View>(null);
    const rafRef = useRef<{ raf1?: number; raf2?: number }>({});

    // ✅ Store callback in ref to avoid reportRect recreation
    const onCardRectRef = useRef(onCardRect);
    useEffect(() => {
        onCardRectRef.current = onCardRect;
    }, [onCardRect]);

    // ✅ Stable reportRect - only depends on values that change when measurement is needed
    const reportRect = useCallback(() => {
        const node: any = wrapRef.current;
        if (!node?.measureInWindow) return;

        node.measureInWindow((x: number, y: number, w: number, h: number) => {
            if (w > 2 && h > 2) {
                onCardRectRef.current?.(card.id, {
                    x, y, w, h,
                    pose: {
                        rx: 0,
                        ry: 0,
                        rz: toDeg(fanPosition.rotate),
                        s: fanPosition.scale * handMul,
                    },
                });
            }
        });
    }, [card.id, fanPosition.rotate, fanPosition.scale, handMul]);

    // ✅ Debounced measurement - only measure after position settles
    const measureTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Clear any pending measurement
        if (measureTimeoutRef.current) {
            clearTimeout(measureTimeoutRef.current);
        }

        // Cancel any in-flight RAF
        if (rafRef.current.raf1 !== undefined) {
            cancelAnimationFrame(rafRef.current.raf1);
        }
        if (rafRef.current.raf2 !== undefined) {
            cancelAnimationFrame(rafRef.current.raf2);
        }

        // ✅ Debounce: only measure after 16ms of no changes (one frame)
        // This prevents measuring during rapid animation updates
        measureTimeoutRef.current = setTimeout(() => {
            rafRef.current.raf1 = requestAnimationFrame(() => {
                rafRef.current.raf2 = requestAnimationFrame(() => {
                    reportRect();
                });
            });
        }, 16);

        return () => {
            if (measureTimeoutRef.current) {
                clearTimeout(measureTimeoutRef.current);
            }
            if (rafRef.current.raf1 !== undefined) {
                cancelAnimationFrame(rafRef.current.raf1);
            }
            if (rafRef.current.raf2 !== undefined) {
                cancelAnimationFrame(rafRef.current.raf2);
            }
        };
    }, [
        reportRect,
        fanPosition.translateX,
        fanPosition.translateY,
        fanPosition.rotate,
        fanPosition.scale,
    ]);

    // ✅ Stable callback refs for press handler
    const handlePress = useCallback(() => {
        if (!isDiscarding) {
            onCardPress(card.id);
        }
    }, [isDiscarding, onCardPress, card.id]);

    return (
        <Pressable
            disabled={isDiscarding}
            onHoverIn={isDiscarding ? undefined : handleHoverIn}
            onHoverOut={isDiscarding ? undefined : handleHoverOut}
            onPress={handlePress}
            style={[styles.pressable, transformStyle]}
        >
            <View ref={wrapRef} collapsable={false} style={styles.measureWrap}>
                <Animated.View
                    style={[
                        styles.animatedView,
                        animatedStyle,
                        // ✅ Inline is fine for simple conditional
                        isDiscarding && styles.ghost
                    ]}
                >
                    <CardFace
                        card={card}
                        scaleMul={handMul}
                        isSelected={isSelected}
                        isPending={false}
                    />
                </Animated.View>
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    pressable: {
        overflow: "visible",
    },
    measureWrap: {
        overflow: "visible",
    },
    animatedView: {
        overflow: "visible",
    },
    ghost: {
        opacity: 0,
    },
});