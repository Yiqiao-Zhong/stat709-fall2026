/**
 * Course sampling profile stat709-mulberry32-boxmuller-v1.
 * Mulberry32 core adapted from bryc's public-domain JS implementation of
 * Tommy Ettinger's generator: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 * Course-specific midpoint conversion, Box–Muller ordering, and prefix API.
 */
export const RANDOMNESS_PROFILE = 'stat709-mulberry32-boxmuller-v1';

export function assertSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be an integer from 0 to 4294967295.');
  return seed;
}

export function mulberry32(seed) {
  let state = assertSeed(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  };
}

export function normalSequence(seed, count) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Count must be a nonnegative integer.');
  const draw = mulberry32(seed);
  const values = [];
  while (values.length < count) {
    // Midpoint conversion avoids log(0), even when the generator returns zero.
    const u1 = (draw() + 0.5) / 4294967296;
    const u2 = (draw() + 0.5) / 4294967296;
    const r = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    values.push(r * Math.cos(angle));
    if (values.length < count) values.push(r * Math.sin(angle));
  }
  return values;
}

export function nextSeed(seed) { return (assertSeed(seed) + 1) >>> 0; }

export function normalPoints3D(seed, count) {
  const values = normalSequence(seed, 3 * count);
  return Array.from({ length: count }, (_, i) => values.slice(3 * i, 3 * i + 3));
}
