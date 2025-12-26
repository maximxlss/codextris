import { DEFAULT_CONFIG } from '$lib/game/types';

export const CUSTOM_PRESET = 'custom';

export const HANDLING_PRESETS = [
  {
    id: 'slow',
    label: 'Slow',
    hint: 'Relaxed',
    config: {
      dasMs: 180,
      arrMs: 40,
      softDropFactor: 12
    }
  },
  {
    id: 'classic',
    label: 'Classic',
    hint: 'Balanced',
    config: {
      dasMs: DEFAULT_CONFIG.dasMs,
      arrMs: DEFAULT_CONFIG.arrMs,
      softDropFactor: DEFAULT_CONFIG.softDropFactor
    }
  },
  {
    id: 'fast',
    label: 'Fast',
    hint: 'Snappy',
    config: {
      dasMs: 120,
      arrMs: 20,
      softDropFactor: 28
    }
  },
  {
    id: 'finesse',
    label: 'Finesse',
    hint: 'Instant',
    config: {
      dasMs: 120,
      arrMs: 0,
      softDropFactor: 0
    }
  }
] as const;

export type HandlingPresetId = (typeof HANDLING_PRESETS)[number]['id'] | typeof CUSTOM_PRESET;
