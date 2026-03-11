import { StyleSheet, ViewStyle } from 'react-native';
import { GameTheme } from '@/theme/themeTokens';
import {
    CARD_ASPECT_RATIO,
    CARD_RADIUS_RATIO,
    TABLE_TILT,
    TABLE_PERSPECTIVE,
    Z_INDEX, rnShadow, CARD_ATU_ROTATE_Z,
    BASE_CARD_WIDTH,
    PLAYER_CARD_WIDTH,
    TABLE_OVAL_RATIO,
} from '@/state/constants';

const seatTop         = 5  * TABLE_OVAL_RATIO;
const seatBottomLeft  = 20 * TABLE_OVAL_RATIO;
const seatBottomRight = 20 * TABLE_OVAL_RATIO;

export const createStyles = (
    theme: GameTheme,
    scale: (size: number) => number,
    moderateScale: (size: number) => number,
    isLandscape:boolean,

) =>
    StyleSheet.create({
        board: {
            flex: 1,
            backgroundColor: theme.background,
            // 🌟 Switch padding based on orientation
            paddingVertical: isLandscape ? scale(10) : scale(40),
            width: "100%",
            height: "100%",
            zIndex: 1
        },

        tableContainer: {
            flex: 1,
            justifyContent: "center",
            // width: "80%",
            alignItems: "center",
            alignSelf: "center",
            zIndex: 1,
            elevation: 1,

        },

// 🌟 2. The 3D Engine (Isolated inside the wrapper)
        table3D: {
            justifyContent: "center",
            alignItems: "center",
            transform: [
                { perspective: TABLE_PERSPECTIVE },
                { rotateX: `${TABLE_TILT}deg` },
            ],
        },

        opponentsZone: {
            position: "absolute",
            width: '85%',
            alignItems: "center",
            alignSelf: "center",
            alignContent: "center",
            height: '100%',
            // 🌟 3. UI sits safely on top of the glass wall
            zIndex: 1000,
            elevation: 1000,
        },

        opponentAnchor: {
            position: "absolute",
            alignItems: "center",
            justifyContent: 'center',
            padding: scale(8),
            borderRadius: scale(12),
            minWidth: scale(90), // 🌟 Scaled
            backgroundColor: theme.surface,
            ...rnShadow("contact"),
        },

        // 🌟 MATH-BASED COORDINATES 🌟
        seat_TOP: {
            top: seatTop,
            left: '50%',
            // 🌟 Crucial: This must be EXACTLY half of scaled minWidth (90/2 = 45) to stay centered
            transform: [{ translateX: -scale(45) }]
        },
        seat_TOP_LEFT: {
            top: '15%',
            left: '10%'
        },
        seat_TOP_RIGHT: {
            top: '15%',
            right: '10%'
        },
        seat_MID_LEFT: {
            top: '45%',
            left: '0%'
        },
        seat_MID_RIGHT: {
            top: '45%',
            right: '0%'
        },
        seat_BOTTOM_LEFT: {
            bottom: seatBottomLeft,
            left: '15%'
        },
        seat_BOTTOM_RIGHT: {
            bottom: seatBottomRight,
            right: '15%'
        },

        avatarRing: {
            width: scale(10), // Adjusted from 10 so it's visible
            height: scale(10),
            borderRadius: scale(22),
            borderWidth: scale(3),
            justifyContent: "center",
            alignItems: "center",
            marginBottom: scale(4),
        },

        tableArea: {
            transform: [
                { translateY: "-5%" }
            ],
            height: "100%",
            aspectRatio: TABLE_OVAL_RATIO,
            borderRadius: scale(400), // Very large radii should also be scaled
            overflow: "hidden" as const,
            justifyContent: "center",
            alignItems: "center",
            borderColor: theme.table.rim,
            borderWidth: scale(20),
        },

        centerTable: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: scale(300),
            zIndex: Z_INDEX.PILES,
        },

        cardSlot: {
            width: scale(BASE_CARD_WIDTH),
            height: scale(BASE_CARD_WIDTH) * CARD_ASPECT_RATIO,
            borderRadius: scale(BASE_CARD_WIDTH) * CARD_RADIUS_RATIO,
            backgroundColor: theme.cards.cardFront.backgroundColor,

            justifyContent: "center",
            alignItems: "center",
            ...rnShadow("medium"),
        },
        cardSlotDraw: {
            width: scale(BASE_CARD_WIDTH),
            height: scale(BASE_CARD_WIDTH) * CARD_ASPECT_RATIO,
            borderRadius: scale(BASE_CARD_WIDTH) * CARD_RADIUS_RATIO,
            backgroundColor: theme.cards.cardBack.backgroundColor,
            justifyContent: "center",
            alignItems: "center",
            ...rnShadow("medium"),
        },
        slotLabel: {
            fontSize: moderateScale(12),
            fontWeight: "900",
            opacity: 0.8,
            position: "absolute",
            top: -scale(25),
            color: theme.text.primary,
        },

        atuSlot: {
            position: "absolute",
            left: scale(40),
            top: scale(20),
            borderColor: theme.accent,
            borderWidth: scale(2),
            transform: [{ rotateZ: CARD_ATU_ROTATE_Z }],
            zIndex: Z_INDEX.ATU,
            ...rnShadow("contact"),
        },

        discardSlot: {
            borderColor: theme.accent,
            borderWidth: scale(2),
        },

        playerZone: {
            position: "absolute",
            bottom: "10%",
            width: "100%",
            alignItems:"center",
            // 🌟 In Landscape, we limit the height so it doesn't push the table off-screen
            height: isLandscape ? scale(100) : scale(100),
            justifyContent: "center",
            verticalAlign: "bottom",
            zIndex: Z_INDEX.HAND,
            // marginBottom: "10%",
        },

        myAreaHeader: {
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: scale(12),
            zIndex: Z_INDEX.HAND,
        },



        playerCard: {
            // 🌟 Shrink the cards slightly in landscape so they fit the short screen
            width: scale(PLAYER_CARD_WIDTH),
            height: scale(PLAYER_CARD_WIDTH) * CARD_ASPECT_RATIO,
            borderRadius: scale(8),
            backgroundColor: theme.cards.cardFront.backgroundColor,
            ...rnShadow("medium"),
        },

        claimButton: {
            position: "absolute",
            // 🌟 Sits exactly where the discard button sits
            // top: -scale(60),
            // alignSelf: "center",
            // 🌟 Give it a distinct color (like a gold/warning color) so it doesn't look like a normal discard
            backgroundColor: '#FFD700',
            paddingVertical: scale(12),
            paddingHorizontal: scale(32),
            borderRadius: scale(25),
            zIndex: Z_INDEX.UI_OVERLAYS,
            ...rnShadow("heavy"),
        },

        discardButton: {
            position: "absolute",
            top: -scale(60),
            alignSelf: "center",
            backgroundColor: theme.accent,
            paddingVertical: scale(12),
            paddingHorizontal: scale(24),
            borderRadius: scale(25),
            zIndex: Z_INDEX.UI_OVERLAYS,
            ...rnShadow("heavy"),
        },


        actionText: {
            color: theme.background,
            fontWeight: "900",
            fontSize: scale(14),
            letterSpacing: scale(1),
            textTransform: "uppercase",
        },

        myArea: {
            flexDirection: "row",
            // 🌟 1. Push everything to the bottom edge so the cards stick up, not down
            alignItems: "flex-end",
            justifyContent: "space-between",

            // 🌟 2. I highly recommend 100% here. At 50%, your hand will be forced
            // to the left side of the screen instead of true center.
            width: "45%",
            borderRadius: 15,
            // 🌟 3. Give the red bar a fixed, short height (e.g., just tall enough for the text)
            height: scale(60),

            paddingHorizontal: scale(20),
            backgroundColor: theme.playerZone.backgroundArea,

            // 🌟 4. The Magic Keys: Allow children to render outside the bounds
            // and ensure the container renders above the 3D table.
            overflow: "visible",
            zIndex: Z_INDEX.HAND, // or 9999
            elevation: 20, // For Android
        },

        handContainer: {
            flexDirection: "row",
            justifyContent: "center",

            // 🌟 5. Also align the cards to the bottom of this container
            alignItems: "center",
            flexWrap: 'nowrap',
            gap: isLandscape ? scale(4) : scale(8),

            // 🌟 6. Ensure the container itself doesn't clip the cards
            overflow: "visible",

            // Optional: If you want the cards to float slightly *above* the red bar,
            // add a negative bottom margin to push them up:
            marginBottom: scale(10),
        },
// 🌟 The Magic Fix
        sideZone: {
            flex: 1, // Both sides take exactly 50% of the remaining empty space
            // marginLeft: 20,
            // justifyContent: "flex-start",
            // alignContent: "flex-start",
            verticalAlign:"middle",
            // justifyContent: "flex-start",
            alignSelf: "center",
            maxWidth: 100,
        },


        compassWrapper: {
            width: 72,
            height: 72,
            justifyContent: "center",
            alignItems: "center",
        },
        avatarWrap: {
            width: 54,
            height: 54,
            borderRadius: 27,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(140, 100, 255, 0.3)",
        },
        avatarLetter: {
            color: "rgba(200, 180, 255, 0.95)",
            fontWeight: "900",
            fontSize: 20,
            fontStyle: "italic",
        },
    });