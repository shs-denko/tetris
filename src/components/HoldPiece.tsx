import { Tetromino } from '../models/tetromino.tsx';

interface HoldPieceProps {
  piece: Tetromino | null;
}

const HoldPiece = (props: HoldPieceProps) => {
  // テトロミノを4x4のグリッドに合わせて表示する関数
  const renderPiece = (piece: Tetromino) => {
    // 4x4のグリッドを作成
    const grid = Array(4).fill(0).map(() => Array(4).fill(0));
    
    // ピースの形状を中央に配置
    const offsetRow = Math.floor((4 - piece.shape.length) / 2);
    const offsetCol = Math.floor((4 - piece.shape[0].length) / 2);
    
    // ピースの形状をグリッドにマッピング
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          grid[y + offsetRow][x + offsetCol] = 1;
        }
      }
    }
    
    return (
      <div class="grid grid-cols-4 gap-[1px]">
        {grid.map(row => 
          row.map(cell => (
            <div 
              class={`w-4 h-4 sm:w-5 sm:h-5 ${
                cell ? getBgColorClass(piece.color) : 'bg-transparent'
              }`}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
      <div class="text-xl mb-4 font-bold text-orange-300">Hold</div>
      
      <div class="bg-gray-800 p-2 rounded-md shadow-inner flex items-center justify-center">
        {props.piece ? (
          renderPiece(props.piece)
        ) : (
          <div class="w-20 h-20 flex items-center justify-center text-gray-500">
            Empty
          </div>
        )}
      </div>
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
  ];
  
  return colorValue >= 0 && colorValue < colorClasses.length 
    ? colorClasses[colorValue] 
    : 'bg-gradient-to-br from-gray-500 to-gray-600';
};

export default HoldPiece;
