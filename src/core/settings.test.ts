import { describe, expect, it } from 'vitest';
import { validateSettings, DEFAULT_SETTINGS, SETTING_RANGES } from './settings';

describe('validateSettings', () => {
  it('returns defaults for empty input', () => {
    expect(validateSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('preserves valid values', () => {
    const custom = {
      sphereRadius: 6,
      cameraDistance: 10,
      perspective: 50,
      cellSize: 1.2,
      duration: 500,
      visibleRings: 3,
    };
    expect(validateSettings(custom)).toEqual(custom);
  });

  it('clamps values to valid ranges', () => {
    const result = validateSettings({
      sphereRadius: 1, // below min of 2
      cameraDistance: 20, // above max of 15
      perspective: 10, // below min of 25
      cellSize: 2, // above max of 1.4
      duration: -100, // below min of 0
      visibleRings: 10, // above max of 5
    });
    
    expect(result.sphereRadius).toBe(SETTING_RANGES.sphereRadius.min);
    expect(result.cameraDistance).toBe(SETTING_RANGES.cameraDistance.max);
    expect(result.perspective).toBe(SETTING_RANGES.perspective.min);
    expect(result.cellSize).toBe(SETTING_RANGES.cellSize.max);
    expect(result.duration).toBe(SETTING_RANGES.duration.min);
    expect(result.visibleRings).toBe(SETTING_RANGES.visibleRings.max);
  });

  it('fills missing values with defaults', () => {
    const result = validateSettings({ sphereRadius: 5 });
    expect(result.sphereRadius).toBe(5);
    expect(result.cameraDistance).toBe(DEFAULT_SETTINGS.cameraDistance);
    expect(result.perspective).toBe(DEFAULT_SETTINGS.perspective);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('has values within valid ranges', () => {
    expect(DEFAULT_SETTINGS.sphereRadius).toBeGreaterThanOrEqual(SETTING_RANGES.sphereRadius.min);
    expect(DEFAULT_SETTINGS.sphereRadius).toBeLessThanOrEqual(SETTING_RANGES.sphereRadius.max);
    expect(DEFAULT_SETTINGS.cameraDistance).toBeGreaterThanOrEqual(SETTING_RANGES.cameraDistance.min);
    expect(DEFAULT_SETTINGS.cameraDistance).toBeLessThanOrEqual(SETTING_RANGES.cameraDistance.max);
    expect(DEFAULT_SETTINGS.perspective).toBeGreaterThanOrEqual(SETTING_RANGES.perspective.min);
    expect(DEFAULT_SETTINGS.perspective).toBeLessThanOrEqual(SETTING_RANGES.perspective.max);
    expect(DEFAULT_SETTINGS.cellSize).toBeGreaterThanOrEqual(SETTING_RANGES.cellSize.min);
    expect(DEFAULT_SETTINGS.cellSize).toBeLessThanOrEqual(SETTING_RANGES.cellSize.max);
    expect(DEFAULT_SETTINGS.duration).toBeGreaterThanOrEqual(SETTING_RANGES.duration.min);
    expect(DEFAULT_SETTINGS.duration).toBeLessThanOrEqual(SETTING_RANGES.duration.max);
  });
});
