import type { InputController } from '$lib/game/input';
import type { GameModeDefinition } from '$lib/game/modes';
import type { GameState } from '$lib/game/types';
import type { LeaderboardScope } from '$lib/game/leaderboard';

export type BackendAlert = { id: number; title: string; message: string };

type LeaderboardController = {
  refreshLeaderboards: (mode: GameModeDefinition) => Promise<void>;
  scheduleLeaderboardPolling: (mode: GameModeDefinition) => void;
};

type ModalDeps = {
  game: GameState;
  input: InputController;
  getShowControls: () => boolean;
  setShowControls: (value: boolean) => void;
  getShowSettings: () => boolean;
  setShowSettings: (value: boolean) => void;
  getLeaderboardOpen: () => boolean;
  setLeaderboardOpen: (value: boolean) => void;
  getBackendAlerts: () => BackendAlert[];
  setBackendAlerts: (value: BackendAlert[]) => void;
  getPausedForModal: () => boolean;
  setPausedForModal: (value: boolean) => void;
  getDisplayMode: () => GameModeDefinition;
  getHasNickname: () => boolean;
  setLeaderboardTab: (scope: LeaderboardScope) => void;
  getLeaderboardController: () => LeaderboardController | null;
  cancelResumeCountdown: () => void;
  beginResumeCountdown: () => void;
  isCompetitiveMode: (mode: GameModeDefinition) => boolean;
  getModeById: (modeId: GameModeDefinition['id']) => GameModeDefinition;
};

export const createModalManager = (deps: ModalDeps) => {
  let alertCounter = 0;

  const isAnyModalOpen = () =>
    deps.getShowControls() || deps.getShowSettings() || deps.getLeaderboardOpen();

  const handleModalClose = () => {
    if (!isAnyModalOpen()) {
      if (deps.getPausedForModal() && deps.game.status === 'paused') {
        if (!deps.isCompetitiveMode(deps.getModeById(deps.game.mode.id))) {
          deps.beginResumeCountdown();
        }
      }
      deps.setPausedForModal(false);
    }
  };

  const raiseBackendError = (title: string, message: string) => {
    if (!message) return;
    const alerts = deps.getBackendAlerts();
    const last = alerts[alerts.length - 1];
    if (last && last.title === title && last.message === message) return;
    alertCounter += 1;
    deps.setBackendAlerts([...alerts, { id: alertCounter, title, message }]);
  };

  const dismissBackendAlert = (id: number) => {
    deps.setBackendAlerts(deps.getBackendAlerts().filter((alert) => alert.id !== id));
  };

  const pauseForModal = () => {
    deps.cancelResumeCountdown();
    if (deps.game.status === 'playing') {
      deps.game.status = 'paused';
      deps.setPausedForModal(true);
    }
    deps.input.reset();
  };

  const openControlsModal = () => {
    pauseForModal();
    deps.setShowControls(true);
    deps.setShowSettings(false);
  };

  const openSettingsModal = () => {
    pauseForModal();
    deps.setShowSettings(true);
    deps.setShowControls(false);
  };

  const closeModals = () => {
    deps.setShowControls(false);
    deps.setShowSettings(false);
    handleModalClose();
  };

  const openLeaderboardModal = (scope: LeaderboardScope) => {
    const displayMode = deps.getDisplayMode();
    if (!displayMode.metric) return;
    if (scope === 'mine' && !deps.getHasNickname()) return;
    const controller = deps.getLeaderboardController();
    if (!controller) return;
    pauseForModal();
    deps.setLeaderboardTab(scope);
    deps.setLeaderboardOpen(true);
    void controller.refreshLeaderboards(displayMode);
    controller.scheduleLeaderboardPolling(displayMode);
  };

  const closeLeaderboardModal = () => {
    deps.setLeaderboardOpen(false);
    handleModalClose();
    const controller = deps.getLeaderboardController();
    if (controller) {
      controller.scheduleLeaderboardPolling(deps.getDisplayMode());
    }
  };

  return {
    isAnyModalOpen,
    handleModalClose,
    raiseBackendError,
    dismissBackendAlert,
    openControlsModal,
    openSettingsModal,
    closeModals,
    openLeaderboardModal,
    closeLeaderboardModal
  };
};
