export const calculateCardFan = (
    index: number,
    totalCards: number,
    cardWidth: number,
    isSelected: boolean,
    isHovered: boolean
) => {
    'worklet'; // Marks this for Reanimated's UI thread

    // 1. Find the center point of the hand
    const middleIndex = (totalCards - 1) / 2;
    const relativeIndex = index - middleIndex;

    // 2. The Arc Variables (Tweak these for tighter/wider fans)
    const FAN_ANGLE = 16; // Degrees of tilt per card
    const OVERLAP_RATIO = 1.95; // How much of the card width is visible
    const ARC_CURVE = -5; // How sharply the cards drop down on the edges

    // 3. Base Positions
    let translateX = relativeIndex * (cardWidth * OVERLAP_RATIO);
    let translateY = Math.pow(Math.abs(relativeIndex), 2) * ARC_CURVE;
    let rotateZ = relativeIndex * FAN_ANGLE;

    // 4. Overrides for Hover and Select
    if (isSelected) {
        translateY -= 40; // Pop up highly
        rotateZ = 0;      // Straighten out to read easily
    } else if (isHovered) {
        translateY -= 15; // Slight pop up on touch/hover
    }

    return {
        translateX,
        translateY,
        rotateZ: `${rotateZ}deg`
    };
};