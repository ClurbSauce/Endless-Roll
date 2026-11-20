/**
 * Drag/pan handling for sphere navigation.
 * Converts pointer movement to hex-space displacement.
 */

import { distance, type Hex } from './hex';

/** Maximum drag distance in hex units */
export const DEFAULT_DRAG_LIMIT = 2;

/**
 * Calculate a drag offset from pointer movement.
 * The surface moves opposite to the drag direction.
 * 
 * @param start - Starting hex offset
 * @param dx - Horizontal pixel displacement
 * @param dy - Vertical pixel displacement  
 * @param unitsPerPixel - Conversion factor for screen to world units
 * @param cellSize - Hex cell size in world units
 * @param maxDistance - Maximum drag distance from origin
 */
export function dragOffset(
  start: Hex,
  dx: number,
  dy: number,
  unitsPerPixel: number,
  cellSize: number,
  maxDistance: number = DEFAULT_DRAG_LIMIT
): Hex {
  const r = start.r - dy * unitsPerPixel / (1.5 * cellSize);
  const q = start.q - dx * unitsPerPixel / (Math.sqrt(3) * cellSize) + dy * unitsPerPixel / (3 * cellSize);
  
  const length = distance({ q, r });
  const scale = length > maxDistance ? maxDistance / length : 1;
  
  return { q: q * scale, r: r * scale };
}

/**
 * Calculate units per pixel based on camera setup.
 * 
 * @param cameraZ - Camera Z position
 * @param fov - Field of view in degrees
 * @param viewportHeight - Viewport height in pixels
 */
export function unitsPerPixel(cameraZ: number, fov: number, viewportHeight: number): number {
  return 2 * cameraZ * Math.tan(fov * Math.PI / 360) / Math.max(1, viewportHeight);
}
