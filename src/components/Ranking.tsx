import { createSignal, onMount } from 'solid-js';

export interface RankingEntry {
  name: string;
  score: number;
  lines: number;
  level: number;
  date: string;
}

interface RankingProps {
  onBack: () => void;
}

const Ranking = (props: RankingProps) => {
  const [rankings, setRankings] = createSignal<RankingEntry[]>([]);
  const [isLoaded, setIsLoaded] = createSignal(false);

  onMount(() => {
    // ローカルストレージからランキングを取得
    const storedRankings = localStorage.getItem('tetrisRankings');
    if (storedRankings) {
      try {
        setRankings(JSON.parse(storedRankings));
      } catch (e) {
        console.error('ランキングデータの読み込みに失敗しました', e);
      }
    }
    
    // アニメーション用に少し遅延させる
    setTimeout(() => setIsLoaded(true), 100);
  });

  // ランキングをクリアする関数
  const clearRankings = () => {
    if (confirm('ランキングデータをリセットしてもよろしいですか？')) {
      localStorage.removeItem('tetrisRankings');
      setRankings([]);
    }
  };

  return (
    <div class={`bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl max-w-3xl w-full mx-auto border border-purple-900 transition-all duration-500 ${isLoaded() ? 'opacity-100 transform-none' : 'opacity-0 scale-95'}`}>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">ランキング</h2>
        <div class="flex gap-2">
          {rankings().length > 0 && (
            <button 
              class="bg-red-800 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-1"
              onClick={clearRankings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              クリア
            </button>
          )}
          <button 
            class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-1"
            onClick={props.onBack}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            戻る
          </button>
        </div>
      </div>

      {rankings().length > 0 ? (
        <div class="overflow-x-auto bg-gray-850 bg-opacity-50 rounded-lg shadow-inner border border-gray-700">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700 bg-gray-800 bg-opacity-70">
                <th class="py-3 px-4 text-left text-purple-300">順位</th>
                <th class="py-3 px-4 text-left text-purple-300">名前</th>
                <th class="py-3 px-4 text-right text-purple-300">スコア</th>
                <th class="py-3 px-4 text-right text-purple-300">レベル</th>
                <th class="py-3 px-4 text-right text-purple-300">ライン</th>
                <th class="py-3 px-4 text-right text-purple-300">日付</th>
              </tr>
            </thead>
            <tbody>
              {rankings()
                .sort((a, b) => b.score - a.score)
                .map((entry, index) => (
                  <tr class={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${index < 3 ? 'bg-gray-800 bg-opacity-40' : ''}`}>
                    <td class={`py-3 px-4 font-bold ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-gray-300' : 
                      index === 2 ? 'text-amber-700' : 'text-gray-400'
                    }`}>
                      {index === 0 && <span class="mr-1">🏆</span>}
                      {index === 1 && <span class="mr-1">🥈</span>}
                      {index === 2 && <span class="mr-1">🥉</span>}
                      {index + 1}
                    </td>
                    <td class="py-3 px-4">{entry.name}</td>
                    <td class="py-3 px-4 text-right font-mono text-green-400">{entry.score.toLocaleString()}</td>
                    <td class="py-3 px-4 text-right">{entry.level}</td>
                    <td class="py-3 px-4 text-right">{entry.lines}</td>
                    <td class="py-3 px-4 text-right text-sm text-gray-400">{entry.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="text-center py-12 bg-gray-800 bg-opacity-30 rounded-lg border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-gray-400 text-lg">ランキングデータがありません</p>
          <p class="text-gray-500 text-sm mt-2">ゲームをプレイしてスコアを登録しましょう</p>
        </div>
      )}
    </div>
  );
};

export default Ranking;
