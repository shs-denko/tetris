import { RankingEntry } from '../components/Ranking';

export const saveScore = (name: string, score: number, lines: number, level: number) => {
  const newEntry: RankingEntry = {
    name,
    score,
    lines,
    level,
    date: new Date().toLocaleDateString()
  };

  let rankings: RankingEntry[] = [];
  
  // 既存のランキングを読み込む
  const storedRankings = localStorage.getItem('tetrisRankings');
  if (storedRankings) {
    try {
      rankings = JSON.parse(storedRankings);
    } catch (e) {
      console.error('ランキングデータの読み込みに失敗しました', e);
    }
  }

  // 新しいスコアを追加
  rankings.push(newEntry);
  
  // スコア順にソート
  rankings.sort((a, b) => b.score - a.score);
  
  // 最大10件に制限
  if (rankings.length > 10) {
    rankings = rankings.slice(0, 10);
  }
  
  // ランキングを保存
  localStorage.setItem('tetrisRankings', JSON.stringify(rankings));
  
  return rankings;
};

export const getRankings = (): RankingEntry[] => {
  const storedRankings = localStorage.getItem('tetrisRankings');
  if (storedRankings) {
    try {
      return JSON.parse(storedRankings);
    } catch (e) {
      console.error('ランキングデータの読み込みに失敗しました', e);
    }
  }
  return [];
};

export const clearRankings = (): void => {
  localStorage.removeItem('tetrisRankings');
};
