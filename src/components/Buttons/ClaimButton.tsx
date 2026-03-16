import React, { useEffect } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing,
    withDelay
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/Common/AppText';
import { useResponsive } from '@/hooks/useResponsive';
import { rnShadow } from '@/state/constants';

interface ClaimButtonProps {
    onPress: () => void;
    enabled: boolean;
}

export const ClaimButton = ({ onPress,enabled }: ClaimButtonProps) => {
    const { scale, moderateScale } = useResponsive();

    // 🌟 1. Calculate dimensions on the JS thread so the UI thread doesn't crash!
    const SHINE_SWEEP_DISTANCE = scale(150);
    const BUTTON_RADIUS = scale(30);
    const PADDING_V = scale(12);
    const PADDING_H = scale(10);
    const FONT_SIZE = moderateScale(14);

    const breathingScale = useSharedValue(1);
    const pressScale = useSharedValue(1);
    const shinePosition = useSharedValue(-1);

    useEffect(() => {
        breathingScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        shinePosition.value = withRepeat(
            withSequence(
                withTiming(2, { duration: 1500, easing: Easing.linear }),
                withTiming(-1, { duration: 0 }),
                withDelay(2000, withTiming(-1, { duration: 0 }))
            ),
            -1,
            false
        );
    }, []);


    const animatedShineStyle = useAnimatedStyle(() => ({
        // 🌟 2. Use the pre-calculated constant here!
        transform: [{ translateX: shinePosition.value * SHINE_SWEEP_DISTANCE }],
    }));

    const handlePressIn = () => {
        pressScale.value = withSpring(0.9, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        pressScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        onPress();
    };

    const buttonColors = enabled
        ? ['#FFDF00', '#D4AF37', '#B8860B', '#996515'] // Gold
        : ['#D3D3D3', '#A9A9A9', '#808080', '#696969']; // Flat Gray

    const borderColor = enabled ? '#FFE55C' : '#A9A9A9';
    const textColor = enabled ? '#1A1A1A' : '#555555';

    // 🌟 2. Stop the breathing scale if disabled
    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: enabled
            ? [{ scale: breathingScale.value * pressScale.value }]
            : [{ scale: 1 }], // Static when disabled
    }));

    return (
        <Animated.View style={[animatedContainerStyle, { zIndex: 1000 }]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.pressable}
                disabled={!enabled}
            >
                <LinearGradient
                    colors={buttonColors}
                    locations={[0, 0.4, 0.8, 1]}
                    style={[
                        styles.gradientBackground,
                        {
                            borderRadius: BUTTON_RADIUS,
                            paddingVertical: PADDING_V,
                            paddingHorizontal: PADDING_H,
                            borderColor: borderColor // 🌟 Apply dynamic border
                        }
                    ]}
                >
                    <AppText style={[styles.text, { fontSize: FONT_SIZE, color: textColor }]}>
                        CLAIM
                    </AppText>

                    {/* 🌟 3. Only render the shine sweep if it is active */}
                    {enabled && (
                        <Animated.View style={[styles.shineContainer, animatedShineStyle]}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shineElement}
                            />
                        </Animated.View>
                    )}

                </LinearGradient>

                {/* 🌟 4. Only render the glowing shadow if it is active */}
                {enabled && (
                    <View style={[StyleSheet.absoluteFillObject, styles.glowOverlay, { borderRadius: BUTTON_RADIUS }]} />
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    pressable: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientBackground: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FFE55C',
        ...rnShadow("heavy"),
    },
    text: {
        color: '#1A1A1A',
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    glowOverlay: {
        zIndex: -1,
        shadowColor: '#FFDF00',
        shadowOpacity: 0.8,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 0 },
        elevation: 20,
    },
    shineContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 40,
        transform: [{ skewX: '-20deg' }],
    },
    shineElement: {
        flex: 1,
        width: '100%',
    }
});