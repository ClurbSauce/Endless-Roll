/**
 * Core hex grid and sphere projection utilities.
 * Framework-agnostic - can be used without React.
 */

export {
  type Hex,
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
} from './hex';

export {
  project,
  localPosition,
  hexTriangles,
  sphereNormal,
} from './projection';

export {
  type Roll,
  ease,
  sampleRoll,
  isRolling,
  retargetRoll,
  snapRoll,
} from './roll';

export {
  DEFAULT_DRAG_LIMIT,
  dragOffset,
  unitsPerPixel,
} from './drag';

export {
  type SphereSettings,
  DEFAULT_SETTINGS,
  validateSettings,
  SETTING_RANGES,
} from './settings';
