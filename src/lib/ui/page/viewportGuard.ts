export type ViewportGuardInput = {
  viewportWidth: number;
  viewportHeight: number;
  cellSize: number;
  minViewportWidth: number;
  minViewportHeight: number;
  minViewportAspect: number;
  minCellSize: number;
};

export const shouldShowViewportGuard = ({
  viewportWidth,
  viewportHeight,
  cellSize,
  minViewportWidth,
  minViewportHeight,
  minViewportAspect,
  minCellSize
}: ViewportGuardInput): boolean => {
  const aspectRatio = viewportWidth / Math.max(1, viewportHeight);
  const tooNarrow = aspectRatio < minViewportAspect;
  const tooSmall =
    viewportWidth < minViewportWidth ||
    viewportHeight < minViewportHeight ||
    cellSize < minCellSize;
  return tooNarrow || tooSmall;
};
