import { PropertySymbol, Window } from 'happy-dom';
import 'scheduler-polyfill';

const window = new Window();
const document = window.document;
const browserWindow = document[PropertySymbol.window];

Object.assign(globalThis, {
  window,
  document,
  location: window.location,
  Element: browserWindow.Element,
  Document: browserWindow.Document,
  __mirror__: false,

  requestAnimationFrame: function requestAnimationFrameDumbStub(
    callback: (delay: number) => void,
  ) {
    return setTimeout(() => {
      callback(performance.now());
    }, 0);
  },

  cancelAnimationFrame: function cancelAnimationFrameDumbStub(id: number) {
    clearTimeout(id);
  },

  requestIdleCallback: function requestIdleCallbackDumbStub(
    callback: (deadline: {
      didTimeout: boolean;
      timeRemaining: number;
    }) => void,
    options: { timeout: number } | undefined,
  ) {
    return setTimeout(() => {
      callback({ didTimeout: false, timeRemaining: performance.now() });
    }, options?.timeout || 0);
  },

  cancelIdleCallback: function cancelIdleCallbackDumbStub(id: number) {
    clearTimeout(id);
  },
});
