// Password hashing with node:crypto scrypt. Stored format:
//   scrypt$N$r$p$saltHex$hashHex
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

/**
 * Synchronous hash, for the seed script.
 * @param {string} password
 * @param {Buffer} [salt]
 * @returns {string}
 */
export function hashPasswordSync(password, salt = randomBytes(16)) {
  const key = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${key.toString('hex')}`;
}

/**
 * Checks a password against a stored hash without blocking the event loop.
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return Promise.resolve(false);
  const [, n, r, p, saltHex, hashHex] = parts;
  const expected = Buffer.from(hashHex, 'hex');
  return new Promise((resolve) => {
    scrypt(
      password,
      Buffer.from(saltHex, 'hex'),
      expected.length,
      { N: Number(n), r: Number(r), p: Number(p) },
      (error, key) => resolve(!error && timingSafeEqual(key, expected)),
    );
  });
}

let dummyHash;

/**
 * A hash of a random password, so that an unknown user costs the same time as
 * a wrong password. Computed on first use.
 * @returns {string}
 */
export function getDummyHash() {
  dummyHash ??= hashPasswordSync(randomBytes(12).toString('hex'));
  return dummyHash;
}
