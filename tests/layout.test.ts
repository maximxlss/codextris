import { describe, expect, it } from 'vitest';
import { shouldShowViewportGuard } from '../src/lib/ui/page/viewportGuard';

type GuardInput = Parameters<typeof shouldShowViewportGuard>[0];

const base: GuardInput = {
  viewportWidth: 1200,
  viewportHeight: 800,
  cellSize: 24,
  minViewportWidth: 960,
  minViewportHeight: 640,
  minViewportAspect: 1.1,
  minCellSize: 18
};

describe('shouldShowViewportGuard', () => {
  it('returns false when viewport is sufficient', () => {
    expect(shouldShowViewportGuard(base)).toBe(false);
  });

  it('flags narrow aspect ratios', () => {
    expect(
      shouldShowViewportGuard({
        ...base,
        viewportWidth: 800,
        viewportHeight: 900
      })
    ).toBe(true);
  });

  it('flags small widths', () => {
    expect(
      shouldShowViewportGuard({
        ...base,
        viewportWidth: 900
      })
    ).toBe(true);
  });

  it('flags small heights', () => {
    expect(
      shouldShowViewportGuard({
        ...base,
        viewportHeight: 600
      })
    ).toBe(true);
  });

  it('flags small cell sizes', () => {
    expect(
      shouldShowViewportGuard({
        ...base,
        cellSize: 12
      })
    ).toBe(true);
  });
});
