import { ms2HMS } from '../../api/time.ts';

export function delayTooltip(delay: number | unknown) {
  if (typeof delay == 'number' && Number.isFinite(delay) && delay > 1e4) {
    return ms2HMS(delay);
  }
}

export function inKilo(value: number) {
  const kilo = value / 1e3;
  const integer = Math.trunc(kilo);
  const fraction = Math.trunc(10 * (kilo - integer));

  return `${integer}.${fraction}k`;
}
