import { createSignal, onMount, onCleanup } from 'solid-js';
import { KeyBindings, defaultKeyBindings, saveKeyBindings } from '../utils/keyBindings';

interface Props { onClose: () => void; bindings: KeyBindings; setBindings: (b: KeyBindings) => void; }

const actionLabels: Record<keyof KeyBindings, string> = {
  moveLeft: '左移動',
  moveRight: '右移動',
  rotateLeft: '左回転',
  rotate: '回転',
  rotate180: '180回転',
  softDrop: 'ソフトドロップ',
  hardDrop: 'ハードドロップ',
  hold: 'ホールド',
  pause: 'ポーズ',
  reset: 'リセット',
};

const KeySettingsModal = (props: Props) => {
  const [editing, setEditing] = createSignal<keyof KeyBindings | null>(null);
  const [localBindings, setLocalBindings] = createSignal<KeyBindings>({ ...props.bindings });

  const handleKey = (e: KeyboardEvent) => {
    const key = editing();
    if (!key) return;
    e.preventDefault();
    const value = e.key;
    setLocalBindings({ ...localBindings(), [key]: value });
    setEditing(null);
  };

  onMount(() => window.addEventListener('keydown', handleKey));
  onCleanup(() => window.removeEventListener('keydown', handleKey));

  const save = () => {
    const b = localBindings();
    props.setBindings(b);
    saveKeyBindings(b);
    props.onClose();
  };

  const reset = () => setLocalBindings({ ...defaultKeyBindings });

  const displayKey = (k: string) => (k === ' ' ? 'Space' : k);

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-80">
        <h2 class="text-xl mb-4">キー設定</h2>
        <div class="space-y-2">
          {(Object.keys(actionLabels) as (keyof KeyBindings)[]).map((action) => (
            <div class="flex justify-between items-center" >
              <span>{actionLabels[action]}</span>
              <button class="bg-gray-700 px-2 py-1 rounded" onClick={() => setEditing(action)}>
                {editing() === action ? '...': displayKey(localBindings()[action])}
              </button>
            </div>
          ))}
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="bg-gray-700 px-3 py-1 rounded" onClick={reset}>デフォルト</button>
          <button class="bg-blue-700 px-3 py-1 rounded" onClick={save}>保存</button>
          <button class="bg-gray-700 px-3 py-1 rounded" onClick={props.onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
};

export default KeySettingsModal;
