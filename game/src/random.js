// Gobble's Great Escape — deterministic random numbers.
// A tiny mulberry32 generator so screenshot runs (seeded) and live runs
// (seeded from the clock) both place obstacles the same way for a seed.

export function makeRng(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

export function rangeBetween(rng, min, max) {
  return min + rng() * (max - min);
}
