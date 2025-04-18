import { createSignal, createEffect } from 'solid-js';

interface PlayerResult {
  score: number;
  level: number;
  lines: number;
}

interface ResultModalProps {
  player1: PlayerResult;
  player2: PlayerResult;
  onRestart: () => void;
  onMenu: () => void;
}

const ResultModal = (props: ResultModalProps) => {
  const [winner, setWinner] = createSignal<1 | 2 | 'draw' | null>(null);
  const [showAnimation, setShowAnimation] = createSignal(false);
  
  // 勝者を判定
  createEffect(() => {
    if (props.player1.score > props.player2.score) {
      setWinner(1);
    } else if (props.player2.score > props.player1.score) {
      setWinner(2);
    } else {
      setWinner('draw');
    }
    
    // アニメーション表示
    setTimeout(() => setShowAnimation(true), 500);
  });

  // 結果テキストとスタイル
  const getResultText = () => {
    switch (winner()) {
      case 1: return { text: 'プレイヤー1の勝利！', style: 'text-blue-400' };
      case 2: return { text: 'プレイヤー2の勝利！', style: 'text-red-400' };
      case 'draw': return { text: '引き分け！', style: 'text-yellow-400' };
      default: return { text: '結果判定中...', style: 'text-gray-400' };
    }
  };

  const result = getResultText();

  return (
    <div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-xl border border-gray-700 transform transition-all duration-500">
        <h2 class={`text-4xl font-bold mb-8 text-center ${result.style} ${showAnimation() ? 'animate-pulse' : ''}`}>
          {result.text}
        </h2>
        
        <div class="grid grid-cols-2 gap-10 mb-8">
          {/* プレイヤー1 */}
          <div class={`p-4 rounded-lg ${winner() === 1 ? 'bg-blue-900 bg-opacity-30 border border-blue-700' : 'bg-gray-800'}`}>
            <h3 class="text-xl font-bold mb-2 text-blue-400">プレイヤー1</h3>
            <div class="grid grid-cols-2 gap-1">
              <div class="text-gray-300">スコア:</div>
              <div class="text-right font-bold text-green-400">{props.player1.score.toLocaleString()}</div>
              <div class="text-gray-300">レベル:</div>
              <div class="text-right font-bold">{props.player1.level}</div>
              <div class="text-gray-300">ライン:</div>
              <div class="text-right font-bold">{props.player1.lines}</div>
            </div>
          </div>
          
          {/* プレイヤー2 */}
          <div class={`p-4 rounded-lg ${winner() === 2 ? 'bg-red-900 bg-opacity-30 border border-red-700' : 'bg-gray-800'}`}>
            <h3 class="text-xl font-bold mb-2 text-red-400">プレイヤー2</h3>
            <div class="grid grid-cols-2 gap-1">
              <div class="text-gray-300">スコア:</div>
              <div class="text-right font-bold text-green-400">{props.player2.score.toLocaleString()}</div>
              <div class="text-gray-300">レベル:</div>
              <div class="text-right font-bold">{props.player2.level}</div>
              <div class="text-gray-300">ライン:</div>
              <div class="text-right font-bold">{props.player2.lines}</div>
            </div>
          </div>
        </div>
        
        <div class="flex gap-4">
          <button
            onClick={props.onRestart}
            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-md transition-colors font-bold"
          >
            もう一度プレイ
          </button>
          <button
            onClick={props.onMenu}
            class="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-md transition-colors font-bold"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
