/**
 * Endless Roll - An endless rolling sphere of hex cells.
 * 
 * @example
 * ```tsx
 * import { EndlessRoll } from 'endless-roll';
 * 
 * function App() {
 *   const [center, setCenter] = useState({ q: 0, r: 0 });
 *   
 *   return (
 *     <EndlessRoll
 *       center={center}
 *       onCenterChange={setCenter}
 *       cellProvider={(coord) => coord.q + coord.r}
 *       renderCell={(coord, data) => ({
 *         label: data,
 *         backgroundColor: '#f0f2e8',
 *       })}
 *     />
 *   );
 * }
 * ```
 */

// Core utilities (framework-agnostic)
export * from './core';

// React components
export {
  EndlessRoll,
  default,
  type EndlessRollProps,
  type EndlessRollHandle,
  type CellState,
  type CellData,
  type CellContent,
  type CellProvider,
  type RenderCell,
} from './react';
