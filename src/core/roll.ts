/**
 * Rolling animation state management for the sphere.
 * Handles smooth transitions between hex positions with easing.
 */

import { type Hex } from './hex';

/** A rolling animation from one hex position to another */
export interface Roll {
  from: Hex;
  to: Hex;
  start: number;
  duration: number;
}

/**
 * Smoothstep easing function for natural rolling motion.
 * @param t - Progress from 0 to 1
 */
export function ease(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/**
 * Sample the current position of a rolling animation.
 * Uses difference-first interpolation to avoid precision loss at large coordinates.
 * 
 * @param roll - The roll animation state
 * @param now - Current timestamp in milliseconds
 */
export function sampleRoll(roll: Roll, now: number): Hex {
  const t = roll.duration <= 0 ? 1 : ease((now - roll.start) / roll.duration);
  return {
    q: roll.from.q + (roll.to.q - roll.from.q) * t,
    r: roll.from.r + (roll.to.r - roll.from.r) * t,
  };
}

/**
 * Check if a roll animation is still in progress.
 */
export function isRolling(roll: Roll, now: number): boolean {
  return now < roll.start + roll.duration;
}

/**
 * Create a new roll targeting a destination from the current position.
 * 
 * @param currentRoll - The current roll state
 * @param to - Target hex coordinate
 * @param now - Current timestamp
 * @param duration - Animation duration in ms (0 for instant)
 */
export function retargetRoll(currentRoll: Roll, to: Hex, now: number, duration: number): Roll {
  return {
    from: sampleRoll(currentRoll, now),
    to,
    start: now,
    duration,
  };
}

/**
 * Create a snap roll that instantly moves to a position.
 */
export function snapRoll(to: Hex, now: number): Roll {
  return {
    from: to,
    to,
    start: now,
    duration: 0,
  };
}
