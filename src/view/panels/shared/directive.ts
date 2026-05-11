import { ETimer, Timer } from '../../../api/time.ts';
import type { Action } from 'svelte/action';

export const autoclick: Action<HTMLButtonElement> = (node: HTMLElement) => {
  const auto = new Timer(
    { type: ETimer.TIMEOUT, timeout: 128 },
    () => {
      auto.start();
      node.click();
    },
  );
  function mousedown() {
    auto.start();
  }
  function mouseup() {
    auto.stop();
  }

  node.addEventListener('mousedown', mousedown);
  node.addEventListener('mouseup', mouseup);

  return {
    destroy() {
      auto.stop();
      node.removeEventListener('mousedown', mousedown);
      node.removeEventListener('mouseup', mouseup);
    },
  };
};
