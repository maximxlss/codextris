import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HIDDEN_ROWS,
  VISIBLE_HEIGHT,
  type GameState,
  type PieceType
} from '../types';
import { INDEX_TO_PIECE, PIECE_COLORS, getPieceCells } from '../pieces';
import { getGhostY } from '../tetris';
import { mix, rgba } from './color';
import { drawRoundedRect } from './shapes';

export interface RenderOptions {
  cellSize: number;
  boardX: number;
  boardY: number;
  panelX: number;
  panelWidth: number;
  width: number;
  height: number;
}

export interface ClearBanner {
  title: string;
  subtitle?: string;
  details?: string[];
  startedAt: number;
  duration: number;
}

export const createRenderOptions = (cellSize = 28): RenderOptions => {
  const boardWidth = cellSize * BOARD_WIDTH;
  const boardHeight = cellSize * VISIBLE_HEIGHT;
  const boardX = 28;
  const boardY = 28;
  const panelWidth = 160;
  const panelX = boardX + boardWidth + 16;
  const width = panelX + panelWidth + 24;
  const height = boardY + boardHeight + 28;
  return { cellSize, boardX, boardY, panelX, panelWidth, width, height };
};

const UI = {
  bg: '#070a12',
  panel: 'rgba(255, 255, 255, 0.04)',
  stroke: 'rgba(255, 255, 255, 0.08)',
  text: 'rgba(255, 255, 255, 0.72)',
  muted: 'rgba(255, 255, 255, 0.45)',
  accent: '#4debff'
};

const drawCell = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: PieceType,
  alpha = 1
) => {
  const palette = PIECE_COLORS[type];
  const inset = size * 0.08;
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, mix(palette.fill, palette.glow, 0.2));
  grad.addColorStop(1, palette.fill);
  ctx.fillStyle = grad;
  const glowAlpha = Math.max(0, Math.min(0.35, 0.24 * alpha));
  ctx.shadowColor = rgba(palette.glow, glowAlpha);
  ctx.shadowBlur = size * 0.14 * (0.4 + alpha);
  drawRoundedRect(ctx, x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.strokeStyle = palette.edge;
  ctx.stroke();
  ctx.restore();
};

const drawMiniPiece = (
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  x: number,
  y: number,
  size: number
) => {
  const cells = getPieceCells(type, 0);
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  for (const cell of cells) {
    const cx = x + (cell.x - minX) * size;
    const cy = y + (cell.y - minY) * size;
    drawCell(ctx, cx, cy, size, type, 0.95);
  }
};

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = UI.bg;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.4,
    Math.min(width, height) * 0.2,
    width * 0.5,
    height * 0.4,
    Math.max(width, height) * 0.8
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
};

const drawBoardSurface = (
  ctx: CanvasRenderingContext2D,
  surfaceX: number,
  surfaceY: number,
  surfaceW: number,
  surfaceH: number,
  boardX: number,
  boardY: number,
  boardW: number,
  boardH: number
) => {
  ctx.fillStyle = UI.panel;
  drawRoundedRect(ctx, surfaceX, surfaceY, surfaceW, surfaceH, 14);
  ctx.fill();
  ctx.strokeStyle = UI.stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = UI.bg;
  drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 10);
  ctx.fill();
  ctx.strokeStyle = UI.stroke;
  ctx.stroke();
};

const drawBoardGrid = (ctx: CanvasRenderingContext2D, cellSize: number, boardW: number, boardH: number) => {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, boardH);
    ctx.stroke();
  }
  for (let y = 0; y <= VISIBLE_HEIGHT; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(boardW, y * cellSize);
    ctx.stroke();
  }
};

const drawStackCells = (ctx: CanvasRenderingContext2D, state: GameState, cellSize: number) => {
  for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const value = state.board[y]?.[x] ?? 0;
      if (value !== 0) {
        const type = INDEX_TO_PIECE[value];
        if (!type) continue;
        const drawX = x * cellSize;
        const drawY = (y - HIDDEN_ROWS) * cellSize;
        drawCell(ctx, drawX, drawY, cellSize, type);
      }
    }
  }
};

const drawGhostAndActive = (ctx: CanvasRenderingContext2D, state: GameState, cellSize: number) => {
  const ghostY = getGhostY(state);
  const ghostCells = getPieceCells(state.active.type, state.active.rotation);
  for (const cell of ghostCells) {
    const gx = (state.active.x + cell.x) * cellSize;
    const gy = (ghostY + cell.y - HIDDEN_ROWS) * cellSize;
    if (ghostY + cell.y >= HIDDEN_ROWS) {
      drawCell(ctx, gx, gy, cellSize, state.active.type, 0.16);
    }
  }

  const activeCells = getPieceCells(state.active.type, state.active.rotation);
  for (const cell of activeCells) {
    const ax = (state.active.x + cell.x) * cellSize;
    const ay = (state.active.y + cell.y - HIDDEN_ROWS) * cellSize;
    if (state.active.y + cell.y >= HIDDEN_ROWS) {
      drawCell(ctx, ax, ay, cellSize, state.active.type);
    }
  }
};

