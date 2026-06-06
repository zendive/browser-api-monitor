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

  function onVisibility() {
    document.hidden && stopAutoclick();
  }

  function startAutoclick() {
    auto.start();
    node.addEventListener('mouseleave', stopAutoclick);
    document.addEventListener('mouseup', stopAutoclick);
    document.addEventListener('visibilitychange', onVisibility);
  }

  function stopAutoclick() {
    auto.stop();
    node.removeEventListener('mouseleave', stopAutoclick);
    document.removeEventListener('mouseup', stopAutoclick);
    document.removeEventListener('visibilitychange', onVisibility);
  }

  node.addEventListener('mousedown', startAutoclick);

  return {
    destroy() {
      auto.stop();
      node.removeEventListener('mousedown', startAutoclick);
      node.removeEventListener('mouseleave', stopAutoclick);
      document.removeEventListener('mouseup', stopAutoclick);
    },
  };
};
