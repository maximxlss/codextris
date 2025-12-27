import type { GameRules, LockResultKind, ScoreBreakdown } from './types';

export const formatMultiplier = (value: number) => {
  const fixed = value.toFixed(2);
  return fixed.replace(/\.?0+$/, '');
};

export const formatPercent = (value: number) => {
  const fixed = value.toFixed(2);
  return fixed.replace(/\.?0+$/, '');
};

export const baseScoreForClear = (
  kind: LockResultKind,
  lines: number,
  rules: GameRules
): number => {
  if (kind === 'tspin') {
    return rules.tSpinScores[lines] ?? 0;
  }
  if (kind === 'line' || kind === 'tspin-mini' || kind === 'spin' || kind === 'spin-mini') {
    return rules.lineScores[lines] ?? 0;
  }
  return 0;
};

export const computeScoreBreakdown = (input: {
  kind: LockResultKind;
  lines: number;
  combo: number | undefined;
  backToBackEligible: boolean;
  wasBackToBack: boolean;
  fullClear: boolean;
  rules: GameRules;
}): ScoreBreakdown | null => {
  if (!input.rules.scoreEnabled) return null;
  const base = baseScoreForClear(input.kind, input.lines, input.rules);
  const fullClearBonus = input.fullClear ? Math.max(0, input.rules.fullClearBonus) : 0;
  if (base <= 0 && fullClearBonus <= 0) return null;
  const comboMax = Math.max(1, input.rules.comboMaxMultiplier);
  const comboCurve = Math.max(0, input.rules.comboCurve);
  const comboMultiplier =
    input.combo !== undefined && input.combo > 0
      ? 1 + (comboMax - 1) * (1 - Math.exp(-comboCurve * input.combo))
      : 1;
  const b2bMultiplier =
    input.backToBackEligible && input.wasBackToBack ? input.rules.backToBackMultiplier : 1;
  const total = Math.round(base * b2bMultiplier * comboMultiplier + fullClearBonus);
  return {
    base,
    b2bMultiplier,
    comboMultiplier,
    fullClearBonus,
    total
  };
};

export const createScoringLegend = (rules: GameRules) => {
  const comboMaxValue = Math.max(1, rules.comboMaxMultiplier);
  const comboCurveValue = Math.max(0, rules.comboCurve);
  const comboMax = formatMultiplier(comboMaxValue);
  const comboExamples = [1, 2, 3].map((combo) =>
    formatMultiplier(1 + (comboMaxValue - 1) * (1 - Math.exp(-comboCurveValue * combo)))
  );
  const lineScores = {
    single: rules.lineScores[1] ?? 0,
    double: rules.lineScores[2] ?? 0,
    triple: rules.lineScores[3] ?? 0,
    tetris: rules.lineScores[4] ?? 0
  };
  const tSpinScores = {
    single: rules.tSpinScores[1] ?? 0,
    double: rules.tSpinScores[2] ?? 0,
    triple: rules.tSpinScores[3] ?? 0
  };
  return {
    'LINES': `Single ${lineScores.single} · Double ${lineScores.double} · Triple ${lineScores.triple} · Tetris ${lineScores.tetris}`,
    'T-SPINS': `Single ${tSpinScores.single} · Double ${tSpinScores.double} · Triple ${tSpinScores.triple}\n(Mini/Spin use line scores)`,
    'COMBO': `Multiplier (x${comboExamples.join(', x')}... max x${comboMax}).`,
    'B2B': `Multiplier x${formatMultiplier(rules.backToBackMultiplier)}.`,
    'FULL CLEAR': `+${rules.fullClearBonus}.`
  };
};
