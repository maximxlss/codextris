import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../types';
import { createRenderOptions, type RenderOptions } from './canvas';

type LayoutOptions = {
  columns?: number;
  rows?: number;
  minCell?: number;
  maxCell?: number;
};

export const computeRenderOptionsForStage = (
  stageEl: HTMLElement,
  { columns = 10, rows = 20, minCell = 10, maxCell = 36 }: LayoutOptions = {}
): RenderOptions => {
  const stageStyle = getComputedStyle(stageEl);
  const padX = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
  const padY = parseFloat(stageStyle.paddingTop) + parseFloat(stageStyle.paddingBottom);
  const stageRect = stageEl.getBoundingClientRect();
  const availableWidth = Math.max(1, stageRect.width - (Number.isNaN(padX) ? 0 : padX));
  const availableHeight = Math.max(1, stageRect.height - (Number.isNaN(padY) ? 0 : padY));
  const base = createRenderOptions(1);
  const widthOverhead = base.width - BOARD_WIDTH;
  const heightOverhead = base.height - VISIBLE_HEIGHT;
  const maxCellW = Math.floor((availableWidth - widthOverhead) / BOARD_WIDTH);
  const maxCellH = Math.floor((availableHeight - heightOverhead) / VISIBLE_HEIGHT);
  const legacyW = Math.floor(availableWidth / columns);
  const legacyH = Math.floor(availableHeight / rows);
  const cellSize = Math.max(
    minCell,
    Math.min(maxCell, maxCellW, maxCellH, legacyW, legacyH)
  );
  return createRenderOptions(cellSize);
};

export const resizeCanvasToRenderOptions = (
  canvasEl: HTMLCanvasElement,
  renderOptions: RenderOptions
): CanvasRenderingContext2D | null => {
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = renderOptions.width * dpr;
  canvasEl.height = renderOptions.height * dpr;
  canvasEl.style.width = `${renderOptions.width}px`;
  canvasEl.style.height = `${renderOptions.height}px`;
  const ctx = canvasEl.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }
  return ctx;
};
