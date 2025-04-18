import { Tetromino } from '../models/tetromino';
import { Position } from '../hooks/useTetris';

interface BoardProps {
  board: (number | null)[][];
  currentPiece: Tetromino | null;
  currentPosition: Position | null;
  isGameOver?: boolean; // ゲームオーバー状態を追加
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
    }

    // ボードのセルを返す
    return props.board[rowIndex][colIndex];
  };

  return (
    <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg shadow-lg border border-gray-700 relative">
      <div class="grid grid-cols-10 gap-[1px] bg-gray-800 p-1 rounded">
        {props.board.map((row, rowIndex) => (
          row.map((_, colIndex) => {
            const cellValue = getCell(rowIndex, colIndex);
            return (
              <div 
                class={`w-6 h-6 sm:w-8 sm:h-8 ${
                  cellValue !== null 
                    ? `${getBgColorClass(cellValue)} shadow-inner`
                    : 'bg-gray-900'
                } border-[0.5px] border-opacity-30 border-gray-700 rounded-sm transition-colors duration-100`}
              />
            );
          })
        ))}
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
  const colorClasses = [
    'bg-gradient-to-br from-cyan-400 to-cyan-600',    // I
    'bg-gradient-to-br from-blue-400 to-blue-600',    // J
    'bg-gradient-to-br from-orange-400 to-orange-600',  // L
    'bg-gradient-to-br from-yellow-400 to-yellow-600',  // O
    'bg-gradient-to-br from-green-400 to-green-600',   // S
    'bg-gradient-to-br from-purple-400 to-purple-600',  // T
    'bg-gradient-to-br from-red-400 to-red-600',     // Z
    'bg-gradient-to-br from-gray-400 to-gray-500'     // ゴースト
  ];
  
  return colorValue >= 0 && colorValue < colorClasses.length 
    ? colorClasses[colorValue] 
    : 'bg-gradient-to-br from-gray-500 to-gray-600';
};

export default Board;
