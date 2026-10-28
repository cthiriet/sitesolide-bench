// Small seeded random number helpers. Everything the generator produces is
// derived from these, so the same seed always yields the same site.

/** FNV-1a hash of a string, used to derive one independent seed per page. */
export function hashString(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** mulberry32: a tiny, fast, well distributed 32 bit generator. */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Random {
  constructor(seed) {
    this.next = mulberry32(seed);
  }

  /** Float in [0, 1). */
  float() {
    return this.next();
  }

  /** Integer in [min, max], both included. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability) {
    return this.next() < probability;
  }

  pick(items) {
    return items[Math.floor(this.next() * items.length)];
  }

  /** A shuffled copy (Fisher-Yates). */
  shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** `count` distinct items. */
  sample(items, count) {
    return this.shuffle(items).slice(0, count);
  }

  /** Picks an item by relative weight: entries are [weight, value]. */
  weighted(entries) {
    const total = entries.reduce((sum, [weight]) => sum + weight, 0);
    let roll = this.next() * total;
    for (const [weight, value] of entries) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1][1];
  }
}