let boardBuffer: HTMLCanvasElement | null = null;
let boardBufferCtx: CanvasRenderingContext2D | null = null;
let boardBufferDpr = 1;

const getBoardBuffer = (boardW: number, boardH: number) => {
  if (typeof document === 'undefined') return null;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  if (!boardBuffer) {
    boardBuffer = document.createElement('canvas');
    boardBufferCtx = boardBuffer.getContext('2d');
  }
  if (!boardBuffer || !boardBufferCtx) return null;
  const nextW = Math.max(1, Math.floor(boardW * dpr));
  const nextH = Math.max(1, Math.floor(boardH * dpr));
  if (boardBuffer.width !== nextW || boardBuffer.height !== nextH || boardBufferDpr !== dpr) {
    boardBuffer.width = nextW;
    boardBuffer.height = nextH;
    boardBufferDpr = dpr;
    boardBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boardBufferCtx.imageSmoothingEnabled = true;
  }
  boardBufferCtx.clearRect(0, 0, boardW, boardH);
  return { canvas: boardBuffer, ctx: boardBufferCtx };
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  options: RenderOptions,
  now: number,
  clearBanner?: ClearBanner | null
) => {
  const { cellSize, boardX, boardY, panelX, panelWidth, width, height } = options;
  drawBackground(ctx, width, height);

  const shake = state.effects.shake;
  const shakeX = Math.sin(now * 0.018) * shake * 6;
  const shakeY = Math.cos(now * 0.022) * shake * 4;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const boardW = cellSize * BOARD_WIDTH;
  const boardH = cellSize * VISIBLE_HEIGHT;
  const surfaceX = boardX - 8;
  const surfaceY = boardY - 8;
  const surfaceW = panelX + panelWidth + 8 - surfaceX;
  const surfaceH = boardH + 16;
  drawBoardSurface(ctx, surfaceX, surfaceY, surfaceW, surfaceH, boardX, boardY, boardW, boardH);

  const boardBufferPack = getBoardBuffer(boardW, boardH);
  if (boardBufferPack) {
    const boardCtx = boardBufferPack.ctx;
    drawBoardGrid(boardCtx, cellSize, boardW, boardH);
    drawStackCells(boardCtx, state, cellSize);
    if (state.status !== 'menu') {
      drawGhostAndActive(boardCtx, state, cellSize);
    }

    if (state.effects.spinParticles.length > 0) {
      for (const particle of state.effects.spinParticles) {
        const trail =
          particle.trail.length > 0
            ? particle.trail
            : [{ x: particle.x, y: particle.y, life: particle.ttl, ttl: particle.ttl }];
        const last = trail[trail.length - 1]!;
        if (last.y < HIDDEN_ROWS || last.y >= BOARD_HEIGHT) continue;
        const baseWidth = Math.max(0.5, cellSize * (0.022 + particle.size * 0.3));
        boardCtx.save();
        boardCtx.lineCap = 'round';
        for (let i = 1; i < trail.length; i += 1) {
          const p0 = trail[i - 1]!;
          const p1 = trail[i]!;
          if (p0.y < HIDDEN_ROWS && p1.y < HIDDEN_ROWS) continue;
          if (p0.y >= BOARD_HEIGHT && p1.y >= BOARD_HEIGHT) continue;
          const lifeAlpha = Math.min(1, Math.max(0, p1.life / (p1.ttl || 1)));
          const heat = Math.max(0, Math.min(1, lifeAlpha));
          const g = Math.round(160 + 80 * heat);
          const b = Math.round(70 + 150 * heat);
          boardCtx.globalAlpha = 0.7 * lifeAlpha;
          boardCtx.lineWidth = baseWidth;
          boardCtx.strokeStyle = `rgba(255, ${g}, ${b}, 0.9)`;
          boardCtx.beginPath();
          boardCtx.moveTo(p0.x * cellSize, (p0.y - HIDDEN_ROWS) * cellSize);
          boardCtx.lineTo(p1.x * cellSize, (p1.y - HIDDEN_ROWS) * cellSize);
          boardCtx.stroke();
        }
        boardCtx.restore();
      }
    }

    if (state.effects.lineFlash > 0) {
      const flash = Math.max(0, Math.min(1, state.effects.lineFlash));
      const eased = flash * flash;
      const cx = boardW / 2;
      const cy = boardH / 2;
      const radius = Math.max(boardW, boardH) * 0.7;
      const grad = boardCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(77, 235, 255, ${0.14 * eased})`);
      grad.addColorStop(0.6, `rgba(77, 235, 255, ${0.04 * eased})`);
      grad.addColorStop(1, 'rgba(77, 235, 255, 0)');
      boardCtx.fillStyle = grad;
      boardCtx.fillRect(0, 0, boardW, boardH);
    }

    ctx.drawImage(boardBufferPack.canvas, boardX, boardY, boardW, boardH);
  }

  ctx.strokeStyle = UI.stroke;
  ctx.beginPath();
  ctx.moveTo(panelX - 8, boardY);
  ctx.lineTo(panelX - 8, boardY + boardH);
  ctx.stroke();

  ctx.fillStyle = UI.text;
  ctx.font = '600 14px "Space Grotesk", sans-serif';
  ctx.fillText('HOLD', panelX + 8, boardY + 18);
  if (state.hold) {
    drawMiniPiece(ctx, state.hold, panelX + 12, boardY + 26, Math.floor(cellSize * 0.6));
  } else {
    ctx.fillStyle = UI.muted;
    ctx.fillText('—', panelX + 22, boardY + 46);
  }

  ctx.fillStyle = UI.text;
  ctx.fillText('NEXT', panelX + 8, boardY + 110);
  const previewSize = Math.floor(cellSize * 0.55);
  state.queue.slice(0, 4).forEach((piece, index) => {
    const py = boardY + 120 + index * (previewSize * 3.2);
    drawMiniPiece(ctx, piece, panelX + 12, py, previewSize);
  });

  let bannerBounds: { x: number; y: number; w: number; h: number } | null = null;
  if (clearBanner) {
    const elapsed = now - clearBanner.startedAt;
    const progress = Math.min(1, Math.max(0, elapsed / clearBanner.duration));
    const fadeStart = 0.65;
    const fadeT = progress < fadeStart ? 1 : Math.max(0, 1 - (progress - fadeStart) / (1 - fadeStart));
    const bannerAlpha = Math.max(0, Math.min(1, fadeT));
    if (bannerAlpha > 0.01) {
      const detailLines = [
        ...(clearBanner.subtitle ? [clearBanner.subtitle] : []),
        ...(clearBanner.details ?? [])
      ];
      const nextBottom = boardY + 120 + 4 * (previewSize * 3.2);
      const bannerW = panelWidth - 12;
      const lineStep = 12;
      const bannerH = 66 + detailLines.length * lineStep;
      const bannerX = panelX + 6;
      const bannerY = Math.min(boardY + boardH - bannerH - 12, nextBottom + 16);
      bannerBounds = { x: bannerX, y: bannerY, w: bannerW, h: bannerH };
      const scaleIn = Math.min(1, elapsed / 180);
      const scale = 0.96 + 0.04 * scaleIn;
      ctx.save();
      ctx.globalAlpha = bannerAlpha;
      ctx.translate(bannerX + bannerW / 2, bannerY + bannerH / 2);
      ctx.scale(scale, scale);
      ctx.translate(-bannerW / 2, -bannerH / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;
      drawRoundedRect(ctx, 0, 0, bannerW, bannerH, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '600 9px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LINE CLEAR', bannerW / 2, 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.font = '700 16px "Space Grotesk", sans-serif';
      ctx.fillText(clearBanner.title, bannerW / 2, 38);
      if (detailLines.length > 0) {
        const baseY = 56;
        detailLines.forEach((line, index) => {
          const isSubtitle = index === 0 && !!clearBanner.subtitle;
          ctx.fillStyle = isSubtitle ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.5)';
          ctx.font = isSubtitle
            ? '600 11px "Space Grotesk", sans-serif'
            : '600 10px "Space Grotesk", sans-serif';
          ctx.fillText(line, bannerW / 2, baseY + index * lineStep);
        });
      }
      ctx.restore();
    }
  }

  drawSprintLinesRemaining(ctx, state, options, bannerBounds);

  ctx.restore();
};

const drawSprintLinesRemaining = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  options: RenderOptions,
  bannerBounds: { x: number; y: number; w: number; h: number } | null
) => {
  if (state.mode.id !== 'sprint40') return;
  if (state.status !== 'playing' && state.status !== 'paused') return;
  const goalLines = state.mode.goalLines ?? 0;
  const remaining = Math.max(0, goalLines - state.lines);
  const suffix = 'lines left';
  const value = `${remaining}`;
  const suffixFont = '600 12px "Space Grotesk", sans-serif';
  const valueFont = '700 25px "Space Grotesk", sans-serif';
  const boardH = options.cellSize * VISIBLE_HEIGHT;
  const panelBottom = options.boardY + boardH;
  let baseY = panelBottom - 12;
  if (bannerBounds) {
    const desired = bannerBounds.y + bannerBounds.h + 18;
    baseY = Math.min(panelBottom - 12, Math.max(baseY, desired));
  }
  const rightX = options.panelX + options.panelWidth - 12;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.font = suffixFont;
  const suffixWidth = ctx.measureText(suffix).width;
  ctx.fillStyle = UI.text;
  ctx.fillText(suffix, rightX, baseY);
  ctx.font = valueFont;
  ctx.fillStyle = UI.accent;
  ctx.fillText(value, rightX - suffixWidth - 8, baseY);
  ctx.restore();
};
