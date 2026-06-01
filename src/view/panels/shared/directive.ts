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
    document.addEventListener('mouseup', mouseup);
  }
  function mouseup() {
    auto.stop();
    document.removeEventListener('mouseup', mouseup);
  }

  node.addEventListener('mousedown', mousedown);

  return {
    destroy() {
      auto.stop();
      node.removeEventListener('mousedown', mousedown);
      document.removeEventListener('mouseup', mouseup);
    },
  };
};
