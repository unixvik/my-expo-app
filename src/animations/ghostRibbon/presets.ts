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
    dur: 700,
    arcH: -110,
    baseRotZ: 0,
    tableRotX: 44,
    handRotX: 0,
    ghostCount: 10,
    historyStep: 3,
    opacity0: 0.52,
    fadePow: 0.72,
    scaleBoost: 0.06,
    stretchMax: 0.32,
};