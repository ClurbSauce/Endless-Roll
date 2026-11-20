/**
 * Configuration settings for the sphere renderer.
 */

/** Rendering settings for the endless sphere */
export interface SphereSettings {
  /** Sphere radius - smaller values increase curvature (default: 4.5) */
  sphereRadius: number;
  
  /** Camera distance multiplier (default: 9) */
  cameraDistance: number;
  
  /** Camera field of view in degrees (default: 45) */
  perspective: number;
  
  /** Hex cell size in world units (default: 1) */
  cellSize: number;
  
  /** Roll animation duration in milliseconds (default: 380) */
  duration: number;
  
  /** Number of hex rings to display around center (default: 2) */
  visibleRings: number;
}

/** Default sphere settings tuned for typical displays */
export const DEFAULT_SETTINGS: SphereSettings = {
  sphereRadius: 4.5,
  cameraDistance: 9,
  perspective: 45,
  cellSize: 1,
  duration: 380,
  visibleRings: 2,
};

/** Validate and clamp settings to reasonable ranges */
export function validateSettings(settings: Partial<SphereSettings>): SphereSettings {
  return {
    sphereRadius: clamp(settings.sphereRadius ?? DEFAULT_SETTINGS.sphereRadius, 2, 12),
    cameraDistance: clamp(settings.cameraDistance ?? DEFAULT_SETTINGS.cameraDistance, 6, 15),
    perspective: clamp(settings.perspective ?? DEFAULT_SETTINGS.perspective, 25, 70),
    cellSize: clamp(settings.cellSize ?? DEFAULT_SETTINGS.cellSize, 0.6, 1.4),
    duration: clamp(settings.duration ?? DEFAULT_SETTINGS.duration, 0, 1000),
    visibleRings: clamp(settings.visibleRings ?? DEFAULT_SETTINGS.visibleRings, 1, 5),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Setting slider configuration for UI controls */
export const SETTING_RANGES = {
  sphereRadius: { min: 2, max: 12, step: 0.1, unit: ' units (smaller = more curved)' },
  cameraDistance: { min: 6, max: 15, step: 0.1, unit: ' relative units' },
  perspective: { min: 25, max: 70, step: 1, unit: '° field of view' },
  cellSize: { min: 0.6, max: 1.4, step: 0.05, unit: ' units' },
  duration: { min: 0, max: 1000, step: 20, unit: ' ms' },
  visibleRings: { min: 1, max: 5, step: 1, unit: ' rings' },
} as const;
