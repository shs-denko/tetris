export interface KeyBindings {
  moveLeft: string;
  moveRight: string;
  rotateLeft: string;
  rotate: string;
  rotate180: string;
  softDrop: string;
  hardDrop: string;
  hold: string;
  pause: string;
  reset: string;
}

export const defaultKeyBindings: KeyBindings = {
  moveLeft: 'a',
  moveRight: 'd',
  rotateLeft: 'q',
  rotate: 'w',
  rotate180: 'x',
  softDrop: 's',
  hardDrop: ' ',
  hold: 'c',
  pause: 'p',
  reset: 'r',
};

export function loadKeyBindings(): KeyBindings {
  try {
    const stored = localStorage.getItem('keyBindings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultKeyBindings, ...parsed };
    }
  } catch {}
  return { ...defaultKeyBindings };
}

export function saveKeyBindings(bindings: KeyBindings) {
  localStorage.setItem('keyBindings', JSON.stringify(bindings));
}
