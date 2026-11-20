# Endless Roll 🌐

An endless rolling sphere of hex cells — a reusable, open-source TypeScript library for React.

Endless Roll renders an infinite hexagonal grid on a curved sphere surface with smooth rolling animations. Drop it into any app and supply your own cell content: numbers, cards, images, or anything else.

![Endless Roll Demo](https://via.placeholder.com/800x400?text=Demo+Screenshot)

## Features

- 🎯 **Framework-agnostic core** — hex math, projection, and animation logic work without React
- ⚛️ **Thin React layer** — `<EndlessRoll />` component with customizable cell rendering
- 🔄 **Smooth rolling animations** — cells move along curved trajectories with easing
- 📱 **Mobile-first** — touch drag to pan, tap to navigate, with mouse support
- ♿ **Accessible** — keyboard navigation, ARIA labels, reduced-motion support
- 🎨 **Customizable** — control curvature, camera, cell size, animation speed, and visible rings
- 📦 **Tree-shakeable** — import only what you need

## Installation

```bash
npm install endless-roll three react react-dom
```

The library has peer dependencies on `three`, `react`, and `react-dom`.

## Quick Start

```tsx
import { useState } from 'react';
import { EndlessRoll, type Hex } from 'endless-roll';

function App() {
  const [center, setCenter] = useState<Hex>({ q: 0, r: 0 });

  return (
    <EndlessRoll
      center={center}
      onCenterChange={setCenter}
      cellProvider={(coord) => coord.q * 10 + coord.r}
      renderCell={(coord, data, state) => ({
        label: data,
        backgroundColor: state.isCenter ? '#2563eb' : '#f0f2e8',
        textColor: state.isCenter ? '#ffffff' : '#374151',
      })}
    />
  );
}
```

## API Reference

### `<EndlessRoll />` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `Hex` | *required* | Current center coordinate `{ q, r }` |
| `onCenterChange` | `(coord: Hex) => void` | — | Called when user navigates to a new cell |
| `renderCell` | `(coord, data, state) => CellContent` | *required* | Render function for cell content |
| `cellProvider` | `(coord: Hex) => T` | *required* | Provides data for each cell lazily |
| `onCellSelect` | `(coord, data) => void` | — | Called when a cell is clicked |
| `isNavigable` | `(coord, center) => boolean` | Adjacent cells | Filter which cells can be navigated to |
| `settings` | `Partial<SphereSettings>` | Defaults | Rendering settings (see below) |
| `enableDrag` | `boolean` | `true` | Enable drag-to-pan |
| `dragLimit` | `number` | `2` | Maximum drag distance in hex units |
| `resetKey` | `string` | `''` | Force reset when this key changes |
| `className` | `string` | `''` | CSS class for container |
| `ariaLabel` | `string` | `'Interactive hex sphere'` | Accessible label |
| `fallback` | `ReactNode` | Error message | Content when WebGL unavailable |

### `CellContent` Object

The `renderCell` function returns an object describing how to draw the cell:

```ts
interface CellContent {
  label?: string | number;      // Primary text/number
  sublabel?: string;            // Secondary text
  backgroundColor?: string;     // CSS color
  textColor?: string;           // CSS color
  outlineColor?: string;        // CSS color
  icon?: 'dot' | 'star' | 'check' | 'arrow';
  fontSize?: number;            // Multiplier (default 1)
}
```

### `CellState` Object

The `renderCell` function receives state about the cell:

```ts
interface CellState {
  isCenter: boolean;           // Is this cell at the view center?
  isSelected: boolean;         // Is this cell selected?
  distanceFromCenter: number;  // Hex distance from center
  isHovered: boolean;          // Is the pointer over this cell?
}
```

### Sphere Settings

Configure the sphere appearance via the `settings` prop:

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `sphereRadius` | `4.5` | 2–12 | Sphere radius (smaller = more curved) |
| `cameraDistance` | `9` | 6–15 | Camera distance multiplier |
| `perspective` | `45` | 25–70 | Camera field of view in degrees |
| `cellSize` | `1` | 0.6–1.4 | Hex cell size |
| `duration` | `380` | 0–1000 | Roll animation duration in ms |
| `visibleRings` | `2` | 1–5 | Number of hex rings to display |

### Imperative Handle

Access component methods via `ref`:

```tsx
const rollRef = useRef<EndlessRollHandle>(null);

// Navigate programmatically
rollRef.current?.navigateTo({ q: 10, r: -5 });

// Get current interpolated position
const pos = rollRef.current?.getCurrentPosition();

// Force re-render all cells
rollRef.current?.refresh();
```

### Core Utilities

The core module can be used without React:

```ts
import { 
  disk,           // Get all hexes within radius
  ring,           // Get hexes at exact radius
  distance,       // Hex distance between two coords
  neighbors,      // Get 6 adjacent hexes
  key,            // Convert Hex to string key
  project,        // Project 2D point onto sphere
  sampleRoll,     // Sample rolling animation
} from 'endless-roll/core';
```

## Running the Demo

```bash
# Clone the repository
git clone https://github.com/ClurbSauce/Endless-Roll.git
cd Endless-Roll

# Install dependencies
npm install

# Run the demo
cd demo
npm install
npm run dev
```

The demo shows three content types:
- **Numbers** — A number maze-style grid with colored cells
- **Portfolio** — Project cards with titles and tech stacks
- **News** — Headlines with category badges

## Development

```bash
# Run tests
npm test

# Build the library
npm run build

# Type check
npm run typecheck
```

## How It Works

Endless Roll uses an **inverse gnomonic projection** to map an infinite hexagonal grid onto a sphere. Key implementation details:

1. **Local coordinate rebasing** — Instead of maintaining a global sphere, coordinates are rebased relative to the current center each frame. This avoids floating-point precision loss at large coordinates.

2. **Tessellated hexes** — Each hex is subdivided into 96 triangles before projection, so edges bend smoothly with the sphere surface.

3. **Rolling animations** — Moving between cells interpolates the local origin with smoothstep easing. The sphere surface appears to roll under the camera.

4. **Lazy cell loading** — Only visible cells (19 for 2 rings) are rendered. The `cellProvider` is called on-demand as cells enter view.

## Limitations

- **WebGL required** — Falls back to custom content when WebGL is unavailable
- **Canvas textures** — Cell content is rendered to canvas textures, limiting what can be displayed (no interactive elements inside cells)
- **Single content type** — All cells render with the same `renderCell` function; switch content types by changing the function
- **No infinite scroll events** — There's no built-in pagination; implement in your `cellProvider` if needed

## Credits

The projection math and rolling sphere concept originated in the [Hex-Number-Maze-MVP](https://github.com/ClurbSauce/Hex-Number-Maze-MVP) prototype.

## License

MIT © ClurbSauce
