import { resolveModeConfig } from '$lib/game/modes';
import type { GameConfig, GameModeId, GameState } from '$lib/game/types';
import type { HandlingPresetId } from '$lib/ui/handlingPresets';
import { detectPreset, normalizeConfig, presetName as resolvePresetName } from '$lib/ui/page/handling';

type PresetConfig = { dasMs: number; arrMs: number; softDropFactor: number };
type HandlingPreset = { id: HandlingPresetId; label: string; config: PresetConfig };

type ConfigManagerDeps = {
  game: GameState;
  getSelectedModeId: () => GameModeId;
  getConfigDraft: () => GameConfig;
  setConfigDraft: (config: GameConfig) => void;
  setSelectedPreset: (presetId: HandlingPresetId) => void;
  presets: ReadonlyArray<HandlingPreset>;
  customPresetId: HandlingPresetId;
  persistConfig: (config: GameConfig) => void;
};

export const createConfigManager = (deps: ConfigManagerDeps) => {
  const applyConfigToGame = (next: GameConfig) => {
    const modeId =
      deps.game.status === 'menu' || deps.game.status === 'results'
        ? deps.getSelectedModeId()
        : deps.game.mode.id;
    deps.game.config = resolveModeConfig(next, modeId);
    deps.game.gravityTimer = 0;
    deps.game.lockTimer = 0;
  };

  const updateConfig = (patch: Partial<GameConfig>) => {
    const normalized = normalizeConfig({ ...deps.getConfigDraft(), ...patch });
    deps.setConfigDraft(normalized);
    deps.setSelectedPreset(detectPreset(normalized, deps.presets, deps.customPresetId));
    applyConfigToGame(normalized);
    deps.persistConfig(normalized);
  };

  const handleNumberInput = (key: keyof GameConfig) => (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(value)) return;
    updateConfig({ [key]: value } as Partial<GameConfig>);
  };

  const applyPreset = (presetId: HandlingPresetId) => {
    const preset = deps.presets.find((entry) => entry.id === presetId);
    if (!preset) return;
    const normalized = normalizeConfig({ ...deps.getConfigDraft(), ...preset.config });
    deps.setConfigDraft(normalized);
    deps.setSelectedPreset(detectPreset(normalized, deps.presets, deps.customPresetId));
    applyConfigToGame(normalized);
    deps.persistConfig(normalized);
  };

  const presetName = (presetId: HandlingPresetId) =>
    resolvePresetName(presetId, deps.presets, deps.customPresetId);

  return {
    applyConfigToGame,
    updateConfig,
    handleNumberInput,
    applyPreset,
    presetName
  };
};
