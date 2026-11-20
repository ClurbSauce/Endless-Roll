import { describe, expect, it } from 'vitest';
import { distance } from './hex';
import { dragOffset, unitsPerPixel, DEFAULT_DRAG_LIMIT } from './drag';

describe('dragOffset', () => {
  it('moves opposite to drag direction', () => {
    const start = { q: 0, r: 0 };
    const units = 0.01;
    const cellSize = 1;
    
    const rightDrag = dragOffset(start, 100, 0, units, cellSize);
    expect(rightDrag.q).toBeLessThan(0);
    
    const downDrag = dragOffset(start, 0, 100, units, cellSize);
    expect(downDrag.r).toBeLessThan(0);
  });

  it('respects maximum distance limit', () => {
    const start = { q: 0, r: 0 };
    const maxDist = 2;
    
    const offset = dragOffset(start, 10000, 10000, 0.1, 1, maxDist);
    expect(distance(offset)).toBeLessThanOrEqual(maxDist + 0.0001);
  });

  it('uses default drag limit', () => {
    const start = { q: 0, r: 0 };
    const offset = dragOffset(start, 10000, 10000, 0.1, 1);
    expect(distance(offset)).toBeLessThanOrEqual(DEFAULT_DRAG_LIMIT + 0.0001);
  });

  it('accumulates from start position', () => {
    const start = { q: 1, r: 0.5 };
    const offset = dragOffset(start, 0, 0, 0.01, 1);
    expect(offset).toEqual(start);
  });
});

describe('unitsPerPixel', () => {
  it('increases with camera distance', () => {
    const fov = 45;
    const height = 1000;
    
    const nearUnits = unitsPerPixel(5, fov, height);
    const farUnits = unitsPerPixel(10, fov, height);
    expect(farUnits).toBeGreaterThan(nearUnits);
  });

  it('increases with field of view', () => {
    const cameraZ = 10;
    const height = 1000;
    
    const narrowUnits = unitsPerPixel(cameraZ, 30, height);
    const wideUnits = unitsPerPixel(cameraZ, 60, height);
    expect(wideUnits).toBeGreaterThan(narrowUnits);
  });

  it('decreases with viewport height', () => {
    const cameraZ = 10;
    const fov = 45;
    
    const smallUnits = unitsPerPixel(cameraZ, fov, 500);
    const largeUnits = unitsPerPixel(cameraZ, fov, 1000);
    expect(smallUnits).toBeGreaterThan(largeUnits);
  });

  it('handles minimum viewport height', () => {
    expect(unitsPerPixel(10, 45, 0)).toBe(unitsPerPixel(10, 45, 1));
  });
});
