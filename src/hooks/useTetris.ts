import { createSignal, createEffect, onCleanup } from 'solid-js';
import { Tetromino, rotateTetrominoSRS, rotateTetrominoSRS180, rotateTetrominoSRSX180, createTetrominoGenerator } from '../models/tetromino';

export interface Position {
  row: number;
  col: number;
}

export const useTetris = (seed?: number, onAttackInitial?: (lines: number) => void) => {
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const INITIAL_SPEED = 1000; // ミリ秒
  const MAX_NEXT_PIECES = 3;
  const CLEAR_ANIMATION_DURATION = 300; // ミリ秒

  // ソフトドロップ判定
  const [isSoftDropping, setSoftDropping] = createSignal(false);
  
  // 拡張ロックダウン用変数
  const LOCK_DELAY = 500;       // 0.5秒
  let lockTimeout: number | undefined = undefined;
  let lockMovesLeft = 15;
  let isLockActive = false;
  // 回転連打防止のためのフラグ
  let isRotating = false;
  let lastRotationTime = 0;

  // ボードの状態
  const [board, setBoard] = createSignal<(number | null)[][]>(
    Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [clearingRows, setClearingRows] = createSignal<number[]>([]);

  // ゲームの状態
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [lines, setLines] = createSignal(0);
  const [gameOver, setGameOver] = createSignal(false);
  const [isPaused, setIsPaused] = createSignal(false);

  // 現在のピースと位置
  const [currentPiece, setCurrentPiece] = createSignal<Tetromino | null>(null);
  const [currentPosition, setCurrentPosition] = createSignal<Position | null>(null);
  // ゴーストの位置を保持するステート
  const [ghostPosition, setGhostPosition] = createSignal<Position | null>(null);
  
  // 次のピースとホールドピース
  const [nextPieces, setNextPieces] = createSignal<Tetromino[]>([]);
  const [heldPiece, setHoldPiece] = createSignal<Tetromino | null>(null);
  const [canHold, setCanHold] = createSignal(true);

  const generator = createTetrominoGenerator(seed);

  // 攻撃コールバック
  let onAttack = onAttackInitial || (() => {});
  
  // 遅延用お邪魔キュー
  let pendingGarbage = 0;

  // お邪魔受信（即時適用）
  const receiveGarbage = (lines: number) => {
    if (lines <= 0) return;
    const current = board().slice();
    const filtered = current.slice(lines);
    const garbageRows = Array(lines)
      .fill(null)
      .map(() => {
        const hole = Math.floor(Math.random() * BOARD_WIDTH);
        return Array(BOARD_WIDTH)
          .fill(8)
          .map((_, i) => (i === hole ? null : 8));
      });
    setBoard([...filtered, ...garbageRows]);

    // 上に押し出された分だけミノを移動させる
    const cp = currentPiece();
    const pos = currentPosition();
    if (cp && pos) {
      let newRow = pos.row - lines;
      const limit = -cp.shape.length - 2; // より寛容な制限（さらに上まで許可）
      
      // 有効位置になるまで上へ移動
      while (!isValidPosition({ row: newRow, col: pos.col }, cp.shape)) {
        newRow--;
        // 極端に上まで行った場合のみゲームオーバー
        if (newRow < limit) {
          setGameOver(true);
          return;
        }
      }
      setCurrentPosition({ row: newRow, col: pos.col });
      // ロックタイマー・ロック状態を必ず解除（ガベージ直後は絶対ロックしない）
      if (lockTimeout) {
        clearTimeout(lockTimeout);
        lockTimeout = undefined;
      }
      isLockActive = false;
      lockMovesLeft = 15;
      updateGhostPosition();
    }
  };

  // お邪魔をキューに追加
  const addPendingGarbage = (lines: number) => {
    pendingGarbage += lines;
  };

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
    setNextPieces(Array(MAX_NEXT_PIECES).fill(0).map(() => generator.next()));
    getNewPiece();

    // ロックダウンに関する変数も確実にリセット
    if (lockTimeout) {
      clearTimeout(lockTimeout);
      lockTimeout = undefined;
    }
    isLockActive = false;
    lockMovesLeft = 15;
    isRotating = false;
  };

  // スポーン重複防止フラグ
  let spawnLocked = false;
  // 追加：ロック多重実行防止用フラグ
  let hasLockedPiece = false;
  // 追加：ハードドロップ連打防止フラグ
  let hardDropped = false;

  // 新しいピースを取得する
  const getNewPiece = () => {
    if (spawnLocked) return;
    spawnLocked = true;
    // リセット：ロック済みフラグ＆ハードドロップ連打フラグ
    hasLockedPiece = false;
    hardDropped = false;
    // 念のためロック状態も完全に初期化（持ち越し防止）
    if (lockTimeout) {
      clearTimeout(lockTimeout);
      lockTimeout = undefined;
    }
    isLockActive = false;
    lockMovesLeft = 15;

    // 次のピースをセット
    const next = nextPieces()[0];
    setCurrentPiece(next);
    
    // 開始位置を設定
    const startPosition = {
      row: -2,
      col: Math.floor((BOARD_WIDTH - next.shape[0].length) / 2)
    };
  setCurrentPosition(startPosition);
    
    // pendingGarbage があれば一括適用
    // このスポーンターンでガベージを適用したかを記録（スポーン判定の二重実行を避ける）
    let appliedGarbageThisSpawn = false;
    if (pendingGarbage > 0) {
      receiveGarbage(pendingGarbage);
      pendingGarbage = 0;
      appliedGarbageThisSpawn = true;
    }

    // 次のピースを更新
    setNextPieces((prev: Tetromino[]) => [...prev.slice(1), generator.next()]);
    
    // ピースを置けるかチェック
    // ガベージを適用した場合は receiveGarbage 内でゲームオーバー判定が行われるため、ここでは判定しない
    if (!appliedGarbageThisSpawn) {
      // 新しいピースが盤面内（row >= 0）に入る部分で衝突がある場合のみゲームオーバー
      // 完全に上部にある場合(-2の位置)では判定しない
      let hasCollisionInVisibleArea = false;
      for (let y = 0; y < next.shape.length; y++) {
        for (let x = 0; x < next.shape[y].length; x++) {
          if (next.shape[y][x]) {
            const boardRow = startPosition.row + y;
            const boardCol = startPosition.col + x;
            if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
              if (board()[boardRow][boardCol] !== null) {
                hasCollisionInVisibleArea = true;
                break;
              }
            }
          }
        }
        if (hasCollisionInVisibleArea) break;
      }
      if (hasCollisionInVisibleArea) {
        setGameOver(true);
      }
    }
    
    // ホールドをリセット
    setCanHold(true);
    
    // ゴースト位置を更新
    updateGhostPosition();

    spawnLocked = false;
  };

  // 位置が有効かチェックする
  const isValidPosition = (position: Position, shape: number[][]): boolean => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardRow = position.row + y;
          const boardCol = position.col + x;
          
          // 横方向が範囲外なら不可
          if (boardCol < 0 || boardCol >= BOARD_WIDTH) return false;
          // 下方向（画面外下部）は不可
          if (boardRow >= BOARD_HEIGHT) return false;
          // 上方向（row<0）の場合はボード外として許容
          // 実際にボード上(row>=0)のセルにブロックがある場合のみ不可
          if (boardRow >= 0 && board()[boardRow][boardCol] !== null) return false;
        }
      }
    }
    return true;
  };

  // ゴーストの位置を計算して更新
  const updateGhostPosition = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos) {
      setGhostPosition(null);
      return;
    }
    
    let ghostRow = pos.row;
    // 下に移動できる限り移動
    while (isValidPosition({ row: ghostRow + 1, col: pos.col }, cp.shape)) {
      ghostRow++;
    }
    
    setGhostPosition({ row: ghostRow, col: pos.col });
  };

  // ピースを移動する
  const movePiece = (rowOffset: number, colOffset: number): boolean => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused()) return false;
    
    // 着地中のロックムーブ上限
    const below = { row: pos.row + 1, col: pos.col };
  if (rowOffset === 0 && isLockActive && pos.row >= 0 && isValidPosition(below, cp.shape) === false) {
      // 左右移動 or 回転時：カウント減らし、猶予をリセット
      lockMovesLeft--;
      clearTimeout(lockTimeout);
      if (lockMovesLeft <= 0) {
        lockPiece();
        return false;
      }
      // 猶予をリスタート（ホバーしないように再度ロックタイマーを掛け直す）
      lockTimeout = window.setTimeout(() => {
        if (!gameOver()) {
          lockPiece();
          isLockActive = false;
        }
      }, LOCK_DELAY);
    }
    
    const newPosition = { row: pos.row + rowOffset, col: pos.col + colOffset };
    
    if (isValidPosition(newPosition, cp.shape)) {
      // 移動成功 → ロックタイマー解除＆再初期化
      if (isLockActive) {
        clearTimeout(lockTimeout);
        lockTimeout = undefined!;
      }
      isLockActive = false;
      lockMovesLeft = 15;
      setCurrentPosition(newPosition);
      
      // ゴースト位置を更新
      updateGhostPosition();
      return true;
    }
    
  // 下移動失敗時 → ロックダウン開始（盤面に出ている時のみ）。
  // 上部（row < 0）ではロックを開始しないことで、何もしていないのに突然ゲームオーバーになる事象を防ぐ。
  if (rowOffset > 0 && !isLockActive && pos.row >= 0) {
      isLockActive = true;
      lockMovesLeft = 15;
      lockTimeout = window.setTimeout(() => {
        lockPiece();
        isLockActive = false;
      }, LOCK_DELAY);
    }
    
    return false;
  };

  // 左に移動
  const moveLeft = () => movePiece(0, -1);
  
  // 右に移動
  const moveRight = () => movePiece(0, 1);
  
  // 下に移動（ロックダウン処理は movePiece に任せる）
  const moveDown = () => {
    movePiece(1, 0);
  };

  // ピースを回転する
  const rotate = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused()) return;

    const now = Date.now();
    if (isRotating || now - lastRotationTime < 50) return;

    try {
      isRotating = true;
      lastRotationTime = now;

      const attempts = rotateTetrominoSRS(cp, 1);
      for (const { piece: newPiece, offset } of attempts) {
        const np = { row: pos.row + offset.row, col: pos.col + offset.col };
        if (isValidPosition(np, newPiece.shape)) {
          setCurrentPiece(newPiece);
          setCurrentPosition(np);
          updateGhostPosition();

          // 追加：回転後に下に動けなければロックダウン開始（ただし上部では開始しない）
          const belowPos = { row: np.row + 1, col: np.col };
          if (!isValidPosition(belowPos, newPiece.shape) && !isLockActive && np.row >= 0) {
            isLockActive = true;
            lockMovesLeft = 15;
            lockTimeout = window.setTimeout(() => {
              lockPiece();
              isLockActive = false;
            }, LOCK_DELAY);
          }

      // 既存のロックタイマーリセット処理（盤面に出ている場合のみ）
    if (isLockActive && lockTimeout && np.row >= 0) {
            clearTimeout(lockTimeout);
            lockTimeout = window.setTimeout(() => {
        if (!gameOver()) { lockPiece(); isLockActive = false; }
            }, LOCK_DELAY);
          }
          return;
        }
      }
      // 全試行失敗時もゴースト更新
      updateGhostPosition();
    } finally {
      setTimeout(() => { isRotating = false; }, 50);
    }
  };

  const rotateLeft = () => {
    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos || gameOver() || isPaused()) return;

    const now = Date.now();
    if (isRotating || now - lastRotationTime < 50) return;

    try {
      isRotating = true;
      lastRotationTime = now;

      const attempts = rotateTetrominoSRS(cp, -1);
      for (const { piece: newPiece, offset } of attempts) {
        const np = { row: pos.row + offset.row, col: pos.col + offset.col };
        if (isValidPosition(np, newPiece.shape)) {
          setCurrentPiece(newPiece);
          setCurrentPosition(np);
          updateGhostPosition();

          const belowPos = { row: np.row + 1, col: np.col };
          if (!isValidPosition(belowPos, newPiece.shape) && !isLockActive && np.row >= 0) {
            isLockActive = true;
            lockMovesLeft = 15;
            lockTimeout = window.setTimeout(() => {
              lockPiece();
              isLockActive = false;
            }, LOCK_DELAY);
          }

          if (isLockActive && lockTimeout && np.row >= 0) {
            clearTimeout(lockTimeout);
            lockTimeout = window.setTimeout(() => {
              if (!gameOver()) { lockPiece(); isLockActive = false; }
            }, LOCK_DELAY);
          }
          return;
        }
      }
      updateGhostPosition();
    } finally {
      setTimeout(() => { isRotating = false; }, 50);
    }
  };
