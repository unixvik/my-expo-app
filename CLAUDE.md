# CLAUDE.md — Claim (Cabo) Project Guide

## Commands
```bash
npm start           # Expo dev server
npm run ios         # iOS simulator
npm run android     # Android emulator
npm run web         # Web
npm run lint        # ESLint
```

## Stack
- **React Native** (0.81.5) + **Expo** (v54) + Expo Router (file-based)
- **Zustand** + Immer for state, **Colyseus** for multiplayer
- **Reanimated 4** for 120fps animations, **Gesture Handler 2**
- TypeScript strict mode, path alias `@/*` → `src/*`
- React Compiler enabled, New Architecture enabled

## Architecture (See docs/ARCHITECTURE.md for full details)

### State: Two Zustand Stores
- `useGameStore` — server truth + local UI state (turns, selections, game logic)
- `useVisualStore` — visual/animation state (flying cards, layouts, hand display)

**Never bind movement-triggering UI directly to `server` state** — go through `useVisualStore`.

### Signal Flow
```
Colyseus onStateChange
  → useSyncServer (mutex queue)
  → useGameStore.syncServerState()
  → useVisualStore.spawnFlyingCard()   ← if movement
  → FlightOverlay (120fps Reanimated)
  → onAnimationEnd → useVisualStore.addCardToVisualHand()
  → mutex unlock → next queued message
```

### Key Files
| File | Role |
|------|------|
| `src/state/useGameStore.ts` | Server truth + local UI state |
| `src/state/useVisualStore.ts` | Card flights, layout registry |
| `src/state/constants.ts` | Physics presets, Z-index, card ratios |
| `src/hooks/useSyncServer.ts` | Mutex queue for state sync |
| `src/api/messageQueue.ts` | Colyseus message listeners + flight spawning |
| `src/components/Dev/FlightOverlay.tsx` | Card flight physics engine |
| `src/components/Screens/GameBoard.tsx` | Main game UI (table + opponents + player) |
| `src/theme/themeTokens.ts` | Color/card/table design tokens |

## Conventions
- Components: PascalCase; hooks: `use*`; stores: `use*Store`
- Co-locate styles in `ComponentName.styles.ts`
- Theme via `useTheme()` hook (runtime-selectable: `midnight`)
- Card dimensions derived from single `SCALE` var — never hardcode sizes
- `playerKey` = stable ID (persisted); `sessionId` = transient connection ID
- Colyseus state always `.toJSON()`-converted before entering Zustand

## Physics Presets (`src/state/constants.ts`)
- `FLIGHT` — airy (damping 18, stiffness 120)
- `THUD` — heavy (damping 10, stiffness 200)
- `SNAP_BACK` — stiff (stiffness 300), for prediction failures

## Environment
- Server URL: `EXPO_PUBLIC_GAME_SERVER_URL` or auto-detected by platform
- Dev iOS: `ws://192.168.2.67:2567` | Dev Android: `ws://10.0.2.2:2567`
