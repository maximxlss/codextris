import type { RenderOptions } from '$lib/game/render/canvas';
import { computeRenderOptionsForStage, resizeCanvasToRenderOptions } from '$lib/game/render/layout';
import { shouldShowViewportGuard } from './viewportGuard';

type LayoutDeps = {
  getCanvas: () => HTMLCanvasElement | null;
  getLayoutEl: () => HTMLElement | null;
  getStageEl: () => HTMLDivElement | null;
  getRenderOptions: () => RenderOptions;
  setRenderOptions: (value: RenderOptions) => void;
  setCtx: (ctx: CanvasRenderingContext2D | null) => void;
  setShowViewportGuard: (value: boolean) => void;
  minViewportWidth: number;
  minViewportHeight: number;
  minViewportAspect: number;
  minCellSize: number;
};

export const createLayoutManager = (deps: LayoutDeps) => {
  const setupCanvas = () => {
    const canvas = deps.getCanvas();
    if (!canvas) return;
    deps.setCtx(resizeCanvasToRenderOptions(canvas, deps.getRenderOptions()));
  };

  const updateLayout = () => {
    const layoutEl = deps.getLayoutEl();
    const stageEl = deps.getStageEl();
    if (!layoutEl || !stageEl) return;
    deps.setRenderOptions(computeRenderOptionsForStage(stageEl));
    setupCanvas();
  };

  const updateViewportFlags = () => {
    deps.setShowViewportGuard(
      shouldShowViewportGuard({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        cellSize: deps.getRenderOptions().cellSize,
        minViewportWidth: deps.minViewportWidth,
        minViewportHeight: deps.minViewportHeight,
        minViewportAspect: deps.minViewportAspect,
        minCellSize: deps.minCellSize
      })
    );
  };

  return {
    setupCanvas,
    updateLayout,
    updateViewportFlags
  };
};
