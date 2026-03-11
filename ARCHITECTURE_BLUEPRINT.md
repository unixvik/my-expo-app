# 🃏 Claim (Cabo) Architecture Blueprint: "The Sandia Engine"

## 1. Vision & Goals
* **Terminology:** From this point forward, "Cabo" is replaced by **Claim**.
* **The "Sandia" Goal:** 120FPS buttery fluidity. No teleporting cards. Physical weight and momentum.
* **Uniformity:** Every card, regardless of position (Hand, Table, Portal), follows the same ratio and physics constants.

---

## 2. Global State Strategy (Zustand + Immer)
We use a **Three-Engine Sync** to bridge the gap between server truth and user perception.

### A. Server Store (`state.server`)
* **Role:** Exact mirror of the Colyseus Schema.
* **Update Trigger:** `room.onStateChange`.
* **Rule:** Never bind UI elements directly to this if they involve movement.

### B. Visual Store (`state.visual`)
* **Role:** The "Display" layer.
* **Predictive Engine:** Updates instantly on local player action (Optimistic UI).
* **Versioning:** Only updates for other players' moves when an animation finishes.

### C. Anchor Registry (`state.ui.anchors`)
* **Role:** Global coordinate dictionary.
* **Logic:** Components report their X, Y, W, H via `measureInWindow` to allow the **Card Portal** to calculate flight paths.

---

## 3. The Animation System (The Mutex Queue)
To prevent overlapping animations and visual race conditions:
* **Tool:** `async-mutex`.
* **Flow:** 1. Server msg arrives -> Enters Queue.
    2. Mutex Locks -> `activeFlightId` set.
    3. **Card Portal** executes flight (Hand-to-Table transition).
    4. `onAnimationEnd` -> **Visual Store** commits the change.
    5. Mutex Unlocks -> Next item in queue starts.

---

## 4. The Card Portal (Global Flight Layer)
The "Portal" handles the transition between the **Flat 2D Hand** and the **3D Tilted Table**.

* **Coordinate Handoff:** Uses `measureInWindow` to calculate delta.
* **Perspective Interpolation:**
    * `rotateX` animates from **0°** (Hand) to **-38°** (Table).
    * `shadowRadius` increases during flight to simulate "lift" depth.
* **Double-Buffered Opacity:** 50ms cross-fade between the "Ghost" card and the "Real" card at landing to hide sub-pixel misalignments.

---

## 5. Foundations & Uniformity
### A. Card Ratios
* **CARD_ASPECT_RATIO:** 1.45
* **CARD_RADIUS_RATIO:** 0.1
* **Scaling:** All dimensions derived from a single `SCALE` variable in `useCardLayout.ts`.

### B. Physics Variants
* `FLIGHT`: High damping (18), medium stiffness (120) - *Airy*.
* `THUD`: Low damping (10), high stiffness (200) - *Heavy/Weighted*.
* `SNAP_BACK`: High stiffness (300) - *For prediction failure*.

---

## 6. Directory Map
| Folder | Responsibility |
| :--- | :--- |
| `src/api` | Colyseus listeners wrapped in `async-mutex`. |
| `src/state` | Zustand slices & constant physics variants. |
| `src/theme` | Unified `palette.ts` with Midnight/Classic themes. |
| `src/hooks` | `useCardLayout` for responsive scaling. |
| `src/components/Overlays` | The **Card Portal** (Global Flight Engine). |
| `src/components/Cards` | Atomic "Dumb" card visuals. |