import { clamp } from '$lib/game/utils/math';
import type { GameConfig } from '$lib/game/types';
import type { HandlingPresetId } from '$lib/ui/handlingPresets';

export const normalizeConfig = (draft: GameConfig): GameConfig => ({
  gravityMs: clamp(draft.gravityMs, 50, 2000),
  lockDelayMs: clamp(draft.lockDelayMs, 100, 2000),
  dasMs: clamp(draft.dasMs, 0, 400),
  arrMs: clamp(draft.arrMs, 0, 200),
  softDropFactor: clamp(draft.softDropFactor, 0, 100)
});

export const detectPreset = (
  config: GameConfig,
  presets: ReadonlyArray<{ id: HandlingPresetId; config: { dasMs: number; arrMs: number; softDropFactor: number } }>,
  customId: HandlingPresetId
): HandlingPresetId => {
  const match = presets.find(
    (preset) =>
      config.dasMs === preset.config.dasMs &&
      config.arrMs === preset.config.arrMs &&
      config.softDropFactor === preset.config.softDropFactor
  );
  return match ? match.id : customId;
};

export const presetName = (
  presetId: HandlingPresetId,
  presets: ReadonlyArray<{ id: HandlingPresetId; label: string }>,
  customId: HandlingPresetId
): string => {
  if (presetId === customId) return 'Custom';
  return presets.find((entry) => entry.id === presetId)?.label ?? 'Custom';
};
