import { onMount, onCleanup } from 'solid-js';
import PuyoBoard from './PuyoBoard.tsx';
import { usePuyo } from '../hooks/usePuyo';
import { KeyBindings } from '../utils/keyBindings';

interface Props { bindings: KeyBindings }

const PuyoVersusGame = (props: Props) => {
  const player1 = usePuyo();
  const player2 = usePuyo();

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if (!player1.isGameOver()) {
        if (e.key === props.bindings.moveLeft) player1.moveLeft();
        if (e.key === props.bindings.moveRight) player1.moveRight();
        if (e.key === props.bindings.rotate) player1.rotate();
        if (e.key === props.bindings.softDrop) player1.softDrop();
      }
      if (!player2.isGameOver()) {
        if (e.key === 'ArrowLeft') player2.moveLeft();
        if (e.key === 'ArrowRight') player2.moveRight();
        if (e.key === 'ArrowUp') player2.rotate();
        if (e.key === 'ArrowDown') player2.softDrop();
      }
    };
    window.addEventListener('keydown', handler);
    onCleanup(() => window.removeEventListener('keydown', handler));
  });

  return (
    <div class="flex gap-4">
      <div class="flex flex-col items-center gap-2">
        <PuyoBoard board={player1.board()} pair={player1.current()} />
        {player1.isGameOver() && <div class="text-red-500">ゲームオーバー</div>}
      </div>
      <div class="flex flex-col items-center gap-2">
        <PuyoBoard board={player2.board()} pair={player2.current()} />
        {player2.isGameOver() && <div class="text-red-500">ゲームオーバー</div>}
      </div>
    </div>
  );
};

export default PuyoVersusGame;
