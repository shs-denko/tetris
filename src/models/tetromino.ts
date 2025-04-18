export interface Tetromino {
  shape: number[][];
  color: number;
  name: string;
}

// テトロミノの定義
export const TETROMINOES: Tetromino[] = [
  // I - シアン
  {
    name: 'I',
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 0
  },
  // J - ブルー
  {
    name: 'J',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 1
  },
  // L - オレンジ
  {
    name: 'L',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 2
  },
  // O - イエロー
  {
    name: 'O',
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 3
  },
  // S - グリーン
  {
    name: 'S',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 4
  },
  // T - パープル
  {
    name: 'T',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 5
  },
  // Z - レッド
  {
    name: 'Z',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 6
  }
];

// テトロミノをランダムに生成する
export const randomTetromino = (): Tetromino => {
  const randomIndex = Math.floor(Math.random() * TETROMINOES.length);
  return { ...TETROMINOES[randomIndex] };
};

// テトロミノを時計回りに回転させる
export const rotateTetromino = (tetromino: Tetromino): Tetromino => {
  const { shape } = tetromino;
  const rows = shape.length;
  const cols = shape[0].length;
  
  // 新しい形状を作成
  const newShape = Array(cols).fill(0).map(() => Array(rows).fill(0));
  
  // 時計回りに90度回転
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      newShape[x][rows - 1 - y] = shape[y][x];
    }
  }
  
  return {
    ...tetromino,
    shape: newShape
  };
};
