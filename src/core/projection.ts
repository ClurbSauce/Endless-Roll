/**
 * Sphere projection math for displaying hex cells on a curved surface.
 * Uses inverse gnomonic projection to map a planar hex grid onto a sphere.
 */

import { pixel, type Hex } from './hex';

/**
 * Inverse gnomonic projection onto a sphere centered at (0, 0, -R).
 * Every finite planar point maps injectively onto the front hemisphere.
 * No longitude wrap, pole seam, or modulo coordinates.
 * 
 * @param x - Planar x coordinate
 * @param y - Planar y coordinate
 * @param radius - Sphere radius
 * @returns [x, y, z] position on the sphere
 */
export function project(x: number, y: number, radius: number): [number, number, number] {
  const scale = radius / Math.hypot(x, y, radius);
  return [x * scale, y * scale, radius * (scale - 1)];
}

/**
 * Calculate the local 2D position of a hex cell relative to an origin.
 * Uses pointy-top hex layout with y-axis flipped for Three.js conventions.
 * 
 * @param cell - The hex cell to position
 * @param origin - The current view origin (center of the sphere)
 * @param size - Hex cell size
 */
export function localPosition(cell: Hex, origin: Hex, size: number): { x: number; y: number } {
  const p = pixel({ q: cell.q - origin.q, r: cell.r - origin.r }, size);
  return { x: p.x, y: -p.y };
}

/**
 * Generate triangle vertices for a subdivided hex.
 * The hex is tessellated before projection so edges bend with the surface.
 * 
 * @param subdivisions - Number of subdivisions per hex edge (default 4)
 * @returns Flat array of 2D vertex coordinates [x1, y1, x2, y2, ...]
 */
export function hexTriangles(subdivisions = 4): number[] {
  const vertices: number[] = [];
  
  for (let side = 0; side < 6; side++) {
    const a = (side * 60 - 30) * Math.PI / 180;
    const b = a + Math.PI / 3;
    const u = [Math.cos(a), Math.sin(a)];
    const v = [Math.cos(b), Math.sin(b)];
    
    const point = (i: number, j: number) => [
      (i * u[0] + j * v[0]) / subdivisions,
      (i * u[1] + j * v[1]) / subdivisions,
    ];
    
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions - i; j++) {
        vertices.push(...point(i, j), ...point(i + 1, j), ...point(i, j + 1));
        if (i + j < subdivisions - 1) {
          vertices.push(...point(i + 1, j), ...point(i + 1, j + 1), ...point(i, j + 1));
        }
      }
    }
  }
  
  return vertices;
}

/**
 * Calculate sphere normals for a projected point.
 * The sphere is centered at (0, 0, -radius), so we compute the
 * direction from center to point and normalize it.
 * 
 * @param point - The [x, y, z] point on the sphere surface
 * @param radius - The sphere radius
 * @returns [nx, ny, nz] normalized normal vector
 */
export function sphereNormal(point: [number, number, number], radius: number): [number, number, number] {
  const dx = point[0];
  const dy = point[1];
  const dz = point[2] + radius;
  const len = Math.hypot(dx, dy, dz) || 1;
  return [dx / len, dy / len, dz / len];
}
