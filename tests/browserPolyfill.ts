console.log('👋 globals');
import { PropertySymbol, Window } from 'happy-dom';

const window = new Window();
const document = window.document;
const browserWindow = document[PropertySymbol.window];

Object.assign(globalThis, {
  window,
  document,
  location: window.location,
  Element: browserWindow.Element,
  Document: browserWindow.Document,
  requestAnimationFrame: function requestAnimationFrameDumbStub(
    callback: (delay: number) => void,
  ) {
    return setTimeout(() => {
      callback(performance.now());
    }, 1e3 / 60);
    // We need to call endImmediate() before the callback as the callback might throw an error.
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
