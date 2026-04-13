import { sha256 } from '@noble/hashes/sha2.js';

const HASH_STRING_LENGTH = 64;
const te = new TextEncoder();

export function hashString(str: string) {
  return (
    (str.length - HASH_STRING_LENGTH > 0 && sha256(te.encode(str)).toHex()) ||
    str
  );
}
