export function validHandler(handler: unknown): handler is number {
  return Number.isFinite(handler) && <number>handler > 0;
}

export function validTimerDelay(delay: unknown): delay is number {
  return delay === undefined || (Number.isFinite(delay) && <number>delay >= 0);
}
