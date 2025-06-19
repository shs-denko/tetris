import { RankingEntry } from '../components/Ranking';
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa';
import { encode, decode } from 'base64-arraybuffer';

// 秘密鍵をクライアントコードに埋め込む (Base64 形式)
const SECRET_KEY_B64 = '610II3p2MK4gjZtR2UOMNdl2jX1OpkyLMLt02Mrmz24=';
const PRIVATE_KEY = new Uint8Array(decode(SECRET_KEY_B64));

// サーバーへスコアを送信
export const sendScoreToServer = async (entry: RankingEntry) => {
  const message = JSON.stringify(entry);
  const signature = ml_dsa44.sign(new TextEncoder().encode(message), PRIVATE_KEY);
  const signatureB64 = encode(signature);

  await fetch('/api/ranking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': signatureB64,
    },
    body: message,
  });
};

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
