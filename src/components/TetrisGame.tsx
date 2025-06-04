import { onCleanup, onMount, createSignal } from 'solid-js';
import Board from './Board.tsx';
import NextPiece from './NextPiece.tsx';
import HoldPiece from './HoldPiece.tsx';
import GameOverModal from './GameOverModal.tsx';
import ResultModal from './ResultModal.tsx';
import { useTetris } from '../hooks/useTetris';

import { KeyBindings } from '../utils/keyBindings';

interface TetrisGameProps {
  mode: 'single' | 'versus';
  bindings: KeyBindings;
}

const TetrisGame = (props: TetrisGameProps) => {
  // 対戦時は同じシードを使う
  const commonSeed = props.mode === 'versus' ? Math.floor(Math.random() * 1e9) : undefined;

  const player1 = useTetris(commonSeed);
  const player2 = props.mode === 'versus' ? useTetris(commonSeed) : null;

  // 対戦時、お互いにお邪魔を送り合う
  if (props.mode === 'versus' && player2) {
    player1.setOnAttack(lines => player2.addPendingGarbage(lines));
    player2.setOnAttack(lines => player1.addPendingGarbage(lines));
  }
  
  // DAS/ARR 用ステート
  const [leftHeld, setLeftHeld] = createSignal(false);
  const [rightHeld, setRightHeld] = createSignal(false);
  const [spaceHeld, setSpaceHeld] = createSignal(false);
  let leftDas: number, leftArr: number, rightDas: number, rightArr: number;

  // ゲームオーバー状態管理
  const [isGameOver1, setIsGameOver1] = createSignal(false);
  const [isGameOver2, setIsGameOver2] = createSignal(false);
  const [showResult, setShowResult] = createSignal(false);

  // スコア保存時の処理
  const saveScore = (name: string) => {
    const currentDate = new Date();
    const scoreEntry = {
      name,
      score: player1.score(),
      lines: player1.lines(),
      level: player1.level(),
      date: currentDate.toLocaleDateString()
    };
    
    // 既存のランキングを読み込む
    let rankings = [];
    const storedRankings = localStorage.getItem('tetrisRankings');
    if (storedRankings) {
      try {
        rankings = JSON.parse(storedRankings);
      } catch (e) {
        console.error('ランキングデータの読み込みに失敗しました', e);
      }
    }
    
    // 新しいスコアを追加
    rankings.push(scoreEntry);
    
    // スコア順にソート
    rankings.sort((a: { score: number; }, b: { score: number; }) => b.score - a.score);
    
    // 最大10件に制限
    if (rankings.length > 10) {
      rankings = rankings.slice(0, 10);
    }
    
    // ランキングを保存
    localStorage.setItem('tetrisRankings', JSON.stringify(rankings));
  };

  // ゲームの再開
  const restartGame = () => {
    setIsGameOver1(false);
    setIsGameOver2(false);
    setShowResult(false);
    player1.resetGame();
    
    if (props.mode === 'versus' && player2) {
      player2.resetGame();
    }
  };

  onMount(() => {
    // キー状態管理
    const handleKeyDown = (e: KeyboardEvent) => {
      // 左移動 DAS/ARR
      if (e.key === props.bindings.moveLeft && !leftHeld()) {
        setLeftHeld(true);
        player1.moveLeft();
        leftDas = window.setTimeout(() => {
          leftArr = window.setInterval(() => player1.moveLeft(), 50);
        }, 300);
      }
      // 右移動 DAS/ARR
      if (e.key === props.bindings.moveRight && !rightHeld()) {
        setRightHeld(true);
        player1.moveRight();
        rightDas = window.setTimeout(() => {
          rightArr = window.setInterval(() => player1.moveRight(), 50);
        }, 300);
      }
      // ソフトドロップ開始
      if (e.key === props.bindings.softDrop) {
        player1.setSoftDropping(true);
      }
      // 回転・ホールド・ハードドロップ
      if (e.key === props.bindings.rotate) player1.rotate();
      if (e.key === props.bindings.rotate180) player1.rotate180();
      // クリアアニメーション中はハードドロップを無効化
      if (e.key === props.bindings.hardDrop && !spaceHeld() && player1.clearingRows().length === 0) {
        player1.hardDrop();
        setSpaceHeld(true);
      }
      if (e.key === props.bindings.hold) player1.holdPiece();
      if (e.key === props.bindings.pause) player1.pauseGame();
      if (e.key === props.bindings.reset) restartGame();

      // 対戦モードの場合、プレイヤー2のキー操作（矢印キー）
      if (props.mode === 'versus' && player2) {
        if (e.key === 'ArrowLeft') player2.moveLeft();
        if (e.key === 'ArrowRight') player2.moveRight();
        if (e.key === 'ArrowDown') player2.moveDown();
        if (e.key === 'ArrowUp') player2.rotate();
        // プレイヤー2のハードドロップにも同様の制御
        if (e.key === 'Enter' && player2.clearingRows().length === 0) player2.hardDrop();
        if (e.key === 'Shift') player2.holdPiece();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === props.bindings.moveLeft) {
        setLeftHeld(false);
        clearTimeout(leftDas);
        clearInterval(leftArr);
      }
      if (e.key === props.bindings.moveRight) {
        setRightHeld(false);
        clearTimeout(rightDas);
        clearInterval(rightArr);
      }
      if (e.key === props.bindings.softDrop) {
        player1.setSoftDropping(false);
      }
      if (e.key === props.bindings.hardDrop) {
        setSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ゲーム状態の定期チェック
    const gameStateInterval = setInterval(() => {
      // プレイヤー1のゲームオーバーチェック
      if (!isGameOver1() && player1.isGameOver && player1.isGameOver()) {
        setIsGameOver1(true);
        
        // 対戦モードで両方ゲームオーバーの場合、リザルトを表示
        if (props.mode === 'versus' && isGameOver2()) {
          setShowResult(true);
        }
      }
      
      // プレイヤー2のゲームオーバーチェック (対戦モードの場合)
      if (props.mode === 'versus' && player2 && !isGameOver2() && player2.isGameOver && player2.isGameOver()) {
        setIsGameOver2(true);
        
        // 対戦モードで両方ゲームオーバーの場合、リザルトを表示
        if (isGameOver1()) {
          setShowResult(true);
        }
      }
    }, 500);
    
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(gameStateInterval);
    });
  });

  const renderPlayerStats = (score: number, level: number, lines: number) => (
    <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
      <div class="text-lg mb-2 text-blue-300">Score</div>
      <div class="text-2xl font-bold mb-3">{score}</div>
      <div class="text-lg mb-2 text-green-300">Level</div>
      <div class="text-2xl font-bold mb-3">{level}</div>
      <div class="text-lg mb-2 text-purple-300">Lines</div>
      <div class="text-2xl font-bold">{lines}</div>
    </div>
  );

  return (
    <div class="flex justify-center gap-8">
      {/* プレイヤー1のUI */}
      <div class="flex gap-4 flex-shrink-0">
        <div class="flex flex-col gap-4">
          <HoldPiece piece={player1.heldPiece()} />
          {renderPlayerStats(player1.score(), player1.level(), player1.lines())}
        </div>
        
        <Board 
          board={player1.board()} 
          currentPiece={player1.currentPiece()} 
          currentPosition={player1.currentPosition()}
          ghostPosition={player1.ghostPosition()}
          isGameOver={isGameOver1()}
          clearingRows={player1.clearingRows()}
        />
        
        <NextPiece pieces={player1.nextPieces()} />
      </div>
      
      {/* 対戦モードの場合、プレイヤー2のUI */}
      {props.mode === 'versus' && player2 && (
        <div class="flex gap-4 flex-shrink-0">
          <NextPiece pieces={player2.nextPieces()} />
          
          <Board 
            board={player2.board()} 
            currentPiece={player2.currentPiece()} 
            currentPosition={player2.currentPosition()}
            ghostPosition={player2.ghostPosition()}
            isGameOver={isGameOver2()}
            clearingRows={player2.clearingRows()}
          />
          
          <div class="flex flex-col gap-4">
            <HoldPiece piece={player2.heldPiece()} />
            {renderPlayerStats(player2.score(), player2.level(), player2.lines())}
          </div>
        </div>
      )}
      
      {/* シングルモードのゲームオーバーモーダル */}
      {props.mode === 'single' && isGameOver1() && (
        <GameOverModal
          score={player1.score()}
          level={player1.level()}
          lines={player1.lines()}
          onSaveScore={saveScore}
          onRestart={restartGame}
          onMenu={() => window.location.reload()}
        />
      )}
      
      {/* 対戦モードのリザルト画面 */}
      {props.mode === 'versus' && showResult() && player2 && (
        <ResultModal
          player1={{
            score: player1.score(),
            level: player1.level(),
            lines: player1.lines()
          }}
          player2={{
            score: player2.score(),
            level: player2.level(),
            lines: player2.lines()
          }}
          onRestart={restartGame}
          onMenu={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default TetrisGame;
