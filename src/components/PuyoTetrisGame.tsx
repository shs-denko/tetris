import PuyoGame from './PuyoGame.tsx';
import TetrisGame from './TetrisGame.tsx';
import { KeyBindings } from '../utils/keyBindings';

interface Props { bindings: KeyBindings }

const arrowBindings: KeyBindings = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  rotate: 'ArrowUp',
  rotate180: 'Insert',
  softDrop: 'ArrowDown',
  hardDrop: 'Enter',
  hold: 'Shift',
  pause: 'p',
  reset: 'r',
};

const PuyoTetrisGame = (props: Props) => (
  <div class="flex gap-4 justify-center">
    <PuyoGame bindings={props.bindings} cellSize={32} />
    <TetrisGame mode="single" bindings={arrowBindings} />
  </div>
);

export default PuyoTetrisGame;
