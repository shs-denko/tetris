import { Tetromino } from '../models/tetromino';
import { Position } from '../hooks/useTetris';

interface BoardProps {
  board: (number | null)[][];
  currentPiece: Tetromino | null;
  currentPosition: Position | null;
  ghostPosition?: Position | null; // ゴーストの位置を追加
  isGameOver?: boolean; // ゲームオーバー状態を追加
  clearingRows?: number[]; // 行クリア状態を追加
}

const Board = (props: BoardProps) => {
  const getCell = (rowIndex: number, colIndex: number) => {
    // 現在のピースが該当位置にあるかチェック
    if (props.currentPiece && props.currentPosition) {
      const { shape, color } = props.currentPiece;
      const { row, col } = props.currentPosition;

      // 現在のピースの位置を計算
      if (
        rowIndex >= row &&
        rowIndex < row + shape.length &&
        colIndex >= col &&
        colIndex < col + shape[0].length
      ) {
        const pieceRow = rowIndex - row;
        const pieceCol = colIndex - col;
        
        if (shape[pieceRow][pieceCol]) {
          return color; // ピースの色を返す
        }
      }
      
      // ゴーストの位置を描画（現在のピースがある場合は描画しない）
      if (props.ghostPosition && 
          rowIndex >= props.ghostPosition.row &&
          rowIndex < props.ghostPosition.row + shape.length &&
          colIndex >= props.ghostPosition.col &&
          colIndex < props.ghostPosition.col + shape[0].length) {
          
        const ghostRow = rowIndex - props.ghostPosition.row;
        const ghostCol = colIndex - props.ghostPosition.col;
        
        if (shape[ghostRow][ghostCol]) {
          return color + 10; // 元のピースの色 + 10 をゴースト用の色インデックスとして使用
        }
      }
    }

    // ボードのセルを返す
    return props.board[rowIndex][colIndex];
  };

  return (
    <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg shadow-lg border border-gray-700 relative">
      <div class="grid grid-cols-10 gap-[1px] bg-gray-800 p-1 rounded">
        {props.board.map((row, rowIndex) =>
          row.map((_, colIndex) => {
            const cellValue = getCell(rowIndex, colIndex);
            const isClearing = props.clearingRows?.includes(rowIndex);
            return (
              <div 
                class={`w-6 h-6 sm:w-8 sm:h-8 ${
                  cellValue !== null 
                    ? `${getBgColorClass(cellValue)} shadow-inner`
                    : 'bg-gray-900'
                } border-[0.5px] border-opacity-30 border-gray-700 rounded-sm transition-colors duration-100 ${isClearing ? 'animate-clear-line' : ''}`}
              />
            );
          })
        )}
      </div>
      
      {/* ゲームオーバー表示のオーバーレイ */}
      {props.isGameOver && (
        <div class="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
          <div class="text-red-500 font-bold text-2xl text-center px-2 py-1 bg-gray-900 bg-opacity-70 rounded-lg animate-pulse">
            ゲームオーバー
          </div>
        </div>
      )}
    </div>
  );
};

// テトリミノの色に対応するTailwind CSSのクラス
const getBgColorClass = (colorValue: number): string => {
  // 通常の色
  const colorClasses = [
    'bg-gradient-to-br from-cyan-400 to-cyan-600',    // I
    'bg-gradient-to-br from-blue-400 to-blue-600',    // J
    'bg-gradient-to-br from-orange-400 to-orange-600',  // L
    'bg-gradient-to-br from-yellow-400 to-yellow-600',  // O
    'bg-gradient-to-br from-green-400 to-green-600',   // S
    'bg-gradient-to-br from-purple-400 to-purple-600',  // T
    'bg-gradient-to-br from-red-400 to-red-600',     // Z
    'bg-gray-700 border border-gray-500 border-opacity-50'  // 未使用？
  ];
  
  // ゴースト用の色 (より透明度が高い)
  const ghostColorClasses = [
    'bg-cyan-900 bg-opacity-40 border border-cyan-500 border-opacity-30',       // I ゴースト
    'bg-blue-900 bg-opacity-40 border border-blue-500 border-opacity-30',       // J ゴースト
    'bg-orange-900 bg-opacity-40 border border-orange-500 border-opacity-30',   // L ゴースト
    'bg-yellow-900 bg-opacity-40 border border-yellow-500 border-opacity-30',   // O ゴースト
    'bg-green-900 bg-opacity-40 border border-green-500 border-opacity-30',     // S ゴースト
    'bg-purple-900 bg-opacity-40 border border-purple-500 border-opacity-30',   // T ゴースト
    'bg-red-900 bg-opacity-40 border border-red-500 border-opacity-30',         // Z ゴースト
  ];
  
  // ゴーストの場合（10〜16）
  if (colorValue >= 10 && colorValue < 17) {
    return ghostColorClasses[colorValue - 10];
  }
  
  // 通常の色（0〜7）
  return colorValue >= 0 && colorValue < colorClasses.length 
    ? colorClasses[colorValue] 
    : 'bg-gradient-to-br from-gray-500 to-gray-600';
};

export default Board;
