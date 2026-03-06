// src/utils/scaling.ts
import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale: Use for width, horizontal padding, margins, and icon sizes.
 */
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Vertical Scale: Use for height, vertical padding, and margins.
 */
export const vScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate Scale: Use for Font Sizes.
 * The factor (0.5) prevents text from becoming comically large on tablets.
 */
export const mScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Percentage Helper: Use for actual percentage-based calculations
 */
export const widthPct = (percent: number) => (percent * SCREEN_WIDTH) / 100;