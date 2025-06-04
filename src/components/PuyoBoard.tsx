import { Component } from 'solid-js';
import { PuyoPair } from '../hooks/usePuyo';

interface Props {
  board: (number|null)[][];
  pair: PuyoPair | null;
}

const colors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-400'
];

const PuyoBoard: Component<Props> = (props) => {
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
    <div class="bg-gray-800 p-2 rounded border border-gray-600">
      <div class="grid grid-cols-6 gap-[1px] bg-gray-700">
        {props.board.map((row,rowIndex)=>
          row.map((_,colIndex)=>{
            const cv = getCell(rowIndex,colIndex);
            return <div class={`w-6 h-6 sm:w-8 sm:h-8 ${cv!==null?colors[cv]:'bg-gray-900'} rounded-sm`}/>;
          })
        )}
      </div>
    </div>
  );
};
export default PuyoBoard;
