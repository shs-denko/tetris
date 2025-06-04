import { onMount, onCleanup } from 'solid-js';
import PuyoBoard from './PuyoBoard.tsx';
import { usePuyo } from '../hooks/usePuyo';
import { KeyBindings } from '../utils/keyBindings';

interface Props { bindings: KeyBindings; cellSize?: number }

const PuyoGame = (props: Props) => {
  const game = usePuyo();

  onMount(() => {
    const downHandler = (e: KeyboardEvent) => {
      if (game.isGameOver()) return;
      if(e.key === props.bindings.moveLeft) game.moveLeft();
      if(e.key === props.bindings.moveRight) game.moveRight();
      if(e.key === props.bindings.rotate) game.rotate();
      if(e.key === props.bindings.softDrop) game.softDrop();
    };
    window.addEventListener('keydown', downHandler);
    onCleanup(() => window.removeEventListener('keydown', downHandler));
  });

  return (
    <div class="flex flex-col items-center gap-4">
      <PuyoBoard board={game.board()} pair={game.current()} cellSize={props.cellSize ?? 48} />
      {game.isGameOver() && (
        <div class="text-red-500 font-bold">ゲームオーバー</div>
      )}
    </div>
  );
};

export default PuyoGame;
