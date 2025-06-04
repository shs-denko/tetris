import { createSignal, createEffect, onMount } from 'solid-js';
import './App.css';
import TetrisGame from './components/TetrisGame.tsx';
import PuyoGame from './components/PuyoGame.tsx';
import PuyoVersusGame from './components/PuyoVersusGame.tsx';
import PuyoTetrisGame from './components/PuyoTetrisGame.tsx';
import { RankingEntry } from './components/Ranking.tsx';
import KeySettingsModal from './components/KeySettingsModal.tsx';
import { loadKeyBindings, KeyBindings } from './utils/keyBindings';

function App() {
  const [gameMode, setGameMode] = createSignal<
    | 'single'
    | 'versus'
    | 'puyo'
    | 'puyoVersus'
    | 'puyoTetris'
    | null
  >(null);
  const [animateTitle, setAnimateTitle] = createSignal(true);
  const [rankings, setRankings] = createSignal<RankingEntry[]>([]);
  const [keyBindings, setKeyBindings] = createSignal<KeyBindings>(loadKeyBindings());
  const [showSettings, setShowSettings] = createSignal(false);
  const [selectedMode, setSelectedMode] = createSignal<'single' | 'versus' | null>(null);
  
  // ボタンホバーエフェクト用
  const [hoveredButton, setHoveredButton] = createSignal<string | null>(null);

  // 初期ロード時のタイトルアニメーション
  createEffect(() => {
    if (animateTitle()) {
      setTimeout(() => setAnimateTitle(false), 1000);
    }
  });
  
  // ランキングデータ読み込み
  onMount(() => {
    const storedRankings = localStorage.getItem('tetrisRankings');
    if (storedRankings) {
      try {
        setRankings(JSON.parse(storedRankings));
      } catch (e) {
        console.error('ランキングデータの読み込みに失敗しました', e);
      }
    }
  });

  // ランキングクリア
  const clearRankings = () => {
    if (confirm('ランキングデータをリセットしてもよろしいですか？')) {
      localStorage.removeItem('tetrisRankings');
      setRankings([]);
    }
  };

  return (
    <div class="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950 text-white flex flex-col items-center justify-center p-4 overflow-auto">
      {/* 背景装飾 - テトリスブロックの影 */}
      <div class="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div class="absolute top-10 left-10 w-20 h-20 bg-cyan-500 rotate-45 transform animate-float-slow"></div>
        <div class="absolute top-[30%] right-10 w-16 h-16 bg-purple-500 rotate-12 transform animate-float-medium"></div>
        <div class="absolute bottom-20 left-[20%] w-24 h-12 bg-yellow-500 -rotate-12 transform animate-float-fast"></div>
        <div class="absolute top-[60%] right-[30%] w-12 h-12 bg-green-500 rotate-45 transform animate-float-medium"></div>
        <div class="absolute top-[80%] left-[70%] w-16 h-16 bg-red-500 rotate-12 transform animate-float-slow"></div>
      </div>
      
      <h1 
        class={`text-6xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 
        ${animateTitle() ? 'scale-150 opacity-0' : 'scale-100 opacity-100'} 
        transition-all duration-1000 transform shadow-text`}
      >
        DENRIS
      </h1>
      
      {gameMode() === null && selectedMode() === null ? (
        <div class="flex flex-col md:flex-row gap-6 w-full max-w-5xl px-4 relative z-10">
          {/* メインメニュー */}
          <div class="flex flex-col gap-6 md:w-1/2">
            <button 
              class={`relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-800 
                hover:from-blue-500 hover:to-blue-600 text-white font-bold py-5 px-6 rounded-lg 
                text-2xl transition-all duration-300 shadow-lg hover:shadow-xl 
                border-2 border-transparent hover:border-blue-300 transform hover:-translate-y-1
                ${hoveredButton() === 'single' ? 'scale-105' : 'scale-100'}`}
              onClick={() => setSelectedMode('single')}
              onMouseEnter={() => setHoveredButton('single')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <span class="relative z-10 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                シングルプレイ
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>

          <button
              class={`relative overflow-hidden group bg-gradient-to-r from-red-600 to-red-800
                hover:from-red-500 hover:to-red-600 text-white font-bold py-5 px-6 rounded-lg
                text-2xl transition-all duration-300 shadow-lg hover:shadow-xl
                border-2 border-transparent hover:border-red-300 transform hover:-translate-y-1
                ${hoveredButton() === 'versus' ? 'scale-105' : 'scale-100'}`}
              onClick={() => setSelectedMode('versus')}
              onMouseEnter={() => setHoveredButton('versus')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <span class="relative z-10 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                対戦プレイ
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>

            <button
              class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors shadow-md"
              onClick={() => setShowSettings(true)}
            >キー設定</button>
            
            {/* 操作方法 */}
            <div class="mt-2 text-gray-400 text-sm bg-gray-800 bg-opacity-50 px-4 py-3 rounded-md border border-gray-700 shadow-md">
              <div class="font-bold mb-2 text-gray-300">操作方法</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div class="font-semibold text-gray-200 mb-1">プレイヤー1 (シングル or 左側 in 対戦)</div>
                  <ul class="list-disc list-inside space-y-1">
                    <li>左移動: A</li>
                    <li>右移動: D</li>
                    <li>回転: W</li>
                    <li>ソフトドロップ: S</li>
                    <li>ハードドロップ: Space</li>
                    <li>ホールド: C</li>
                  </ul>
                </div>
                <div>
                  <div class="font-semibold text-gray-200 mb-1">プレイヤー2 (対戦のみ 右側)</div>
                  <ul class="list-disc list-inside space-y-1">
                    <li>左移動: ←</li>
                    <li>右移動: →</li>
                    <li>回転: ↑</li>
                    <li>ソフトドロップ: ↓</li>
                    <li>ハードドロップ: Enter</li>
                    <li>ホールド: Shift</li>
                  </ul>
                </div>
                <div class="sm:col-span-2">
                  <div class="font-semibold text-gray-200 mb-1">共通</div>
                  <ul class="list-disc list-inside space-y-1">
                    <li>ポーズ / 再開: P</li>
                    <li>リセット: R</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* ランキング表示エリア */}
          <div class="md:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-xl shadow-xl border border-purple-900">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                ランキング
              </h2>
              {rankings().length > 0 && (
                <button
                  class="bg-red-800 hover:bg-red-700 text-white text-sm py-1 px-2 rounded transition-colors flex items-center gap-1"
                  onClick={clearRankings}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  クリア
                </button>
              )}
            </div>

            {rankings().length > 0 ? (
              <div class="overflow-hidden bg-gray-850 bg-opacity-50 rounded-lg shadow-inner border border-gray-700">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-700 bg-gray-800 bg-opacity-70">
                      <th class="py-2 px-3 text-left text-purple-300 text-sm">順位</th>
                      <th class="py-2 px-3 text-left text-purple-300 text-sm">名前</th>
                      <th class="py-2 px-3 text-right text-purple-300 text-sm">スコア</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings()
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 5) // トップ5のみ表示
                      .map((entry, index) => (
                        <tr class={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${index < 3 ? 'bg-gray-800 bg-opacity-40' : ''}`}>
                          <td class={`py-2 px-3 font-bold ${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            index === 2 ? 'text-amber-700' : 'text-gray-400'
                          }`}>
                            {index === 0 && <span class="mr-1">🏆</span>}
                            {index === 1 && <span class="mr-1">🥈</span>}
                            {index === 2 && <span class="mr-1">🥉</span>}
                            {index + 1}
                          </td>
                          <td class="py-2 px-3 truncate max-w-[100px]">{entry.name}</td>
                          <td class="py-2 px-3 text-right font-mono text-green-400">{entry.score.toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div class="text-center py-6 bg-gray-800 bg-opacity-30 rounded-lg border border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-8 w-8 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="text-gray-400">まだスコアがありません</p>
                <p class="text-gray-500 text-xs mt-1">プレイしてスコアを登録しましょう</p>
              </div>
            )}
          </div>
        </div>
      ) : gameMode() === null && selectedMode() !== null ? (
        <div class="flex flex-col items-center gap-6 relative z-10">
          <div class="flex gap-6">
            <button
              class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors shadow-md"
              onClick={() =>
                setGameMode(selectedMode() === 'single' ? 'single' : 'versus')
              }
            >
              テトリス
            </button>
          <button
            class="bg-purple-700 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg transition-colors shadow-md"
            onClick={() =>
              setGameMode(selectedMode() === 'single' ? 'puyo' : 'puyoVersus')
            }
          >
            ぷよぷよ
          </button>
          {selectedMode() === 'versus' && (
            <button
              class="bg-green-700 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg transition-colors shadow-md"
              onClick={() => setGameMode('puyoTetris')}
            >
              ぷよ×テト
            </button>
          )}
          </div>
          <button
            class="mt-4 text-sm text-gray-300 underline"
            onClick={() => setSelectedMode(null)}
          >戻る</button>
        </div>
      ) : (
        <div class="w-full max-w-6xl">
          <div class="mb-6 flex justify-between">
            <button 
              class="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-md hover:shadow-lg flex items-center gap-2 border border-gray-600"
              onClick={() => {
                setGameMode(null);
                setSelectedMode(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              メニューに戻る
            </button>
            <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-1 rounded-md border border-gray-700 bg-opacity-20 bg-gray-800">
              {gameMode() === 'single'
                ? 'シングルプレイ'
                : gameMode() === 'versus'
                ? '対戦プレイ'
                : gameMode() === 'puyo'
                ? 'ぷよぷよ'
                : gameMode() === 'puyoVersus'
                ? 'ぷよぷよVS'
                : gameMode() === 'puyoTetris'
                ? 'ぷよ×テト'
                : ''}
            </div>
          </div>

          {gameMode() === 'puyo' && <PuyoGame bindings={keyBindings()} />}
          {gameMode() === 'puyoVersus' && (
            <PuyoVersusGame bindings={keyBindings()} />
          )}
          {gameMode() === 'puyoTetris' && (
            <PuyoTetrisGame bindings={keyBindings()} />
          )}
          {(gameMode() === 'single' || gameMode() === 'versus') && (
            <TetrisGame mode={gameMode() as 'single' | 'versus'} bindings={keyBindings()} />
          )}
        </div>
      )}
      {showSettings() && (
        <KeySettingsModal
          bindings={keyBindings()}
          setBindings={setKeyBindings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
