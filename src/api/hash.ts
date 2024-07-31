import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export const HASH_STRING_LENGTH = 64;

export function hashString(str: string): string {
  return bytesToHex(sha256(str));
}
