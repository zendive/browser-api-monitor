import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export const HASH_STRING_LENGTH = 64;

export function hashString(str: string) {
  return (
    (str.length - HASH_STRING_LENGTH > 0 &&
      bytesToHex(sha256(utf8ToBytes(str)))) || str
  );
}
