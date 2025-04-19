export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  type: TetrominoType;
  color: number;
  shape: number[][];
  rotationIndex: number; // 0=spawn, 1=R, 2=2, 3=L
}

// 各テトロミノ4向きデータ
const shapes: Record<TetrominoType, number[][][]> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
  O: [
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
};

// SRSキックデータ (from>to)
const kicksJLSTZ: Record<string, { row: number; col: number }[]> = {
  '0>1': [{ row: 0, col: 0 }, { row: 0, col: -1 }, { row: 1, col: -1 }, { row: 0, col: 2 }, { row: 1, col: 2 }],
  '1>0': [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: -1, col: 1 }, { row: 0, col: -2 }, { row: -1, col: -2 }],
  '1>2': [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: -1, col: 1 }, { row: 0, col: -2 }, { row: -1, col: -2 }],
  '2>1': [{ row: 0, col: 0 }, { row: 0, col: -1 }, { row: 1, col: -1 }, { row: 0, col: 2 }, { row: 1, col: 2 }],
  '2>3': [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 0, col: -1 }, { row: 1, col: -1 }],
  '3>2': [{ row: 0, col: 0 }, { row: 0, col: -2 }, { row: -1, col: -2 }, { row: 0, col: 1 }, { row: -1, col: 1 }],
  '3>0': [{ row: 0, col: 0 }, { row: 0, col: -2 }, { row: -1, col: -2 }, { row: 0, col: 1 }, { row: -1, col: 1 }],
  '0>3': [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 0, col: -1 }, { row: 1, col: -1 }],
};
const kicksI: Record<string, { row: number; col: number }[]> = {
  '0>1': [{ row: 0, col: 0 }, { row: 0, col: -2 }, { row: 0, col: 1 }, { row: 1, col: -2 }, { row: -2, col: 1 }],
  '1>0': [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 0, col: -1 }, { row: -1, col: 2 }, { row: 2, col: -1 }],
  '1>2': [{ row: 0, col: 0 }, { row: -1, col: 0 }, { row: 2, col: 0 }, { row: -1, col: 2 }, { row: 2, col: -1 }],
  '2>1': [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: -2, col: 0 }, { row: 1, col: -2 }, { row: -2, col: 1 }],
  '2>3': [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 0, col: -1 }, { row: 2, col: 2 }, { row: -1, col: -1 }],
  '3>2': [{ row: 0, col: 0 }, { row: 0, col: -2 }, { row: 0, col: 1 }, { row: -2, col: -2 }, { row: 1, col: 1 }],
  '3>0': [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: -2, col: 0 }, { row: 1, col: 2 }, { row: -2, col: -1 }],
  '0>3': [{ row: 0, col: 0 }, { row: -1, col: 0 }, { row: 2, col: 0 }, { row: -1, col: 2 }, { row: 2, col: -1 }],
};

// タイプ→色インデックス（Tailwind用）
const colorMap: Record<TetrominoType, number> = {
  I: 0, J: 1, L: 2, O: 3, S: 4, T: 5, Z: 6
};

// 7種1巡用 bag
let bag: TetrominoType[] = [];

function shuffleBag() {
  bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
}

// 型からTetrominoオブジェクト生成
function createByType(type: TetrominoType): Tetromino {
  return { type, color: colorMap[type], shape: shapes[type][0], rotationIndex: 0 };
}

// 7‑bagは既存shuffleBag/bagから引く想定
export function randomTetromino(): Tetromino {
  if (!bag.length) shuffleBag();
  return createByType(bag.shift()!);
}

// シード付き bag/7-bag 生成器
export function createTetrominoGenerator(seed?: number) {
  let bag: TetrominoType[] = [];
  let rng: () => number;
  if (seed != null) {
    let state = seed;
    rng = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  } else {
    rng = Math.random;
  }
  function shuffle() {
    bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return {
    next(): Tetromino {
      if (bag.length === 0) shuffle();
      const type = bag.shift()!;
      return createByType(type);
    }
  };
}

// SRS回転を試行する関数
export function rotateTetrominoSRS(
  piece: Tetromino,
  dir: 1 | -1
): { piece: Tetromino; offset: { row: number; col: number } }[] {
  const from = piece.rotationIndex;
  const to = (from + (dir > 0 ? 1 : 3)) % 4;
  const key = `${from}>${to}`;
  const newShape = shapes[piece.type][to];
  const kicks = piece.type === 'I'
    ? kicksI[key]
    : piece.type === 'O'
      ? [{ row: 0, col: 0 }]
      : kicksJLSTZ[key];
  return kicks.map(k => ({
    piece: { ...piece, shape: newShape, rotationIndex: to },
    offset: k
  }));
}
