import { describe, expect, it } from 'vitest';
import { directions, disk } from './hex';
import { project, localPosition, hexTriangles, sphereNormal } from './projection';

describe('sphere projection', () => {
  it('pins the origin to the front and stays on the sphere', () => {
    expect(project(0, 0, 4.5)).toEqual([0, 0, 0]);
    
    for (const [x, y] of [[1, 2], [-20, 5], [1e6, -1e6]]) {
      const p = project(x, y, 4.5);
      expect(Math.hypot(p[0], p[1], p[2] + 4.5)).toBeCloseTo(4.5, 10);
      expect(p[2]).toBeGreaterThan(-4.5);
    }
  });

  it('keeps all nineteen cells distinct and preserves direction ordering', () => {
    const cells = disk({ q: 0, r: 0 }, 2);
    const projected = cells.map(c => {
      const p = localPosition(c, { q: 0, r: 0 }, 1);
      return project(p.x, p.y, 4.5);
    });
    expect(new Set(projected.map(p => p.join(','))).size).toBe(19);
    
    for (const d of directions) {
      const a = localPosition(d, { q: 0, r: 0 }, 1);
      const b = project(a.x, a.y, 4.5);
      expect(Math.sign(b[0])).toBe(Math.sign(a.x));
      expect(Math.sign(b[1])).toBe(Math.sign(a.y));
    }
  });

  it('is translation invariant across 10,000 consecutive moves', () => {
    let origin = { q: 1000000, r: -1000000 };
    const expected = directions.map(d => localPosition(d, { q: 0, r: 0 }, 1));
    
    for (let i = 0; i < 10000; i++) {
      const d = directions[i % 6];
      origin = { q: origin.q + d.q, r: origin.r + d.r };
      directions.forEach((n, j) =>
        expect(localPosition({ q: origin.q + n.q, r: origin.r + n.r }, origin, 1)).toEqual(expected[j])
      );
    }
  });

  it('projects coincident hex edges to identical positions', () => {
    const a = localPosition({ q: 0, r: 0 }, { q: 0.3, r: -0.1 }, 1);
    const b = localPosition({ q: 1, r: 0 }, { q: 0.3, r: -0.1 }, 1);
    
    for (const y of [-0.5, 0, 0.5]) {
      const pa = project(a.x + Math.sqrt(3) / 2, a.y + y, 4.5);
      const pb = project(b.x - Math.sqrt(3) / 2, b.y + y, 4.5);
      pa.forEach((v, i) => expect(v).toBeCloseTo(pb[i], 12));
    }
  });
});

describe('hexTriangles tessellation', () => {
  it('tessellates the entire hex without triangles outside boundary', () => {
    const triangles = hexTriangles(4);
    expect(triangles.length).toBe(6 * 4 * 4 * 3 * 2);
    
    for (let i = 0; i < triangles.length; i += 2) {
      expect(Math.hypot(triangles[i], triangles[i + 1])).toBeLessThanOrEqual(1.000001);
    }
    
    let area = 0;
    for (let i = 0; i < triangles.length; i += 6) {
      area += Math.abs(
        (triangles[i + 2] - triangles[i]) * (triangles[i + 5] - triangles[i + 1]) -
        (triangles[i + 4] - triangles[i]) * (triangles[i + 3] - triangles[i + 1])
      ) / 2;
    }
    expect(area).toBeCloseTo(3 * Math.sqrt(3) / 2, 10);
  });

  it('produces more triangles with higher subdivision', () => {
    const t2 = hexTriangles(2);
    const t4 = hexTriangles(4);
    const t8 = hexTriangles(8);
    expect(t4.length).toBeGreaterThan(t2.length);
    expect(t8.length).toBeGreaterThan(t4.length);
  });
});

describe('sphereNormal', () => {
  it('returns unit normals pointing outward', () => {
    const point: [number, number, number] = [1, 2, -1];
    const radius = 4.5;
    const n = sphereNormal(point, radius);
    
    const length = Math.hypot(...n);
    expect(length).toBeCloseTo(1, 5);
  });

  it('points straight out at the origin', () => {
    const n = sphereNormal([0, 0, 0], 4.5);
    expect(n).toEqual([0, 0, 1]);
  });
});
