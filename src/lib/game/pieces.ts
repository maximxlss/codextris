import type { PieceType, Rotation } from './types';

export const PIECE_TYPES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const PIECE_INDEX: Record<PieceType, number> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7
};

export const INDEX_TO_PIECE: Record<number, PieceType> = {
  1: 'I',
  2: 'J',
  3: 'L',
  4: 'O',
  5: 'S',
  6: 'T',
  7: 'Z'
};

export const PIECE_COLORS: Record<PieceType, { fill: string; glow: string; edge: string }> = {
  I: { fill: '#00ffff', glow: '#b7ffff', edge: '#008c8c' },
  J: { fill: '#0000ff', glow: '#a3a3ff', edge: '#00008a' },
  L: { fill: '#ffa500', glow: '#ffd59b', edge: '#b36b00' },
  O: { fill: '#ffff00', glow: '#ffffb0', edge: '#b3b300' },
  S: { fill: '#00ff00', glow: '#a6ffa6', edge: '#008a00' },
  T: { fill: '#ff00ff', glow: '#ffb0ff', edge: '#8a008a' },
  Z: { fill: '#ff0000', glow: '#ff9e9e', edge: '#8a0000' }
};

export interface CellOffset {
  x: number;
  y: number;
}

const JLSTZ_BASE: Record<Exclude<PieceType, 'I' | 'O'>, CellOffset[]> = {
  J: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: -1 }
  ],
  L: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 }
  ],
  S: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 }
  ],
  T: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 }
  ],
  Z: [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: -1 }
  ]
};

const O_BASE: CellOffset[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: -1 }
];

const rotateCW = (cell: CellOffset): CellOffset => ({
  x: -cell.y,
  y: cell.x
});

const buildRotations = (base: CellOffset[]): CellOffset[][] => {
  const rotations: CellOffset[][] = [base];
  for (let i = 1; i < 4; i += 1) {
    const prev = rotations[i - 1]!;
    rotations.push(prev.map((cell) => rotateCW(cell)));
  }
  return rotations;
};

const JLSTZ_ROTATIONS: Record<Exclude<PieceType, 'I' | 'O'>, CellOffset[][]> = {
  J: buildRotations(JLSTZ_BASE.J),
  L: buildRotations(JLSTZ_BASE.L),
  S: buildRotations(JLSTZ_BASE.S),
  T: buildRotations(JLSTZ_BASE.T),
  Z: buildRotations(JLSTZ_BASE.Z)
};

const I_ROTATIONS: CellOffset[][] = [
  [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ],
  [
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 }
  ],
  [
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 }
  ]
];
const O_ROTATIONS: CellOffset[][] = [O_BASE, O_BASE, O_BASE, O_BASE];

export const PIECE_ROTATIONS: Record<PieceType, CellOffset[][]> = {
  I: I_ROTATIONS,
  J: JLSTZ_ROTATIONS.J,
  L: JLSTZ_ROTATIONS.L,
  O: O_ROTATIONS,
  S: JLSTZ_ROTATIONS.S,
  T: JLSTZ_ROTATIONS.T,
  Z: JLSTZ_ROTATIONS.Z
};

export const getPieceCells = (type: PieceType, rotation: Rotation): CellOffset[] => {
  return PIECE_ROTATIONS[type][rotation]!;
};
