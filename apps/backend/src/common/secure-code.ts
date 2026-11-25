import * as crypto from 'crypto';

/** Cryptographically strong 6-digit decimal code (100000–999999). */
export function sixDigitCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}
