import { Component, createSignal, createEffect } from 'solid-js';
import { PuyoPair } from '../hooks/usePuyo';

interface Props {
  board: (number | null)[][];
  pair: PuyoPair | null;
  cellSize?: number;
}

const colors = [
  'puyo-red',
  'puyo-blue',
  'puyo-green',
  'puyo-yellow',
  // index 4: ojama
  'puyo-ojama',
];

const PuyoBoard: Component<Props> = (props) => {
  const size = props.cellSize ?? 48;
  const [prevBoard, setPrevBoard] = createSignal<(number|null)[][]>(
    props.board.map(row => [...row])
  );

  createEffect(() => {
    setPrevBoard(props.board.map(row => [...row]));
  });
  const getCell = (r:number,c:number) => {
    if(props.pair){
      const { row,col,orientation,colors:cl } = props.pair;
      const cells = pairCells(row,col,orientation);
      for(let i=0;i<2;i++){
        const [y,x] = cells[i];
        if(y===r && x===c) return cl[i];
      }
    }
    return props.board[r][c];
  };

  const isPairCell = (r:number,c:number) => {
    if(!props.pair) return false;
    const { row,col,orientation } = props.pair;
    const cells = pairCells(row,col,orientation);
    return cells.some(([y,x])=>y===r && x===c);
  };

  const pairCells = (r:number,c:number,o:number):[number,number][] => {
    const c1:[number,number] = [r,c];
    const c2:[number,number] = [r,c];
    if(o===0) c2[0]=r-1;
    if(o===1) c2[1]=c+1;
    if(o===2) c2[0]=r+1;
    if(o===3) c2[1]=c-1;
    return [c1,c2];
  };

  return (
    <div class="bg-gray-800 p-2 rounded-lg border border-gray-600 inline-block">
      <div class="grid grid-cols-6 gap-1 bg-gray-700 p-1 rounded">
        {props.board.map((row, rowIndex) =>
          row.map((_, colIndex) => {
            const cv = getCell(rowIndex, colIndex);
            const prevVal = prevBoard()[rowIndex][colIndex];
            const falling = isPairCell(rowIndex, colIndex);
            const clearing = prevVal !== null && cv === null;
            return (
              <div
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: cv !== null ? 'scale(1)' : 'scale(0)',
                  opacity: cv !== null ? '1' : '0',
                }}
                class={`${cv !== null ? colors[cv] : 'bg-gray-900'} puyo ${falling ? 'animate-puyo-fall' : ''} ${clearing ? 'animate-puyo-clear' : ''}`}
              >
                {cv !== null && <div class="puyo-mouth" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default PuyoBoard;