const rotate180 = () => {
  const cp = currentPiece();
  const pos = currentPosition();
  if (!cp || !pos || gameOver() || isPaused()) return;

  const now = Date.now();
  // 連打／並行回転の抑制
  if (isRotating || now - lastRotationTime < 50) return;

  try {
    isRotating = true;
    lastRotationTime = now;

    // ① X-180 キックと SRS 180 キックの両方を試す
    const attempts = [
      ...rotateTetrominoSRSX180(cp),
      ...rotateTetrominoSRS180(cp),
    ];

    for (const { piece: newPiece, offset } of attempts) {
      const np = { row: pos.row + offset.row, col: pos.col + offset.col };
      if (!isValidPosition(np, newPiece.shape)) continue;

      // ここで回転を確定
      setCurrentPiece(newPiece);
      setCurrentPosition(np);
      updateGhostPosition();

      // ② 回転後に着地している場合はロックダウン開始
      const belowPos = { row: np.row + 1, col: np.col };
  if (!isValidPosition(belowPos, newPiece.shape) && !isLockActive && np.row >= 0) {
        isLockActive = true;
        lockMovesLeft = 15;
        lockTimeout = window.setTimeout(() => {
          lockPiece();
          isLockActive = false;
        }, LOCK_DELAY);
      }

      // 既存のロックタイマーが動いていればリセット
  if (isLockActive && lockTimeout && np.row >= 0) {
        clearTimeout(lockTimeout);
        lockTimeout = window.setTimeout(() => {
          if (!gameOver()) {
            lockPiece();
            isLockActive = false;
          }
        }, LOCK_DELAY);
      }
      return; // 成功したら抜ける
    }

    // どのキックも失敗した場合でもゴーストを更新
    updateGhostPosition();
  } finally {
    // デバウンス解除
    setTimeout(() => (isRotating = false), 50);
  }
};


  // ハードドロップ（一番下まで一気に落とす）
  const hardDrop = () => {
    // 連打防止
    if (hardDropped) return;
    hardDropped = true;

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
        row: -2,
        col: Math.floor((BOARD_WIDTH - currentHold.shape[0].length) / 2)
      };
      setCurrentPosition(startPosition);
      
      // ホールド後の衝突チェック - 盤面内で衝突がある場合のみゲームオーバー
      let hasCollisionInVisibleArea = false;
      for (let y = 0; y < currentHold.shape.length; y++) {
        for (let x = 0; x < currentHold.shape[y].length; x++) {
          if (currentHold.shape[y][x]) {
            const boardRow = startPosition.row + y;
            const boardCol = startPosition.col + x;
            if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
              if (board()[boardRow][boardCol] !== null) {
                hasCollisionInVisibleArea = true;
                break;
              }
            }
          }
        }
        if (hasCollisionInVisibleArea) break;
      }
      if (hasCollisionInVisibleArea) {
        setGameOver(true);
        return;
      }
    } else {
      getNewPiece();
    }
    setCanHold(false);
    
    // ゴースト位置を更新
    updateGhostPosition();
  };

  // ピースを固定して新しいピースを取得
  const lockPiece = () => {
    // 多重ロック防止とゲームオーバー状態でのロック防止
    if (hasLockedPiece || gameOver()) return;
    hasLockedPiece = true;

    if (lockTimeout) {
      clearTimeout(lockTimeout);
      lockTimeout = undefined;
    }
    isLockActive = false;
    lockMovesLeft = 15;

    const cp = currentPiece();
    const pos = currentPosition();
    if (!cp || !pos) return;

    // トップアウト判定:
    // ピースの一部でも盤面の上（row < 0）にある状態でロックされた場合のみゲームオーバー。
    // row 0（最上段）に触れてロックしてもゲーム継続（従来の突然死の原因を修正）。
    let hasTopOut = false;
    for (let y = 0; y < cp.shape.length; y++) {
      for (let x = 0; x < cp.shape[y].length; x++) {
        if (cp.shape[y][x]) {
          const boardRow = pos.row + y;
          // 盤面の上（row < 0）にブロックが存在するままロックされる場合はゲームオーバー
          if (boardRow < 0) { hasTopOut = true; break; }
        }
      }
      if (hasTopOut) break;
    }
    if (hasTopOut) {
      setGameOver(true);
      return;
    }

    const newBoard = [...board()];
    cp.shape.forEach((row: number[], y: number) => {
      row.forEach((cell: number, x: number) => {
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
  };

  // 完成したラインを消去する
  const clearLines = () => {
    const rowsToClear: number[] = [];
    board().forEach((row: (number | null)[], y: number) => {
      if (row.every(cell => cell !== null)) rowsToClear.push(y);
    });
    
    // 行クリア処理中フラグ
    if (rowsToClear.length === 0) {
      // ライン消去なしなら即座に次のピース
      if (!gameOver()) {
        getNewPiece();
      }
      return;
    }
    
    // クリア中の行をセット（一度だけ）
    setClearingRows(rowsToClear);
    
    setTimeout(() => {
      try {
        // 完成した行を除外し、新しい空行を上部に追加
        const newBoardFiltered = board().filter((_: (number | null)[], y: number) => !rowsToClear.includes(y));
        const emptyRows = Array(rowsToClear.length)
          .fill(null)
          .map(() => Array(BOARD_WIDTH).fill(null));
        
        setBoard([...emptyRows, ...newBoardFiltered]);
        
        // クリア行をリセット（一度だけ）
        setClearingRows([]);
        
        updateScore(rowsToClear.length);
        
        // 攻撃量計算
        const sent = rowsToClear.length === 2 ? 1
                   : rowsToClear.length === 3 ? 2
                   : rowsToClear.length === 4 ? 4 : 0;
        onAttack(sent);
        
        // 行削除後に次のピース取得（確実に1回だけ呼ぶ）
        if (!gameOver()) {
          getNewPiece();
        }
      } catch (e) {
        console.error('Line clearing error:', e);
        // エラー時にもピースを出す
        if (!gameOver()) {
          getNewPiece();
        }
      }
    }, CLEAR_ANIMATION_DURATION);
  };

  // スコアを更新する
  const updateScore = (linesCleared: number) => {
    const linePoints = [40, 100, 300, 1200]; // 1, 2, 3, 4ライン消去時のポイント
    const pointsEarned = linePoints[linesCleared - 1] * level();
    
    setScore((prev: number) => prev + pointsEarned);
    setLines((prev: number) => {
      const newLines = prev + linesCleared;
      // 10ラインごとにレベルアップ
      if (Math.floor(newLines / 10) > Math.floor(prev / 10)) {
        setLevel((l: number) => l + 1);
      }
      return newLines;
    });
  };

  // ゲームサイクルを制御するタイマー
  createEffect(() => {
    if (gameOver() || isPaused()) return;
    
    // ソフトドロップ中は×20速
    const speed = INITIAL_SPEED / level() / (isSoftDropping() ? 20 : 1);
    const intervalId = setInterval(() => {
      // ゲームオーバー状態やクリア中は自動落下を停止
      if (gameOver() || isPaused() || clearingRows().length > 0) return;
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

  // 外部から攻撃コールバックを差し替え可能に
  const setOnAttack = (cb: (lines: number) => void) => {
    onAttack = cb;
  };

  // ゲームの初期化
  initGame();

  return {
    board,
    score,
    level,
    lines,
    isPaused,
    currentPiece,
    currentPosition,
    ghostPosition,
    nextPieces,
    heldPiece,
    moveLeft,
    moveRight,
    moveDown,
    rotateLeft,
    rotate,
    rotate180,
    hardDrop,
    holdPiece,
    pauseGame: () => setIsPaused(!isPaused()),
    resetGame,
    isGameOver,
    setSoftDropping,
    clearingRows,
    receiveGarbage,
    addPendingGarbage,
    setOnAttack,
  };
};
