import { createSignal, createEffect, onCleanup } from 'solid-js';
import { Tetromino, randomTetromino, rotateTetromino } from '../models/tetromino';

export interface Position {
  row: number;
  col: number;
}

export const useTetris = () => {
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const INITIAL_SPEED = 1000; // ミリ秒
  const MAX_NEXT_PIECES = 3;

  // ボードの状態
  const [board, setBoard] = createSignal<(number | null)[][]>(
    Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(null))
  );

  // ゲームの状態
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [lines, setLines] = createSignal(0);
  const [gameOver, setGameOver] = createSignal(false);
  const [isPaused, setIsPaused] = createSignal(false);

  // 現在のピースと位置
  const [currentPiece, setCurrentPiece] = createSignal<Tetromino | null>(null);
  const [currentPosition, setCurrentPosition] = createSignal<Position | null>(null);
  
  // 次のピースとホールドピース
  const [nextPieces, setNextPieces] = createSignal<Tetromino[]>([]);
  const [heldPiece, setHoldPiece] = createSignal<Tetromino | null>(null);
  const [canHold, setCanHold] = createSignal(true);

  // ゲームを初期化する
  const initGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(null)));
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setHoldPiece(null);
    setCanHold(true);
    
    // 初期ピースを設定
    setNextPieces(Array(MAX_NEXT_PIECES).fill(0).map(() => randomTetromino()));
    getNewPiece();
  };

  // 新しいピースを取得する
  const getNewPiece = () => {
    // 次のピースをセット
    const next = nextPieces()[0];
    setCurrentPiece(next);
    
    // 開始位置を設定
    const startPosition = {
      row: 0,
      col: Math.floor((BOARD_WIDTH - next.shape[0].length) / 2)
    };
    setCurrentPosition(startPosition);
    
    // 次のピースを更新
    setNextPieces(prev => {
      const newPieces = [...prev.slice(1), randomTetromino()];
      return newPieces;
    });
    
    // ピースを置けるかチェック
    if (!isValidPosition(startPosition, next.shape)) {
      setGameOver(true);
    }
    
    // ホールドをリセット
    setCanHold(true);
  };

  // 位置が有効かチェックする
  const isValidPosition = (position: Position, shape: number[][]): boolean => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardRow = position.row + y;
          const boardCol = position.col + x;
          
          // ボードの範囲外か、すでにブロックが存在する場合は無効
          if (
            boardRow < 0 || 
            boardRow >= BOARD_HEIGHT ||
            boardCol < 0 || 
            boardCol >= BOARD_WIDTH ||
            board()[boardRow][boardCol] !== null
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // ピースを移動する
  const movePiece = (rowOffset: number, colOffset: number): boolean => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused()) return false;
    
    const newPosition = { row: pos.row + rowOffset, col: pos.col + colOffset };
    
    if (isValidPosition(newPosition, cp.shape)) {
      setCurrentPosition(newPosition);
      return true;
    }
    
    // 下に移動できない場合、ピースを固定する
    if (rowOffset > 0) lockPiece();
    
    return false;
  };

  // 左に移動
  const moveLeft = () => movePiece(0, -1);
  
  // 右に移動
  const moveRight = () => movePiece(0, 1);
  
  // 下に移動
  const moveDown = () => movePiece(1, 0);

  // ピースを回転する
  const rotate = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused()) return;
    
    const rotatedPiece = rotateTetromino(cp);
    
    // 通常の回転
    if (isValidPosition(pos, rotatedPiece.shape)) {
      setCurrentPiece(rotatedPiece);
      return;
    }
    
    // 壁蹴り（回転後に壁にぶつかる場合は位置を調整）
    const kicks = [
      { row: 0, col: -1 }, // 左へ1
      { row: 0, col: 1 },  // 右へ1
      { row: 0, col: -2 }, // 左へ2
      { row: 0, col: 2 },  // 右へ2
      { row: -1, col: 0 }, // 上へ1（Tスピン用）
    ];
    
    for (const kick of kicks) {
      const newPosition = {
        row: pos.row + kick.row,
        col: pos.col + kick.col
      };
      
      if (isValidPosition(newPosition, rotatedPiece.shape)) {
        setCurrentPiece(rotatedPiece);
        setCurrentPosition(newPosition);
        return;
      }
    }
  };

  // ハードドロップ（一番下まで一気に落とす）
  const hardDrop = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused()) return;
    
    let newRow = pos.row;
    while (isValidPosition({ row: newRow + 1, col: pos.col }, cp.shape)) {
      newRow++;
    }
    
    setCurrentPosition({ row: newRow, col: pos.col });
    lockPiece();
  };

  // ピースをホールドする
  const holdPiece = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused() || !canHold()) return;

    const currentHold = heldPiece();
    setHoldPiece(cp);

    if (currentHold) {
      setCurrentPiece(currentHold);
      const startPosition = {
        row: 0,
        col: Math.floor((BOARD_WIDTH - currentHold.shape[0].length) / 2)
      };
      setCurrentPosition(startPosition);
    } else {
      getNewPiece();
    }
    setCanHold(false);
  };

  // ピースを固定して新しいピースを取得
  const lockPiece = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos) return;
    
    const newBoard = [...board()];
    cp.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardRow = pos.row + y;
          const boardCol = pos.col + x;
          if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
            newBoard[boardRow][boardCol] = cp.color;
          }
        }
      });
    });
    
    setBoard(newBoard);
    clearLines();
    getNewPiece();
  };

  // 完成したラインを消去する
  const clearLines = () => {
    const newBoard = [...board()];
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        // ラインが揃っていたら削除
        newBoard.splice(y, 1);
        // 上に新しい空のラインを追加
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        y++; // 同じ行を再チェック
      }
    }
    
    if (linesCleared > 0) {
      setBoard(newBoard);
      updateScore(linesCleared);
    }
  };

  // スコアを更新する
  const updateScore = (linesCleared: number) => {
    const linePoints = [40, 100, 300, 1200]; // 1, 2, 3, 4ライン消去時のポイント
    const pointsEarned = linePoints[linesCleared - 1] * level();
    
    setScore(prev => prev + pointsEarned);
    setLines(prev => {
      const newLines = prev + linesCleared;
      // 10ラインごとにレベルアップ
      if (Math.floor(newLines / 10) > Math.floor(prev / 10)) {
        setLevel(l => l + 1);
      }
      return newLines;
    });
  };

  // ゲームサイクルを制御するタイマー
  createEffect(() => {
    if (gameOver() || isPaused()) return;
    
    const speed = INITIAL_SPEED / level();
    const intervalId = setInterval(() => {
      moveDown();
    }, speed);
    
    onCleanup(() => clearInterval(intervalId));
  });

  // isGameOver 関数を追加
  const isGameOver = () => {
    return gameOver(); // gameOver状態を返す
  };

  // resetGame 関数を追加
  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    initGame();
  };

  // ゲームの初期化
  initGame();

  return {
    board,
    score,
    level,
    lines,
    gameOver,
    isPaused,
    currentPiece,
    currentPosition,
    nextPieces,
    heldPiece,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    holdPiece,
    pauseGame: () => setIsPaused(!isPaused()),
    resetGame,
    isGameOver
  };
};
