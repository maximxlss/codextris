import { formatMultiplier } from '$lib/game/scoring';
import type { ClearBanner } from '$lib/game/render/canvas';
import type { LockResult } from '$lib/game/types';

const labelForClear = (result: LockResult): string => {
  if (result.kind === 'tspin') {
    if (result.lines === 3) return 'T-SPIN TRIPLE';
    if (result.lines === 2) return 'T-SPIN DOUBLE';
    if (result.lines === 1) return 'T-SPIN SINGLE';
    return 'T-SPIN';
  }
  if (result.kind === 'tspin-mini') {
    if (result.lines === 2) return 'T-SPIN MINI DOUBLE';
    if (result.lines === 1) return 'T-SPIN MINI SINGLE';
    return 'T-SPIN MINI';
  }
  if (result.kind === 'spin') {
    const base = result.spinType ? `${result.spinType}-SPIN` : 'SPIN';
    if (result.lines === 3) return `${base} TRIPLE`;
    if (result.lines === 2) return `${base} DOUBLE`;
    if (result.lines === 1) return `${base} SINGLE`;
    return base;
  }
  if (result.kind === 'spin-mini') {
    const base = result.spinType ? `${result.spinType}-SPIN MINI` : 'SPIN MINI';
    if (result.lines === 2) return `${base} DOUBLE`;
    if (result.lines === 1) return `${base} SINGLE`;
    return base;
  }
  switch (result.lines) {
    case 4:
      return 'TETRIS';
    case 3:
      return '3 LINES';
    case 2:
      return '2 LINES';
    default:
      return 'SINGLE';
  }
};

const scoreDetailsForClear = (result: LockResult): string[] => {
  const score = result.score;
  if (!score) return [];
  const details: string[] = [];
  details.push(`+${score.total} pts`);
  details.push(`Base ${score.base}`);
  if (score.b2bMultiplier > 1) {
    details.push(`B2B x${formatMultiplier(score.b2bMultiplier)}`);
  }
  if (score.comboMultiplier > 1) {
    details.push(`Combo x${formatMultiplier(score.comboMultiplier)}`);
  }
  if (score.fullClearBonus > 0) {
    details.push(`Full clear +${score.fullClearBonus}`);
  }
  if (details.length <= 2) return [details.join(' • ')];
  const grouped: string[] = [];
  for (let i = 0; i < details.length; i += 2) {
    grouped.push(details.slice(i, i + 2).join(' • '));
  }
  return grouped;
};

export const buildClearBanner = (lockResult: LockResult, now: number): ClearBanner | null => {
  if (lockResult.lines <= 0) return null;
  const base = labelForClear(lockResult);
  const tetrisSubtitle = lockResult.lines === 4 ? '4 LINES' : undefined;
  const duration = lockResult.fullClear ? 3400 : 3000;
  const details = scoreDetailsForClear(lockResult);
  if (lockResult.fullClear) {
    return {
      title: 'FULL CLEAR',
      ...(tetrisSubtitle ? { subtitle: `${base} • ${tetrisSubtitle}` } : { subtitle: base }),
      ...(details.length > 0 ? { details } : {}),
      startedAt: now,
      duration
    };
  }
  return {
    title: base,
    ...(tetrisSubtitle ? { subtitle: tetrisSubtitle } : {}),
    ...(details.length > 0 ? { details } : {}),
    startedAt: now,
    duration
  };
};
