import { sha256 } from 'ohash';
/**
 * Default hash method used to hash
 * strings and do equal comparisons.
 *
 * IMPORTANT: Changing the default hashing method
 * requires a BREAKING change!
 */
export function defaultHashSha256(input) {
  return sha256(input);
}
//# sourceMappingURL=utils-hash.js.map