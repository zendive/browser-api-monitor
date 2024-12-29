import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

const HASH_STRING_LENGTH = 64;

export function hashString(str: string) {
  if (str.length > HASH_STRING_LENGTH) {
    return bytesToHex(sha256(str));
  }

  return str;
}
