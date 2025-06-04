import { createSignal, createEffect, onCleanup } from 'solid-js';

export interface PuyoPair {
  row: number; // position of first puyo
  col: number;
  orientation: number; // 0:up 1:right 2:down 3:left
  colors: [number, number];
}

export const usePuyo = () => {
  const WIDTH = 6;
  const HEIGHT = 12;
  const DROP_INTERVAL = 700;

  const [board, setBoard] = createSignal<(number|null)[][]>(
    Array(HEIGHT).fill(0).map(() => Array(WIDTH).fill(null))
  );
  const [current, setCurrent] = createSignal<PuyoPair | null>(null);
  const [gameOver, setGameOver] = createSignal(false);

  const newPiece = () => {
    const pair: PuyoPair = {
      row: -1,
      col: Math.floor(WIDTH/2) -1,
      orientation: 0,
      colors: [Math.floor(Math.random()*4), Math.floor(Math.random()*4)]
    };
    if (!isValidPosition(pair.row, pair.col, pair.orientation)) {
      setGameOver(true);
    }
    setCurrent(pair);
  };

  const isValidPosition = (r:number, c:number, o:number) => {
    const cells = pairCells(r,c,o);
    return cells.every(([y,x]) =>
      y < HEIGHT && x >=0 && x < WIDTH && (y < 0 || board()[y][x] === null)
    );
  };

  const pairCells = (r:number,c:number,o:number): [number,number][] => {
    const [c1,c2] = [ [r,c], [r,c] ];
    if (o === 0) c2[0] = r-1;
    if (o === 1) c2[1] = c+1;
    if (o === 2) c2[0] = r+1;
    if (o === 3) c2[1] = c-1;
    return [c1 as [number,number], c2 as [number,number]];
  };

  const move = (dr:number, dc:number) => {
    const p = current();
    if (!p) return;
    const nr = p.row + dr;
    const nc = p.col + dc;
    if (isValidPosition(nr,nc,p.orientation)) setCurrent({ ...p, row:nr, col:nc });
  };

  const rotate = () => {
    const p = current();
    if (!p) return;
    const no = (p.orientation + 1)%4;
    if (isValidPosition(p.row,p.col,no)) setCurrent({ ...p, orientation:no });
  };

  const tick = () => {
    const p = current();
    if (!p) return;
    if (isValidPosition(p.row+1, p.col, p.orientation)) {
      setCurrent({ ...p, row: p.row+1 });
    } else {
      fixPiece();
    }
  };

  const fixPiece = () => {
    const p = current();
    if (!p) return;
    const cells = pairCells(p.row, p.col, p.orientation);
    const newBoard = board().map(row => [...row]);
    cells.forEach(([y,x], idx) => {
      if (y >= 0 && y < HEIGHT) newBoard[y][x] = p.colors[idx];
    });
    setBoard(newBoard);
    clearGroups();
    newPiece();
  };

  const clearGroups = () => {
    const b = board().map(r=>[...r]);
    const visited = Array(HEIGHT).fill(0).map(()=>Array(WIDTH).fill(false));
    let cleared = false;
    for(let y=0;y<HEIGHT;y++){
      for(let x=0;x<WIDTH;x++){
        const color = b[y][x];
        if(color===null || visited[y][x]) continue;
        const q:[[number,number]] = [[y,x]];
        const group:[[number,number]] = [] as any;
        visited[y][x]=true;
        while(q.length){
          const [cy,cx] = q.pop()!;
          group.push([cy,cx]);
          [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dy,dx])=>{
            const ny=cy+dy,nx=cx+dx;
            if(ny>=0&&ny<HEIGHT&&nx>=0&&nx<WIDTH&&!visited[ny][nx]&&b[ny][nx]===color){
              visited[ny][nx]=true;
              q.push([ny,nx]);
            }
          });
        }
        if(group.length>=4){
          cleared=true;
          group.forEach(([gy,gx])=>{ b[gy][gx]=null; });
        }
      }
    }
    if(cleared){
      // apply gravity
      for(let x=0;x<WIDTH;x++){
        let stack:number[] = [];
        for(let y=HEIGHT-1;y>=0;y--){
          if(b[y][x]!==null) stack.push(b[y][x]!);
        }
        for(let y=HEIGHT-1;y>=0;y--){
          b[y][x]=stack[HEIGHT-1-y] ?? null;
        }
      }
      setBoard(b);
      clearGroups();
    } else {
      setBoard(b);
    }
  };

  // game loop
  createEffect(() => {
    if(gameOver()) return;
    const id = setInterval(tick, DROP_INTERVAL);
    onCleanup(() => clearInterval(id));
  });

  newPiece();

  return {
    board,
    current,
    moveLeft: () => move(0,-1),
    moveRight: () => move(0,1),
    softDrop: () => move(1,0),
    rotate,
    isGameOver: gameOver
  };
};
