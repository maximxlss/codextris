import type { GameModeDefinition } from '$lib/game/modes';
import type { GameModeId } from '$lib/game/types';
import type { GamePageState } from './state';
import type { LeaderboardEntry } from '$lib/game/leaderboard';
import type { LeaderboardState } from '$lib/game/ui/leaderboardState';
import type { BackendAlert } from '$lib/ui/page/modals';

export type GamePageDerived = {
  selectedMode: GameModeDefinition;
  nicknameValue: string;
  hasNickname: boolean;
  displayName: string;
  linesPerLevel: number;
  linesRemaining: number;
  linesRemainingLabel: string;
  currentMode: GameModeDefinition;
  displayMode: GameModeDefinition;
  resultSummary: {
    timeMs: number;
    lines: number;
    score: number;
    pieces: number;
    pps: number;
    lpm: number;
  };
  goalLines: number | null;
  goalRemaining: number | null;
  goalRemainingLabel: string;
  timeRemainingMs: number | null;
  globalTopEntry: LeaderboardEntry | null;
  mineTopEntry: LeaderboardEntry | null;
  activeLeaderboard: LeaderboardState;
  activeEntries: LeaderboardState['entries'];
  currentMetricValue: number | null;
  globalRank: number | null;
  mineRank: number | null;
  globalRankLabel: string;
  mineRankLabel: string;
  backendAlertStack: BackendAlert[];
};

type DeriveDeps = {
  getModeById: (modeId: GameModeId) => GameModeDefinition;
  rankForMetric: (mode: GameModeDefinition, value: number | null, entries: LeaderboardEntry[]) => number | null;
  formatRank: (rank: number | null, entriesLength: number) => string;
};

export const deriveGamePage = (state: GamePageState, deps: DeriveDeps): GamePageDerived => {
  const selectedMode = deps.getModeById(state.selectedModeId);
  const nicknameValue = state.nicknameDraft.trim();
  const hasNickname = nicknameValue.length > 0;
  const displayName = hasNickname ? nicknameValue : 'Guest';

  const linesPerLevel = Math.max(1, state.game.rules.linesPerLevel);
  const nextLevelTarget = state.ui.level * linesPerLevel;
  const linesRemaining = Math.max(0, nextLevelTarget - state.ui.lines);
  const linesRemainingLabel = linesRemaining === 1 ? 'line' : 'lines';

  const currentMode = deps.getModeById(state.ui.modeId);
  const displayMode = state.ui.status === 'menu' ? selectedMode : currentMode;

  const resultTimeMs = state.lastResult?.timeMs ?? state.ui.modeElapsedMs;
  const resultLines = state.lastResult?.lines ?? state.ui.lines;
  const resultScore = state.lastResult?.score ?? state.ui.score;
  const resultPieces = state.lastResult?.pieces ?? state.ui.modePieces;
  const resultPps = resultTimeMs > 0 ? resultPieces / (resultTimeMs / 1000) : 0;
  const resultLpm = resultTimeMs > 0 ? resultLines / (resultTimeMs / 60000) : 0;

  const goalLines = currentMode.goalLines ?? null;
  const goalRemaining = goalLines !== null ? Math.max(0, goalLines - state.ui.lines) : null;
  const goalRemainingLabel =
    goalRemaining === null ? 'lines' : goalRemaining === 1 ? 'line' : 'lines';

  const timeRemainingMs =
    currentMode.timeLimitMs !== undefined && currentMode.timeLimitMs !== null
      ? Math.max(0, currentMode.timeLimitMs - state.ui.modeElapsedMs)
      : null;

  const globalTopEntry = state.leaderboardGlobal.entries[0] ?? null;
  const mineTopEntry = state.leaderboardMine.entries[0] ?? null;
  const activeLeaderboard = state.leaderboardTab === 'global' ? state.leaderboardGlobal : state.leaderboardMine;
  const activeEntries = activeLeaderboard.entries;

  const currentMetricValue =
    displayMode.metric === 'time'
      ? state.ui.status === 'results' && state.lastResult
        ? state.lastResult.timeMs
        : state.ui.modeElapsedMs
      : displayMode.metric === 'score'
        ? state.ui.status === 'results' && state.lastResult
          ? state.lastResult.score
          : state.ui.score
        : null;

  const globalRank = deps.rankForMetric(displayMode, currentMetricValue, state.leaderboardGlobal.entries);
  const mineRank = hasNickname
    ? deps.rankForMetric(displayMode, currentMetricValue, state.leaderboardMine.entries)
    : null;
  const globalRankLabel = deps.formatRank(globalRank, state.leaderboardGlobal.entries.length);
  const mineRankLabel = deps.formatRank(mineRank, state.leaderboardMine.entries.length);

  const backendAlertStack = [...state.backendAlerts].reverse();

  return {
    selectedMode,
    nicknameValue,
    hasNickname,
    displayName,
    linesPerLevel,
    linesRemaining,
    linesRemainingLabel,
    currentMode,
    displayMode,
    resultSummary: {
      timeMs: resultTimeMs,
      lines: resultLines,
      score: resultScore,
      pieces: resultPieces,
      pps: resultPps,
      lpm: resultLpm
    },
    goalLines,
    goalRemaining,
    goalRemainingLabel,
    timeRemainingMs,
    globalTopEntry,
    mineTopEntry,
    activeLeaderboard,
    activeEntries,
    currentMetricValue,
    globalRank,
    mineRank,
    globalRankLabel,
    mineRankLabel,
    backendAlertStack
  };
};
