import { onCleanup, onMount, createSignal } from 'solid-js';
import Board from './Board.tsx';
import NextPiece from './NextPiece.tsx';
import HoldPiece from './HoldPiece.tsx';
import GameOverModal from './GameOverModal.tsx';
import ResultModal from './ResultModal.tsx';
import { useTetris } from '../hooks/useTetris';

interface TetrisGameProps {
  mode: 'single' | 'versus';
}

const TetrisGame = (props: TetrisGameProps) => {
  const player1 = useTetris();
  const player2 = props.mode === 'versus' ? useTetris() : null;
  
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
    const handleKeyDown = (e: KeyboardEvent) => {
      // プレイヤー1のキー操作（WASD）
      if (e.key === 'a' || e.key === 'A') player1.moveLeft();
      if (e.key === 'd' || e.key === 'D') player1.moveRight();
      if (e.key === 's' || e.key === 'S') player1.moveDown();
      if (e.key === 'w' || e.key === 'W') player1.rotate();
      if (e.key === ' ') player1.hardDrop();
      if (e.key === 'c' || e.key === 'C') player1.holdPiece();

      // 対戦モードの場合、プレイヤー2のキー操作（矢印キー）
      if (props.mode === 'versus' && player2) {
        if (e.key === 'ArrowLeft') player2.moveLeft();
        if (e.key === 'ArrowRight') player2.moveRight();
        if (e.key === 'ArrowDown') player2.moveDown();
        if (e.key === 'ArrowUp') player2.rotate();
        if (e.key === 'Enter') player2.hardDrop();
        if (e.key === 'Shift') player2.holdPiece();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

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
          isGameOver={isGameOver1()}
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
            isGameOver={isGameOver2()}
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
