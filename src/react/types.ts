/**
 * Types for the React EndlessRoll component.
 */

import type { Hex, SphereSettings } from '../core';
import type { ReactNode } from 'react';

/** State passed to the renderCell callback */
export interface CellState {
  /** Whether this cell is at the center of the view */
  isCenter: boolean;
  /** Whether this cell is currently selected/active */
  isSelected: boolean;
  /** Distance from the center cell in hex steps */
  distanceFromCenter: number;
  /** Whether the cell is being hovered */
  isHovered: boolean;
}

/** Data for a single cell provided by the consumer */
export interface CellData<T = unknown> {
  /** Unique coordinate of this cell */
  coord: Hex;
  /** Custom data for this cell */
  data: T;
}

/** Function to render cell content */
export type RenderCell<T = unknown> = (
  coord: Hex,
  data: T | undefined,
  state: CellState
) => CellContent;

/** Content that can be rendered in a cell */
export interface CellContent {
  /** Primary text/number to display */
  label?: string | number;
  /** Secondary text */
  sublabel?: string;
  /** Background color (CSS color string) */
  backgroundColor?: string;
  /** Text color (CSS color string) */
  textColor?: string;
  /** Outline/border color */
  outlineColor?: string;
  /** Custom React node for more complex content (rendered to canvas) */
  icon?: 'dot' | 'star' | 'check' | 'arrow';
  /** Font size multiplier (default 1) */
  fontSize?: number;
}

/** Provider function for lazy cell data loading */
export type CellProvider<T = unknown> = (coord: Hex) => T | undefined;

/** Props for the EndlessRoll component */
export interface EndlessRollProps<T = unknown> {
  /** Current center coordinate of the sphere view */
  center: Hex;
  
  /** Called when the center changes (user navigation) */
  onCenterChange?: (coord: Hex) => void;
  
  /** Called when a cell is selected/clicked */
  onCellSelect?: (coord: Hex, data: T | undefined) => void;
  
  /** Render function for cell content */
  renderCell: RenderCell<T>;
  
  /** Provider for cell data - called lazily for visible cells */
  cellProvider: CellProvider<T>;
  
  /** Filter which cells are navigable (clickable). Defaults to immediate neighbors. */
  isNavigable?: (coord: Hex, center: Hex) => boolean;
  
  /** Sphere rendering settings */
  settings?: Partial<SphereSettings>;
  
  /** CSS class name for the container */
  className?: string;
  
  /** Accessible label for the sphere */
  ariaLabel?: string;
  
  /** Whether dragging to pan is enabled */
  enableDrag?: boolean;
  
  /** Maximum drag distance in hex units (default 2) */
  dragLimit?: number;
  
  /** Called when drag panning starts */
  onDragStart?: () => void;
  
  /** Called when drag panning ends */
  onDragEnd?: () => void;
  
  /** Key to force reset the view (e.g., when data changes completely) */
  resetKey?: string;
  
  /** Fallback content when WebGL is unavailable */
  fallback?: ReactNode;
  
  /** Called when WebGL fails to initialize */
  onWebGLError?: (error: string) => void;
}

/** Imperative handle for EndlessRoll */
export interface EndlessRollHandle {
  /** Navigate to a specific coordinate */
  navigateTo: (coord: Hex, animate?: boolean) => void;
  /** Get the current interpolated center position */
  getCurrentPosition: () => Hex;
  /** Force a re-render of all cells */
  refresh: () => void;
}
