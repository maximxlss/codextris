import type { GameConfig, GameModeId, GameState } from '$lib/game/types';
import type { UiState } from '$lib/ui/types';
import type { GamePageState } from './state';

export const createInitialState = (
  game: GameState,
  ui: UiState,
  configDraft: GameConfig,
  selectedModeId: GameModeId
): GamePageState => ({
  game,
  ui,
  configDraft,
  selectedModeId,
  selectedPreset: 'classic',
  nickname: '',
  nicknameDraft: '',
  audioMuted: false,
  showControls: false,
  showSettings: false,
  leaderboardOpen: false,
  leaderboardTab: 'global',
  showViewportGuard: false,
  bypassViewportGuard: false,
  resumeCountdown: 0,
  submitStatus: 'idle',
  submitError: null,
  lastResult: null,
  lastStatus: game.status,
  leaderboardGlobal: { status: 'idle', entries: [] },
  leaderboardMine: { status: 'idle', entries: [] },
  backendAlerts: [],
  restartCooldownUntil: 0,
  sessionInfo: null,
  sessionError: null,
  sessionStatus: 'idle',
  lastSubmittedKey: null
});
