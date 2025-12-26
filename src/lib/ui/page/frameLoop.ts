import { advanceResumeCountdown } from '$lib/game/ui/resume';
import { EMPTY_PRESSED, type InputController } from '$lib/game/input';
import type { GameEvents, GameState, InputSnapshot, GameStatus, LockResult } from '$lib/game/types';
import type { ClearBanner, RenderOptions } from '$lib/game/render/canvas';
export type FrameLoopDeps = {
  game: GameState;
  input: InputController;
  updateGame: UpdateGame;
  handleEvents: (events: GameEvents) => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onFinalizeResults: () => void;
  onShowClearBanner: (lockResult: LockResult, now: number) => void;
  getShowViewportGuard: () => boolean;
  getBypassViewportGuard: () => boolean;
  getFixedDt: () => number;
  getAccumulator: () => number;
  setAccumulator: (value: number) => void;
  getResumeDeadline: () => number;
  setResumeDeadline: (value: number) => void;
  setResumeCountdown: (value: number) => void;
  setGameStatus: (status: GameStatus) => void;
  getLastStatus: () => GameStatus;
  setLastStatus: (status: GameStatus) => void;
  getClearBanner: () => ClearBanner | null;
  setClearBanner: (banner: ClearBanner | null) => void;
  getCtx: () => CanvasRenderingContext2D | null;
  getRenderOptions: () => RenderOptions;
  renderGame: (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    options: RenderOptions,
    now: number,
    clearBanner?: ClearBanner | null
  ) => void;
  updateUi: () => void;
};

export type UpdateGame = (state: GameState, input: InputSnapshot, dt: number) => GameEvents;

export const createFrameLoop = (deps: FrameLoopDeps) => {
  const tickResumeCountdown = (now: number) => {
    const deadline = deps.getResumeDeadline();
    if (!deadline) return false;
    const result = advanceResumeCountdown(deadline, now);
    deps.setResumeDeadline(result.deadline);
    deps.setResumeCountdown(result.seconds);
    return result.done;
  };

  const handleFrameInput = (snapshot: InputSnapshot, now: number) => {
    if (snapshot.pressed.pause) {
      deps.onTogglePause();
    }
    if (snapshot.pressed.restart) {
      deps.onRestart();
    }

    const resumeReady = tickResumeCountdown(now);
    if (resumeReady) {
      deps.setGameStatus('playing');
      deps.setAccumulator(0);
      deps.input.reset();
    }
  };

  const stepSimulation = (snapshot: InputSnapshot, delta: number, now: number) => {
    if (deps.game.status !== 'playing' || (deps.getShowViewportGuard() && !deps.getBypassViewportGuard())) {
      return;
    }

    let accumulator = deps.getAccumulator();
    accumulator += delta;
    if (accumulator >= deps.getFixedDt()) {
      let first = true;
      while (accumulator >= deps.getFixedDt()) {
        const stepInput = first
          ? snapshot
          : {
              held: snapshot.held,
              pressed: EMPTY_PRESSED
            };
        const events = deps.updateGame(deps.game, stepInput, deps.getFixedDt());
        deps.handleEvents(events);
        if (events.lockResult) {
          deps.onShowClearBanner(events.lockResult, now);
        }
        first = false;
        accumulator -= deps.getFixedDt();
      }
      deps.setAccumulator(accumulator);
      return;
    }

    const events = deps.updateGame(deps.game, snapshot, 0);
    deps.handleEvents(events);
    if (events.lockResult) {
      deps.onShowClearBanner(events.lockResult, now);
    }
    deps.setAccumulator(accumulator);
  };

  const finalizeFrame = (now: number) => {
    const clearBanner = deps.getClearBanner();
    if (clearBanner && now - clearBanner.startedAt > clearBanner.duration) {
      deps.setClearBanner(null);
    }

    if (deps.game.status === 'results' && deps.getLastStatus() !== 'results') {
      deps.onFinalizeResults();
    }
    deps.setLastStatus(deps.game.status);

    const ctx = deps.getCtx();
    if (ctx) {
      deps.renderGame(ctx, deps.game, deps.getRenderOptions(), now, deps.getClearBanner());
    }
    deps.updateUi();
  };

  return {
    handleFrameInput,
    stepSimulation,
    finalizeFrame
  };
};
