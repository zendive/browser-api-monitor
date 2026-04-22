import { sha256 } from '@awasm/noble/js.js';

const HASH_STRING_LENGTH = 64;
const te = /*@__PURE__*/ (() => new TextEncoder())();
const uint8buffer = /*@__PURE__*/ (() => new Uint8Array(sha256.outputLen))();

export function hashString(str: string) {
  return (
    (str.length - HASH_STRING_LENGTH > 0 &&
      sha256(te.encode(str), { out: uint8buffer }).toHex()) ||
    str
  );
}
