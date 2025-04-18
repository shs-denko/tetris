import { createSignal } from 'solid-js';

interface GameOverModalProps {
  score: number;
  level: number;
  lines: number;
  onSaveScore: (name: string) => void;
  onRestart: () => void;
  onMenu: () => void;
}

const GameOverModal = (props: GameOverModalProps) => {
  const [playerName, setPlayerName] = createSignal('Player');
  const [scoreSaved, setScoreSaved] = createSignal(false);

  const handleSaveScore = () => {
    props.onSaveScore(playerName());
    setScoreSaved(true);
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 class="text-3xl font-bold mb-4 text-red-500">ゲームオーバー</h2>
        
        <div class="mb-6">
          <div class="grid grid-cols-2 gap-2 mb-4">
            <div class="text-gray-300">スコア:</div>
            <div class="text-right font-bold text-green-400">{props.score.toLocaleString()}</div>
            <div class="text-gray-300">レベル:</div>
            <div class="text-right font-bold">{props.level}</div>
            <div class="text-gray-300">ライン:</div>
            <div class="text-right font-bold">{props.lines}</div>
          </div>
          
          {!scoreSaved() ? (
            <div class="mb-4">
              <label class="block text-gray-300 mb-2">名前</label>
              <input
                type="text"
                value={playerName()}
                onInput={(e) => setPlayerName(e.target.value)}
                class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                maxlength="12"
              />
            </div>
          ) : (
            <div class="text-center py-2 text-green-400 mb-4">
              スコアを保存しました！
            </div>
          )}
        </div>
        
        <div class="flex gap-3">
          {!scoreSaved() && (
            <button
              onClick={handleSaveScore}
              class="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              スコア保存
            </button>
          )}
          <button
            onClick={props.onRestart}
            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            リスタート
          </button>
          <button
            onClick={props.onMenu}
            class="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            メニュー
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
