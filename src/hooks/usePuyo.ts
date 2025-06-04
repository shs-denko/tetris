import { createSignal, createEffect, onCleanup } from 'solid-js';

export interface PuyoPair {
  row: number; // position of first puyo
  col: number;
  orientation: number; // 0:up 1:right 2:down 3:left
  colors: [number, number];
}

export const usePuyo = (onClear?: (count:number)=>void) => {
  const WIDTH = 6;
  const HEIGHT = 12;
  const DROP_INTERVAL = 700;

  const [board, setBoard] = createSignal<(number|null)[][]>(
    Array(HEIGHT)
      .fill(0)
      .map(() => Array(WIDTH).fill(null))
  );
  const [current, setCurrent] = createSignal<PuyoPair | null>(null);
  const [gameOver, setGameOver] = createSignal(false);

  const newPiece = () => {
    const pair: PuyoPair = {
      row: 0,
      col: Math.floor(WIDTH / 2) - 1,
      orientation: 0,
      colors: [
        Math.floor(Math.random() * 4),
        Math.floor(Math.random() * 4),
      ],
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
    const newBoard = board().map((row: (number | null)[]) => [...row]);
    cells.forEach(([y, x], idx) => {
      if (y >= 0 && y < HEIGHT) newBoard[y][x] = p.colors[idx];
    });
    applyGravity(newBoard);
    setBoard(newBoard);
    const cleared = clearGroups();
    if (cleared > 0 && onClear) onClear(cleared);
    newPiece();
  };

  const applyGravity = (b: (number | null)[][]) => {
    for (let x = 0; x < WIDTH; x++) {
      let write = HEIGHT - 1;
      for (let y = HEIGHT - 1; y >= 0; y--) {
        const val = b[y][x];
        if (val !== null) {
          b[write][x] = val;
          if (write !== y) b[y][x] = null;
          write--;
        }
      }
      for (let y = write; y >= 0; y--) b[y][x] = null;
    }
  };

  const addOjama = (lines: number) => {
    if (lines <= 0) return;
    setBoard((prev: (number | null)[][]) => {
      const b = prev.map(row => [...row]);
      for (let i = 0; i < lines; i++) {
        const removed = b.shift();
        if (removed && removed.some(v => v !== null)) setGameOver(true);
        const hole = Math.floor(Math.random() * WIDTH);
        const row = Array(WIDTH).fill(4) as (number | null)[];
        row[hole] = null;
        b.push(row);
      }
      return b;
    });
  };

  const clearGroups = () => {
    const b = board().map((r: (number | null)[]) => [...r]);
    const visited = Array(HEIGHT).fill(0).map(()=>Array(WIDTH).fill(false));
    let cleared = false;
    let clearedCount = 0;
    for(let y=0;y<HEIGHT;y++){
      for(let x=0;x<WIDTH;x++){
        const color = b[y][x];
        if(color===null || color===4 || visited[y][x]) continue;
        const q: [number, number][] = [[y, x]];
        const group: [number, number][] = [];
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
          clearedCount += group.length;
          group.forEach(([gy,gx])=>{ b[gy][gx]=null; });
        }
      }
    }
    if (cleared) {
      applyGravity(b);
      setBoard(b);
      clearedCount += clearGroups();
    } else {
      setBoard(b);
    }
    return clearedCount;
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
    addOjama,
    isGameOver: gameOver
  };
};
