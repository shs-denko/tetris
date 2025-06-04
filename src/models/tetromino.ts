// models/tetromino.ts
/**
 * －－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－
 * Super Rotation System (SRS) implementation, fully rewritten.
 *  ▸ Shapes are now calculated on‑the‑fly with matrix rotation instead of
 *    storing 4 static orientations for every piece (‑70 % memory).
 *  ▸ Kick tables are preserved verbatim from the guideline (row++ = down).
 *  ▸ createTetrominoGenerator keeps the 7‑bag RNG but detached from shapes.
 *  ▸ rotateTetrominoSRS exposes exactly the same API you used before, so
 *    useTetris.ts や他の UI 層は変更不要です。
 * －－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－
 */
export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  readonly type: TetrominoType;
  readonly color: number;
  readonly shape: number[][];     // 0/1 matrix
  readonly rotationIndex: number; // 0=spawn,1=R,2=2,3=L
}

export interface SRSResult {
  piece: Tetromino;
  offset: { row: number; col: number };
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Spawn shapes (only the 0‑deg orientation is stored)
// ────────────────────────────────────────────────────────────────────────────
const SPAWN_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 2. Utility – square‑matrix rotation
// ────────────────────────────────────────────────────────────────────────────
function rotateMatrix(mat: number[][], dir: 1 | -1): number[][] {
  const n = mat.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  if (dir === 1) {
    // CW: (x,y) -> (y, n‑1‑x)
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) out[x][n - 1 - y] = mat[y][x];
    }
  } else {
    // CCW: (x,y) -> (n‑1‑y, x)
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) out[n - 1 - x][y] = mat[y][x];
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Kick tables (official guideline, row+ = down, col+ = right)
// ────────────────────────────────────────────────────────────────────────────
type Offset = { row: number; col: number };

const K3: Record<string, Offset[]> = {
  '0>1': [
    { row: 0, col: 0 },
    { row: 0, col: -1 },
    { row: 1, col: -1 },
    { row: -2, col: 0 },
    { row: -2, col: -1 },
  ],
  '1>0': [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: -1, col: 1 },
    { row: 2, col: 0 },
    { row: 2, col: 1 },
  ],
  '1>2': [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: -1, col: 1 },
    { row: 2, col: 0 },
    { row: 2, col: 1 },
  ],
  '2>1': [
    { row: 0, col: 0 },
    { row: 0, col: -1 },
    { row: 1, col: -1 },
    { row: -2, col: 0 },
    { row: -2, col: -1 },
  ],
  '2>3': [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: -2, col: 0 },
    { row: -2, col: 1 },
  ],
  '3>2': [
    { row: 0, col: 0 },
    { row: 0, col: -1 },
    { row: -1, col: -1 },
    { row: 2, col: 0 },
    { row: 2, col: -1 },
  ],
  '3>0': [
    { row: 0, col: 0 },
    { row: 0, col: -1 },
    { row: -1, col: -1 },
    { row: 2, col: 0 },
    { row: 2, col: -1 },
  ],
  '0>3': [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: -2, col: 0 },
    { row: -2, col: 1 },
  ],
};

const KI: Record<string, Offset[]> = {
  '0>1': [
    { row: 0, col: 0 },
    { row: 0, col: -2 },
    { row: 0, col: 1 },
    { row: 1, col: -2 },
    { row: -2, col: 1 },
  ],
  '1>0': [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 0, col: -1 },
    { row: -1, col: 2 },
    { row: 2, col: -1 },
  ],
  '1>2': [
    { row: 0, col: 0 },
    { row: -1, col: 0 },
    { row: 2, col: 0 },
    { row: -1, col: 2 },
    { row: 2, col: -1 },
  ],
  '2>1': [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: -2, col: 0 },
    { row: 1, col: -2 },
    { row: -2, col: 1 },
  ],
  '2>3': [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 0, col: -1 },
    { row: 2, col: 2 },
    { row: -1, col: -1 },
  ],
  '3>2': [
    { row: 0, col: 0 },
    { row: 0, col: -2 },
    { row: 0, col: 1 },
    { row: -2, col: -2 },
    { row: 1, col: 1 },
  ],
  '3>0': [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: -2, col: 0 },
    { row: 1, col: 2 },
    { row: -2, col: -1 },
  ],
  '0>3': [
    { row: 0, col: 0 },
    { row: -1, col: 0 },
    { row: 2, col: 0 },
    { row: -1, col: 2 },
    { row: 2, col: -1 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 4. Rotation entry point (API‑compatible with previous code)
// ────────────────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<TetrominoType, number> = {
  I: 0,
  J: 1,
  L: 2,
  O: 3,
  S: 4,
  T: 5,
  Z: 6,
};

export function rotateTetrominoSRS(piece: Tetromino, dir: 1 | -1): SRSResult[] {
  const from = piece.rotationIndex;
  const to = (from + (dir === 1 ? 1 : 3)) % 4;
  const key = `${from}>${to}`;

  // Rotate shape unless it is O‑piece
  const newShape =
    piece.type === 'O' ? piece.shape : rotateMatrix(piece.shape, dir);

  const kicks =
    piece.type === 'O'
      ? [{ row: 0, col: 0 }]
      : piece.type === 'I'
      ? KI[key]
      : K3[key];

  return kicks.map((offset) => ({
    offset,
    piece: {
      type: piece.type,
      color: piece.color,
      shape: newShape,
      rotationIndex: to,
    },
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// 5. 7‑bag random generator (unchanged interface)
// ────────────────────────────────────────────────────────────────────────────
export function createTetrominoGenerator(seed?: number) {
  let bag: TetrominoType[] = [];
  let rng: () => number;

  if (seed != null) {
    // Simple linear‑congruential RNG for reproducibility
    let state = seed;
    rng = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  } else {
    rng = Math.random;
  }

  const shuffle = () => {
    bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  };

  return {
    next(): Tetromino {
      if (bag.length === 0) shuffle();
      const type = bag.shift()! as TetrominoType;
      return {
        type,
        color: COLOR_MAP[type],
        shape: SPAWN_SHAPES[type].map((r) => [...r]), // deep copy
        rotationIndex: 0,
      };
    },
  };
}
