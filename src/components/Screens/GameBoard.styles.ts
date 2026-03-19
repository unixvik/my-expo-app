import {StyleSheet, ViewStyle} from 'react-native';
import {GameTheme} from '@/theme/themeTokens';
import {
    CARD_ASPECT_RATIO,
    CARD_RADIUS_RATIO,
    TABLE_TILT,
    TABLE_PERSPECTIVE,
    Z_INDEX, rnShadow, CARD_ATU_ROTATE_Z,
    BASE_CARD_WIDTH,
    CENTER_TABLE_CARD_SCALE,
    PLAYER_CARD_WIDTH,
    TABLE_OVAL_RATIO, CARD_PLAYER_SCALE_RATIO,
} from '@/state/constants';

const seatTop = 5 * TABLE_OVAL_RATIO;
const seatBottomLeft = 20 * TABLE_OVAL_RATIO;
const seatBottomRight = 20 * TABLE_OVAL_RATIO;

export const createStyles = (
    theme: GameTheme,
    scale: (size: number) => number,
    moderateScale: (size: number) => number,
    isLandscape: boolean,
) =>
    StyleSheet.create({
        backgroundImage: {
            // position: "relative",
            zIndex: -1,
            // backgroundImage: {
            position: 'absolute',

            width: '100%',
            height: '100%'
        },
        dot: {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
        },
        label: {
            fontSize: 8,
            color: 'white',
            position: 'absolute',
            top: 10,
            fontWeight: 'bold',
            backgroundColor: 'black',
            paddingHorizontal: 2,
        },
        board: {
            flex: 1,
            backgroundColor: theme.background,
            width: "100%",
            height: "100%",
            // Ensure the board itself is the relative parent for all absolute children
            position: 'relative',
            overflow: 'hidden',
        },
        tableContainer: {
            // DO NOT use flex: 1 here if it's causing drift.
            // Use absolute centering to match the background's center.
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1,
        },

// 🌟 2. The 3D Engine (Isolated inside the wrapper)
        table3D: {
            justifyContent: "center",
            alignItems: "center",
            transform: [
                {perspective: TABLE_PERSPECTIVE},
                {rotateX: `${TABLE_TILT}deg`},
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
            transform: [{translateX: -scale(45)}]
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
                {translateY: "0%"},
                {translateX: "0%"}
            ],
            height: "100%",
            width: "100%",
            // backgroundColor: "red",
            aspectRatio: TABLE_OVAL_RATIO,
            overflow: "visible",
            justifyContent: "center",
            alignItems: "center",
            borderColor: theme.table.rim,
            // borderWidth: scale(20),
            borderRadius: 1000,
        },

        centerTable: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: scale(100 * TABLE_OVAL_RATIO),
            zIndex: 100,
            overflow: 'visible',
        },

        cardSlotDraw: {
            width: scale(BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE),
            height: scale(BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE) * CARD_ASPECT_RATIO,
            borderRadius: scale(BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE) * CARD_RADIUS_RATIO,
            // backgroundColor: theme.cards.cardBack.backgroundColor,
            justifyContent: "center",
            alignItems: "center",
            ...rnShadow("medium"),
        },

        tableCardArtwork: {
            // width: '100%',
            // height: '100%',
            borderRadius: scale(8),
            backgroundColor: theme.cards.cardFront.backgroundColor, // Gives the facedown deck a solid base
            overflow: 'hidden',
            // zIndex:100,
            ...rnShadow("heavy"),
        },
        // slotLabel: {
        //     fontSize: moderateScale(8),
        //     fontWeight: "800",
        //     opacity: 0.8,
        //
        //     // position: "absolute",
        //     // overflow: "visible",
        //     top: -scale(15),
        //     color: theme.text.primary,
        // },

        deckWrapper: {
            alignItems: "center",
            justifyContent: "center",
        },

        atuSlot: {
            marginLeft: "100%",
            position: "absolute",
            borderColor: theme.accent,
            borderWidth: scale(2),
            transform: [{rotateZ: CARD_ATU_ROTATE_Z}],
            zIndex: Z_INDEX.ATU,
            ...rnShadow("contact"),
        },

        discardSlot: {
            borderColor: theme.accent,
            borderWidth: scale(2),
            zIndex: Z_INDEX.PILES,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            width: scale(BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE) + scale(20),
            height: scale(BASE_CARD_WIDTH * CENTER_TABLE_CARD_SCALE) * CARD_ASPECT_RATIO + scale(20),
            borderRadius: 10,
            position: 'relative', // Ensure children absolute to this
        },
        cardContainer: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'visible',
            backfaceVisibility: 'visible',
        },
        absoluteCenter: {
            position: 'absolute',
            // By NOT using absoluteFill here, the View wraps the CardFace size
            // and is centered by the parent's flex rules
        },
        centerContent: {
            justifyContent: 'center',
            alignItems: 'center',
            transform: [
                {
                    translateX: 10,
                },
            ],
            zIndex: Z_INDEX.CARD_PORTAL
        },
        slotLabel: {
            position: 'absolute',
            top: "-40%",
            zIndex: 0, // Keep label above cards
        },
        playerZone: {
            position: "absolute",
            bottom: "5%",
            width: "100%",
            minWidth: "25%",
            alignItems: "center",
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
            marginBottom: scale(0),
            zIndex: Z_INDEX.HAND,

        },


        playerCard: {
            // 🌟 Shrink the cards slightly in landscape so they fit the short screen
            // width: scale(PLAYER_CARD_WIDTH*CARD_PLAYER_SCALE_RATIO),
            // height: scale(PLAYER_CARD_WIDTH*CARD_PLAYER_SCALE_RATIO) * CARD_ASPECT_RATIO,
            // borderRadius: scale(10),
            // backgroundColor: theme.cards.cardFront.backgroundColor,
            // ...rnShadow("heavy"),
        },

        // 🌟 1. The Physics Box (Casts the shadow, holds the math)
        playerCardWrapper: {
            // minWidth: "100%",
            width: scale(PLAYER_CARD_WIDTH * CARD_PLAYER_SCALE_RATIO),
            height: scale(PLAYER_CARD_WIDTH * CARD_PLAYER_SCALE_RATIO) * CARD_ASPECT_RATIO,
            ...rnShadow("heavy"),
            borderRadius: scale(10),
            // opacity: 0.3,
            // CRITICAL: Never put overflow: 'hidden' or backgroundColor here!
        },

