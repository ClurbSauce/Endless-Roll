import { describe, expect, it } from 'vitest';
import {
  directions,
  key,
  parseKey,
  distance,
  neighbors,
  add,
  subtract,
  scale,
  disk,
  ring,
  pixel,
  roundHex,
  lerp,
  type Hex,
} from './hex';

describe('hex coordinates', () => {
  it('has six directions in the correct order', () => {
    expect(directions).toHaveLength(6);
    expect(directions[0]).toEqual({ q: 1, r: 0 }); // East
    expect(directions[3]).toEqual({ q: -1, r: 0 }); // West
  });

  it('converts to and from string keys', () => {
    const hex: Hex = { q: 5, r: -3 };
    expect(key(hex)).toBe('5,-3');
    expect(parseKey('5,-3')).toEqual(hex);
    expect(parseKey(key(hex))).toEqual(hex);
  });

  it('calculates distance correctly', () => {
    expect(distance({ q: 0, r: 0 })).toBe(0);
    expect(distance({ q: 1, r: 0 })).toBe(1);
    expect(distance({ q: 1, r: -1 })).toBe(1);
    expect(distance({ q: 2, r: -1 })).toBe(2);
    expect(distance({ q: 3, r: 0 })).toBe(3);
    expect(distance({ q: 2, r: 2 }, { q: 0, r: 0 })).toBe(4);
    expect(distance({ q: 1000000, r: -1000000 }, { q: 1000001, r: -1000000 })).toBe(1);
  });

  it('returns six neighbors', () => {
    const n = neighbors({ q: 0, r: 0 });
    expect(n).toHaveLength(6);
    expect(n.every(h => distance(h) === 1)).toBe(true);
  });

  it('adds and subtracts coordinates', () => {
    expect(add({ q: 1, r: 2 }, { q: 3, r: -1 })).toEqual({ q: 4, r: 1 });
    expect(subtract({ q: 5, r: 3 }, { q: 2, r: 1 })).toEqual({ q: 3, r: 2 });
  });

  it('scales coordinates', () => {
    expect(scale({ q: 2, r: -3 }, 2)).toEqual({ q: 4, r: -6 });
    expect(scale({ q: 4, r: 2 }, 0.5)).toEqual({ q: 2, r: 1 });
  });
});

describe('disk and ring', () => {
  it('generates disk with correct cell count', () => {
    expect(disk({ q: 0, r: 0 }, 0)).toHaveLength(1);
    expect(disk({ q: 0, r: 0 }, 1)).toHaveLength(7);
    expect(disk({ q: 0, r: 0 }, 2)).toHaveLength(19);
    expect(disk({ q: 0, r: 0 }, 3)).toHaveLength(37);
  });

  it('generates disk centered at given coordinate', () => {
    const d = disk({ q: 100, r: -50 }, 1);
    expect(d.some(h => h.q === 100 && h.r === -50)).toBe(true);
    expect(d.every(h => distance(h, { q: 100, r: -50 }) <= 1)).toBe(true);
  });

  it('generates ring with correct cell count', () => {
    expect(ring({ q: 0, r: 0 }, 0)).toHaveLength(1);
    expect(ring({ q: 0, r: 0 }, 1)).toHaveLength(6);
    expect(ring({ q: 0, r: 0 }, 2)).toHaveLength(12);
    expect(ring({ q: 0, r: 0 }, 3)).toHaveLength(18);
  });

  it('generates ring at exact distance', () => {
    const r = ring({ q: 0, r: 0 }, 2);
    expect(r.every(h => distance(h) === 2)).toBe(true);
  });
});

describe('pixel conversion', () => {
  it('places origin at center', () => {
    expect(pixel({ q: 0, r: 0 }, 1)).toEqual({ x: 0, y: 0 });
  });

  it('calculates correct pixel positions', () => {
    const p = pixel({ q: 1, r: 0 }, 1);
    expect(p.x).toBeCloseTo(Math.sqrt(3), 10);
    expect(p.y).toBe(0);

    const p2 = pixel({ q: 0, r: 1 }, 1);
    expect(p2.x).toBeCloseTo(Math.sqrt(3) / 2, 10);
    expect(p2.y).toBe(1.5);
  });

  it('scales with size parameter', () => {
    const p1 = pixel({ q: 1, r: 0 }, 1);
    const p2 = pixel({ q: 1, r: 0 }, 2);
    expect(p2.x).toBeCloseTo(p1.x * 2, 10);
    expect(p2.y).toBe(p1.y * 2);
  });
});

describe('roundHex', () => {
  it('rounds to nearest hex', () => {
    expect(roundHex({ q: 0.1, r: -0.1 })).toEqual({ q: 0, r: 0 });
    expect(roundHex({ q: 0.6, r: 0.1 })).toEqual({ q: 1, r: 0 });
    expect(roundHex({ q: 0.3, r: 0.3 })).toEqual({ q: 0, r: 0 });
  });

  it('maintains cube coordinate constraint', () => {
    for (let i = 0; i < 100; i++) {
      const frac = { q: Math.random() * 10 - 5, r: Math.random() * 10 - 5 };
      const rounded = roundHex(frac);
      expect(Number.isInteger(rounded.q)).toBe(true);
      expect(Number.isInteger(rounded.r)).toBe(true);
    }
  });
});

describe('lerp', () => {
  it('interpolates between hexes', () => {
    const a = { q: 0, r: 0 };
    const b = { q: 2, r: 4 };
    expect(lerp(a, b, 0)).toEqual(a);
    expect(lerp(a, b, 1)).toEqual(b);
    expect(lerp(a, b, 0.5)).toEqual({ q: 1, r: 2 });
  });
});
