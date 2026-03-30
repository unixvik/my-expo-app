# Architecture — The Sandia Engine

**Goal:** 120FPS card animations. No teleporting cards. Physical weight and momentum.

---

## Directory Structure

```
app/                    # Expo Router entry (index.tsx, _layout.tsx)
src/
  api/                  # Colyseus client, message queue, animation queue
  colyseus/             # Auto-generated schema (state.ts)
  state/                # Zustand stores + physics constants
  theme/                # Theme tokens + registry
  types/                # Pure TypeScript types (game.ts)
  hooks/                # Custom hooks
  components/
    Screens/            # Container screens (GameBoard, LobbyScreen)
    Table/              # 3D table, center piles, rings
    Cards/              # Atomic card visuals (CardFace, CardBack, GameCard)
    UI/Player/          # Player hand + hand value
    UI/Opponents/       # Opponent avatars (circular layout)
    Buttons/            # ClaimButton, DiscardButton
    Dev/                # FlightOverlay (animation engine), debug tools
    Overlays/           # Background, overlays
  utils/                # Helpers, animations, suit parsing, layout math
  engine/               # Reserved for future game engine logic
  Common/               # AppText wrapper
```

---

## State Architecture

### useGameStore (`src/state/useGameStore.ts`)
Single source of truth. Three slices:

**`server`** — Mirror of Colyseus schema. Updated only via `syncServerState()`.
```
players: Record<sessionId, PlayerData>
gameStatus: "waiting" | "starting" | "playing" | "roundEnded"
currentTurn: string (sessionId)
discardPile: CardData[]
atuCard: CardData[]
round, turnOrder, countdown, cardsRemaining, ...
```

**`local`** — Optimistic UI state, instant updates.
```
selectedCardId, selectedDiscardIds, discardedCards
isMyTurn, isClaimOpen, heldTopDiscard
themeId: "midnight"
```

**`conn`** — Connection state machine.
```
idle | connecting | reconnecting{roomId, sessionId} | connected{roomId, sessionId} | error{message}
```

### useVisualStore (`src/state/useVisualStore.ts`)
Decoupled from game logic. Manages what the eye sees.
```
visualHand: CardData[]          # Committed hand (updated after animation)
flyingCards: FlyingCard[]       # In-flight animations
layouts: {deck, discard, opponents, player}  # measureInWindow anchors
tableSettled: boolean           # Entrance animation done
isClosingFan: boolean           # Discard fan close animation
```

**Rule:** `visualHand` lags behind `server.players[me].hand` until animations complete. This prevents card teleporting.

---

## Sync Pipeline (Mutex Queue)

```
1. Colyseus broadcasts onStateChange
2. useSyncServer pushes raw state to stateQueueRef
3. async-mutex (isProcessingRef) serializes processing
4. useGameStore.syncServerState(cleanState)  ← server truth committed
5. If cards moved → useVisualStore.spawnFlyingCard(ghost)
6. FlightOverlay animates 120fps via Reanimated worklet
7. onAnimationEnd → useVisualStore.addCardToVisualHand(card)
8. Mutex releases → next queued state processes
```

Key files: `src/hooks/useSyncServer.ts`, `src/api/messageQueue.ts`

---

## Card Flight System (The Card Portal)

`src/components/Dev/FlightOverlay.tsx` is the central animation engine.

**Coordinate Handoff:**
- Components call `measureInWindow` and register via `useVisualStore.setLayout()`
- Flight paths calculated as deltas: `{from: handLayout, to: discardLayout}`

**Perspective Interpolation:**
- Hand → Table: `rotateX` animates 0° → -38°
- `shadowRadius` increases mid-flight (simulates lift)
- Double-buffered opacity (50ms crossfade) hides sub-pixel landing misalignment

**Physics Presets** (`src/state/constants.ts`):
| Name | Damping | Stiffness | Feel |
|------|---------|-----------|------|
| FLIGHT | 18 | 120 | Airy |
| THUD | 10 | 200 | Heavy |
| SNAP_BACK | — | 300 | Stiff correction |

---

## Theme System

Runtime-selectable via `useGameStore.local.themeId`.

```
themeTokens.ts   → raw token definitions (midnight, casinoTokens)
theme.ts         → registry: { midnight: makeTheme(midnightTokens) }
useTheme()       → returns current theme object
```

Token structure: `colors`, `cards.back`, `cards.front`, `table`, `playerZone`

---

## Data Models

### CardData
```typescript
{ suit: string; rank: string; value: number; id: string }
```

### PlayerData
```typescript
{
  id, sessionId, name, connected, ready
  hand: CardData[], handValue: number
  stagedDiscardIds: string[], toDiscardCard: CardData[]
  totalPoints, isHost, isBot
  awaitingMandatoryDraw, botTargetRank, botTurnSeq, ...
}
```

### FlyingCard (animation state)
```typescript
{ id, card, startX, startY, endX?, endY?, type: "draw"|"discard", isFacedown, fanIndex? }
```

---

## Component Hierarchy

```
GameController (lobby/game router)
└── GameBoard
    ├── TableSurface (3D perspective, entrance float animation)
    │   └── CenterTable (ATU pile, discard pile, deck)
    ├── OpponentsLayer (circular opponent avatars)
    ├── PlayerLayer (hand cards + action buttons)
    └── FlightOverlay (absolute-positioned, always on top)
```

---

## Key IDs & Identity

- `playerKey` — stable player UUID, persisted across sessions (`src/utils/playerKey.ts`)
- `sessionId` — transient Colyseus connection ID, changes on reconnect
- `currentTurn` — references `sessionId`, not `playerKey`
- Colyseus schema always `.toJSON()`-converted before entering Zustand (prevents proxy leaks)

---

## Responsive Scaling

- Single `SCALE` variable drives all card dimensions (in `src/state/constants.ts`)
- `CARD_ASPECT_RATIO: 1.45`, `CARD_RADIUS_RATIO: 0.1`
- `useResponsive()` provides `scale`, `moderateScale`, `isLandscape`
- App is locked to **landscape** orientation

---

## Networking

- **Colyseus SDK** (`src/api/client.ts`) — singleton client
- Room instance stored globally in `src/api/roomInstance.ts` (stable ref across renders)
- Server URL detection:
  - Prod: `EXPO_PUBLIC_GAME_SERVER_URL`
  - iOS sim: `ws://192.168.2.67:2567`
  - Android emu: `ws://10.0.2.2:2567`
- Reconnection logic in `src/hooks/useRoomConnection.ts`
