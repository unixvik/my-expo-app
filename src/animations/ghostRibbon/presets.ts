export type GhostRibbonPreset = {
    dur: number;
    arcH: number;
    baseRotZ: number;
    tableRotX: number;
    handRotX: number;
    ghostCount: number;
    historyStep: number;
    opacity0: number;
    fadePow: number;
    scaleBoost: number;
    stretchMax: number;
};

export const ClassicSilk: GhostRibbonPreset = {
    dur: 360,        // snappier throw, more casual energy
    arcH: 190,       // dramatic but not extreme arc
    baseRotZ: 15,    // card banks in direction of travel (like a thrown card)
    tableRotX: 44,
    handRotX: 160,
    ghostCount: 10,   // elegant ribbon, not too dense
    historyStep: 5,  // tighter trail spacing
    opacity0: 0.25,
    fadePow: 0.05,   // faster fall-off → cleaner ribbon
    scaleBoost: 0,
    stretchMax: 0.26,
};