// 🌟 2. The Canvas (Clips the artwork)
        playerCardArtwork: {
            flex: 1, // Fills the wrapper perfectly
            // borderRadius: scale(8),
            // backgroundColor: theme.cards.cardFront.backgroundColor,
            // overflow: 'hidden', // Keeps your card images safely inside the rounded corners
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
            top: -scale(160),
            alignSelf: "center",
            backgroundColor: theme.accent,
            paddingVertical: scale(10),
            paddingHorizontal: scale(20),
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
            alignItems: "flex-end",

            // 🌟 1. The Magic Key for dynamic resizing:
            alignSelf: "center",

            // 🌟 2. Remove justifyContent: "space-between" (let the items pack together naturally)
            // justifyContent: "center", // Optional, but usually default for wrapped content

            // 🌟 3. Add a gap so the avatar and hand value don't touch the cards
            gap: scale(16),


            borderRadius: 25,
            height: scale(60),
            paddingHorizontal: scale(10),

            // To see the resizing work clearly:
            // backgroundColor: theme.playerZone.backgroundArea,

            overflow: "visible",
            zIndex: Z_INDEX.HAND,
            elevation: 20,
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
            minWidth: "30%",
            // Optional: If you want the cards to float slightly *above* the red bar,
            // add a negative bottom margin to push them up:
            marginBottom: scale(20),
        },
// 🌟 4. Fixed Symmetrical Anchors
        sideZone: {
            // Both sides must have the EXACT same width to keep the cards perfectly centered
            width: scale(60),
            // height: "100%", // Fill the 60px height of myArea
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: scale(10), // Adjust to align with the cards visually
        },

        sideZoneRight: {
            // Exactly matches sideZone
            width: scale(60),
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: scale(10),
        },
        sideZoneRightHand: {
            color: theme.text.secondary,
            alignItems: "center",
            alignSelf: "center",
            fontSize: 20,
            fontWeight: 500
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
            padding: "35%",
            borderRadius: 45,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,


            borderColor: "rgba(140, 100, 255, 0.3)",
        },
        avatarLetter: {
            color: "rgba(200, 180, 255, 0.95)",
            fontWeight: "900",
            fontSize: 40,
            // fontStyle: "italic",
        },
    });