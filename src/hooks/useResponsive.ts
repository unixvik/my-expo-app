import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    // 🌟 Identify the "limiting" dimension
    const isLandscape = width > height;
    const shortDimension = Math.min(width, height);

    // 🌟 390 is the standard iPhone 14 width (our design baseline)
    const scaleFactor = shortDimension / 390;

    const scale = (size: number) => size * scaleFactor;

    const moderateScale = (size: number, factor = 0.4) =>
        size + (scale(size) - size) * factor;

    return {
        scale,
        moderateScale,
        isLandscape,
        width,
        height
    };
};