/**
 * Hex grid math using axial coordinates (q, r).
 * Pointy-top hexagons with the standard cube-coordinate constraint: q + r + s = 0.
 */

/** Axial hex coordinate */
export interface Hex {
  q: number;
  r: number;
}

/** The six directions in a hex grid, starting from east and going counter-clockwise */
export const directions: readonly Hex[] = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 },   // Southeast
];

/** Convert a hex coordinate to a unique string key */
export const key = ({ q, r }: Hex): string => `${q},${r}`;

/** Parse a string key back to a hex coordinate */
export const parseKey = (k: string): Hex => {
  const [q, r] = k.split(',').map(Number);
  return { q, r };
};

/** Calculate the hex distance between two coordinates */
export const distance = (a: Hex, b: Hex = { q: 0, r: 0 }): number =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;

/** Get the six neighbors of a hex */
export const neighbors = (h: Hex): Hex[] =>
  directions.map(d => ({ q: h.q + d.q, r: h.r + d.r }));

/** Add two hex coordinates */
export const add = (a: Hex, b: Hex): Hex => ({ q: a.q + b.q, r: a.r + b.r });

/** Subtract hex b from hex a */
export const subtract = (a: Hex, b: Hex): Hex => ({ q: a.q - b.q, r: a.r - b.r });

/** Scale a hex coordinate */
export const scale = (h: Hex, factor: number): Hex => ({ q: h.q * factor, r: h.r * factor });

/** Generate all hexes within a given radius from center (inclusive) */
export function disk(center: Hex, radius: number): Hex[] {
  const result: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      result.push({ q: center.q + q, r: center.r + r });
    }
  }
  return result;
}

/** Generate all hexes in a ring at exactly the given radius from center */
export function ring(center: Hex, radius: number): Hex[] {
  if (radius === 0) return [center];
  const results: Hex[] = [];
  let current: Hex = { q: center.q + radius, r: center.r };
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push(current);
      current = add(current, directions[(i + 2) % 6]);
    }
  }
  return results;
}

/** Convert axial coordinates to pixel position (pointy-top orientation) */
export const pixel = ({ q, r }: Hex, size: number): { x: number; y: number } => ({
  x: size * Math.sqrt(3) * (q + r / 2),
  y: size * 1.5 * r,
});

/** Round fractional hex coordinates to the nearest integer hex */
export function roundHex(h: Hex): Hex {
  let q = Math.round(h.q);
  let r = Math.round(h.r);
  let s = Math.round(-h.q - h.r);
  
  const dq = Math.abs(q - h.q);
  const dr = Math.abs(r - h.r);
  const ds = Math.abs(s + h.q + h.r);
  
  if (dq > dr && dq > ds) {
    q = -r - s;
  } else if (dr > ds) {
    r = -q - s;
  }
  
  return { q: q || 0, r: r || 0 };
}

/** Linear interpolation between two hex coordinates */
export function lerp(a: Hex, b: Hex, t: number): Hex {
  return {
    q: a.q + (b.q - a.q) * t,
    r: a.r + (b.r - a.r) * t,
  };
}
