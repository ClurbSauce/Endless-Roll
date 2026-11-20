import { describe, expect, it } from 'vitest';
import { directions, key } from './hex';
import { ease, sampleRoll, isRolling, retargetRoll, snapRoll, type Roll } from './roll';

describe('ease function', () => {
  it('returns 0 at start and 1 at end', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
  });

  it('clamps values outside [0,1]', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(-100)).toBe(0);
    expect(ease(100)).toBe(1);
  });

  it('is monotonically increasing', () => {
    let prev = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      const v = ease(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('has symmetric derivative around 0.5', () => {
    expect(ease(0.5)).toBe(0.5);
  });
});

describe('sampleRoll', () => {
  it('reaches exact neighbor in all six directions and reverses without drift', () => {
    const from = { q: 1000000, r: -1000000 };
    
    for (const d of directions) {
      const to = { q: from.q + d.q, r: from.r + d.r };
      const roll: Roll = { from, to, start: 100, duration: 400 };
      
      expect(sampleRoll(roll, 100)).toEqual(from);
      expect(sampleRoll(roll, 500)).toEqual(to);
      expect(sampleRoll(roll, 300)).toEqual({ q: from.q + d.q / 2, r: from.r + d.r / 2 });
      
      const reverse: Roll = { from: to, to: from, start: 500, duration: 400 };
      expect(sampleRoll(reverse, 900)).toEqual(from);
      expect(key(sampleRoll(roll, 1000))).toBe(key(to));
    }
  });

  it('retargets from in-flight origin and supports zero duration', () => {
    const initial: Roll = { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, start: 0, duration: 400 };
    const at = sampleRoll(initial, 200);
    
    const retarget: Roll = { from: at, to: { q: 1, r: 1 }, start: 200, duration: 400 };
    expect(sampleRoll(retarget, 200)).toEqual(at);
    expect(sampleRoll(retarget, 600)).toEqual(retarget.to);
    
    expect(sampleRoll({ ...retarget, duration: 0 }, 200)).toEqual(retarget.to);
  });
});

describe('isRolling', () => {
  it('returns true during animation', () => {
    const roll: Roll = { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, start: 100, duration: 400 };
    expect(isRolling(roll, 100)).toBe(true);
    expect(isRolling(roll, 300)).toBe(true);
    expect(isRolling(roll, 499)).toBe(true);
  });

  it('returns false after animation completes', () => {
    const roll: Roll = { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, start: 100, duration: 400 };
    expect(isRolling(roll, 500)).toBe(false);
    expect(isRolling(roll, 600)).toBe(false);
  });

  it('returns false for zero duration', () => {
    const roll: Roll = { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, start: 100, duration: 0 };
    expect(isRolling(roll, 100)).toBe(false);
  });
});

describe('retargetRoll', () => {
  it('creates new roll from current position', () => {
    const current: Roll = { from: { q: 0, r: 0 }, to: { q: 2, r: 0 }, start: 0, duration: 400 };
    const retargeted = retargetRoll(current, { q: 1, r: 1 }, 200, 300);
    
    expect(retargeted.from).toEqual(sampleRoll(current, 200));
    expect(retargeted.to).toEqual({ q: 1, r: 1 });
    expect(retargeted.start).toBe(200);
    expect(retargeted.duration).toBe(300);
  });
});

describe('snapRoll', () => {
  it('creates instant roll to position', () => {
    const roll = snapRoll({ q: 5, r: -3 }, 1000);
    expect(roll.from).toEqual({ q: 5, r: -3 });
    expect(roll.to).toEqual({ q: 5, r: -3 });
    expect(roll.duration).toBe(0);
    expect(sampleRoll(roll, 1000)).toEqual({ q: 5, r: -3 });
  });
});
