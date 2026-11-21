/**
 * EndlessRoll - A rolling sphere of hex cells for React.
 * 
 * Renders an infinite hex grid on a curved sphere surface with smooth rolling
 * animations. Content is provided lazily through a cellProvider and renderCell.
 */

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  type ForwardedRef,
} from 'react';
import * as THREE from 'three';
import {
  disk,
  key,
  distance,
  neighbors,
  roundHex,
  hexTriangles,
  localPosition,
  project,
  sphereNormal,
  sampleRoll,
  retargetRoll,
  snapRoll,
  dragOffset,
  unitsPerPixel,
  validateSettings,
  type Hex,
  type Roll,
} from '../core';
import { createCellTexture, contentSignature } from './texture';
import type {
  EndlessRollProps,
  EndlessRollHandle,
  CellContent,
  CellState,
} from './types';

interface Tile {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  signature: string;
  coord: Hex;
}

const COMPONENT_STYLES = `
.endless-roll {
  position: relative;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
.endless-roll-canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}
.endless-roll-canvas canvas {
  touch-action: none;
  -webkit-touch-callout: none;
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = COMPONENT_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

function EndlessRollInner<T>(
  props: EndlessRollProps<T>,
  ref: ForwardedRef<EndlessRollHandle>
) {
  const {
    center,
    settings: settingsInput,
    className = '',
    ariaLabel = 'Interactive hex sphere',
    enableDrag = true,
    dragLimit: dragLimitProp = 2,
    resetKey = '',
    fallback,
    onWebGLError,
    selected,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const latestProps = useRef(props);
  latestProps.current = props;
  
  const refreshRef = useRef<(() => void) | null>(null);
  const navigateRef = useRef<((coord: Hex, animate?: boolean) => void) | null>(null);
  const getPositionRef = useRef<(() => Hex) | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  const renderCellRef = useRef(props.renderCell);
  const cellProviderRef = useRef(props.cellProvider);
  const [renderVersion, setRenderVersion] = useState(0);
  
  useEffect(() => {
    if (renderCellRef.current !== props.renderCell || cellProviderRef.current !== props.cellProvider) {
      renderCellRef.current = props.renderCell;
      cellProviderRef.current = props.cellProvider;
      setRenderVersion(v => v + 1);
    }
  }, [props.renderCell, props.cellProvider]);
  
  const settings = validateSettings(settingsInput ?? {});

  useEffect(() => {
    injectStyles();
  }, []);

  useImperativeHandle(ref, () => ({
    navigateTo: (coord: Hex, animate = true) => {
      navigateRef.current?.(coord, animate);
      latestProps.current.onCenterChange?.(coord);
    },
    getCurrentPosition: () => getPositionRef.current?.() ?? center,
    refresh: () => refreshRef.current?.(),
  }), [center]);

  useEffect(() => {
    const container = containerRef.current!;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      const msg = 'WebGL is unavailable in this browser.';
      setError(msg);
      onWebGLError?.(msg);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xfcfcf7, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x889581, 1.7));
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(-3, 5, 8);
    scene.add(light);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
    const tiles = new Map<string, Tile>();
    const rawTriangles = hexTriangles();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let roll: Roll = snapRoll(latestProps.current.center, performance.now());
    let pan: Roll = snapRoll({ q: 0, r: 0 }, performance.now());
    let currentResetKey = latestProps.current.resetKey;
    let frame = 0;
    let width = 0;
    let height = 0;
    let disposed = false;
    let hoveredId: string | null = null;
    let isDragging = false;

    const disposeTile = (tile: Tile) => {
      scene.remove(tile.mesh);
      tile.mesh.geometry.dispose();
      tile.mesh.material.map?.dispose();
      tile.mesh.material.dispose();
    };

    const getContent = (coord: Hex, isCenter: boolean, isHovered: boolean): CellContent => {
      const p = latestProps.current;
      const data = p.cellProvider(coord);
      const selectedKey = p.selected ? key(p.selected) : null;
      const state: CellState = {
        isCenter,
        isSelected: selectedKey === key(coord),
        distanceFromCenter: distance(coord, p.center),
        isHovered,
      };
      return p.renderCell(coord, data, state);
    };

    function sync() {
      const p = latestProps.current;
      const now = performance.now();
      const s = validateSettings(p.settings ?? {});

      if (p.resetKey !== currentResetKey) {
        roll = snapRoll(p.center, now);
        pan = snapRoll({ q: 0, r: 0 }, now);
        currentResetKey = p.resetKey ?? '';
        press = null;
        isDragging = false;
      } else if (key(roll.to) !== key(p.center)) {
        const adjacent = distance(roll.to, p.center) === 1;
        const duration = adjacent && !reducedMotion.matches ? s.duration : 0;
        roll = retargetRoll(roll, p.center, now, duration);
      }

      const offset = roundHex(sampleRoll(pan, now));
      const viewCenter = { q: p.center.q + offset.q, r: p.center.r + offset.r };
      const extraRings = isDragging ? 2 : 0;
      const cells = disk(viewCenter, s.visibleRings + extraRings);
      const ids = new Set(cells.map(key));

      for (const [id, tile] of tiles) {
        if (!ids.has(id)) {
          disposeTile(tile);
          tiles.delete(id);
        }
      }

      for (const coord of cells) {
        const id = key(coord);
        const isCenter = id === key(p.center);
        const isHovered = id === hoveredId;
        const content = getContent(coord, isCenter, isHovered);
        const signature = contentSignature(content);
        
        let tile = tiles.get(id);
        if (!tile) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(new Float32Array((rawTriangles.length / 2) * 3), 3)
          );
          geometry.setAttribute(
            'normal',
            new THREE.Float32BufferAttribute(new Float32Array((rawTriangles.length / 2) * 3), 3)
          );
          geometry.setAttribute(
            'uv',
            new THREE.Float32BufferAttribute(rawTriangles.map(v => v / 2 + 0.5), 2)
          );
          
          const texture = new THREE.CanvasTexture(createCellTexture(content));
          texture.colorSpace = THREE.SRGBColorSpace;
          
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0,
            side: THREE.DoubleSide,
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          mesh.userData.id = id;
          mesh.frustumCulled = false;
          scene.add(mesh);
          
          tile = { mesh, signature, coord };
          tiles.set(id, tile);
        } else if (tile.signature !== signature) {
          tile.mesh.material.map?.dispose();
          const texture = new THREE.CanvasTexture(createCellTexture(content));
          texture.colorSpace = THREE.SRGBColorSpace;
          tile.mesh.material.map = texture;
          tile.signature = signature;
        }
        tile.coord = coord;
      }

      requestDraw();
    }

    function draw(now: number) {
      frame = 0;
      if (disposed) return;

      const p = latestProps.current;
      const s = validateSettings(p.settings ?? {});

      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      if (w !== width || h !== height) {
        width = w;
        height = h;
        renderer.setSize(w, h, false);
      }

      camera.aspect = w / h;
      camera.fov = s.perspective;
      
      const fovRad = s.perspective * Math.PI / 180;
      const extent = s.sphereRadius * (2 * s.visibleRings + 1) / 
        Math.hypot(2 * s.visibleRings + 1, s.sphereRadius);
      const fit = extent / Math.tan(fovRad / 2) / Math.min(1, w / h) + 1;
      camera.position.set(0, 0, fit * s.cameraDistance / 9);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const base = sampleRoll(roll, now);
      const offset = sampleRoll(pan, now);
      const origin = { q: base.q + offset.q, r: base.r + offset.r };

      const dragDistortionFactor = isDragging ? 0.7 : 1.0;
      const effectiveRadius = s.sphereRadius / dragDistortionFactor;

      for (const tile of tiles.values()) {
        const pos = tile.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        const normal = tile.mesh.geometry.getAttribute('normal') as THREE.BufferAttribute;
        const tileCenter = localPosition(tile.coord, origin, s.cellSize);

        for (let i = 0; i < rawTriangles.length; i += 2) {
          const point = project(
            tileCenter.x + rawTriangles[i] * s.cellSize * 0.94,
            tileCenter.y + rawTriangles[i + 1] * s.cellSize * 0.94,
            effectiveRadius
          );
          pos.setXYZ(i / 2, ...point);
          const n = sphereNormal(point, effectiveRadius);
          normal.setXYZ(i / 2, ...n);
        }
        pos.needsUpdate = true;
        normal.needsUpdate = true;
        tile.mesh.geometry.computeBoundingSphere();
      }

      renderer.render(scene, camera);

      if (now < roll.start + roll.duration || now < pan.start + pan.duration) {
        requestDraw();
      }
    }

    function requestDraw() {
      if (!frame && !disposed) {
        frame = requestAnimationFrame(draw);
      }
    }

    function pick(event: PointerEvent): string | undefined {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(
        [...tiles.values()].map(t => t.mesh),
        false
      );
      return intersects[0]?.object.userData.id as string | undefined;
    }

    let press: {
      x: number;
      y: number;
      id: number;
      offset: Hex;
      dragging: boolean;
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || press) return;
      press = {
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId,
        offset: sampleRoll(pan, performance.now()),
        dragging: false,
      };
      if (latestProps.current.enableDrag) {
        renderer.domElement.setPointerCapture(e.pointerId);
      }
    };

    const onPointerCancel = () => {
      if (press?.dragging) {
        isDragging = false;
        const now = performance.now();
        const s = validateSettings(latestProps.current.settings ?? {});
        const currentOffset = roundHex(sampleRoll(pan, now));
        const newCenter = {
          q: latestProps.current.center.q + currentOffset.q,
          r: latestProps.current.center.r + currentOffset.r,
        };
        pan = snapRoll({ q: 0, r: 0 }, now);
        if (key(newCenter) !== key(latestProps.current.center)) {
          roll = retargetRoll(roll, newCenter, now, reducedMotion.matches ? 0 : s.duration);
          latestProps.current.onCenterChange?.(newCenter);
        }
        latestProps.current.onDragEnd?.();
        sync();
      }
      press = null;
      renderer.domElement.style.cursor = 'default';
    };

    const onPointerUp = (e: PointerEvent) => {
      const start = press;
      press = null;
      
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }

      if (!start || start.id !== e.pointerId) return;

      if (start.dragging) {
        isDragging = false;
        const now = performance.now();
        const s = validateSettings(latestProps.current.settings ?? {});
        const currentOffset = roundHex(sampleRoll(pan, now));
        const newCenter = {
          q: latestProps.current.center.q + currentOffset.q,
          r: latestProps.current.center.r + currentOffset.r,
        };
        pan = snapRoll({ q: 0, r: 0 }, now);
        if (key(newCenter) !== key(latestProps.current.center)) {
          roll = retargetRoll(roll, newCenter, now, reducedMotion.matches ? 0 : s.duration);
          latestProps.current.onCenterChange?.(newCenter);
        }
        latestProps.current.onDragEnd?.();
        sync();
        return;
      }

      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) return;

      const id = pick(e);
      if (!id) return;

      const tile = tiles.get(id);
      if (!tile) return;

      const p = latestProps.current;
      const navigable = p.isNavigable?.(tile.coord, p.center) ?? distance(tile.coord, p.center) === 1;

      if (navigable) {
        const data = p.cellProvider(tile.coord);
        p.onSelectedChange?.(tile.coord);
        p.onCellSelect?.(tile.coord, data);
        p.onCenterChange?.(tile.coord);
      } else {
        const data = p.cellProvider(tile.coord);
        p.onSelectedChange?.(tile.coord);
        p.onCellSelect?.(tile.coord, data);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = latestProps.current;
      
      if (press && press.id === e.pointerId && p.enableDrag) {
        const dx = e.clientX - press.x;
        const dy = e.clientY - press.y;

        if (!press.dragging && Math.hypot(dx, dy) > 8) {
          press.dragging = true;
          isDragging = true;
          p.onDragStart?.();
        }

        if (press.dragging) {
          const s = validateSettings(p.settings ?? {});
          const units = unitsPerPixel(camera.position.z, camera.fov, height);
          const offset = dragOffset(press.offset, dx, dy, units, s.cellSize, p.dragLimit ?? dragLimitProp);
          pan = snapRoll(offset, performance.now());
          renderer.domElement.style.cursor = 'grabbing';
          sync();
          return;
        }
      }

      const id = pick(e);
      const prevHovered = hoveredId;
      hoveredId = id ?? null;
      
      if (id && id !== prevHovered) {
        const tile = tiles.get(id);
        if (tile) {
          const navigable = p.isNavigable?.(tile.coord, p.center) ?? distance(tile.coord, p.center) === 1;
          renderer.domElement.style.cursor = p.enableDrag 
            ? 'grab' 
            : navigable ? 'pointer' : 'default';
        }
      } else if (!id) {
        renderer.domElement.style.cursor = p.enableDrag ? 'grab' : 'default';
      }

      if (hoveredId !== prevHovered) {
        sync();
      }
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      const msg = 'WebGL context was lost.';
      setError(msg);
      latestProps.current.onWebGLError?.(msg);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointercancel', onPointerCancel);
    renderer.domElement.addEventListener('lostpointercapture', onPointerCancel);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });

    const resizeObserver = new ResizeObserver(requestDraw);
    resizeObserver.observe(container);

    refreshRef.current = sync;
    navigateRef.current = (coord: Hex, animate = true) => {
      const now = performance.now();
      const s = validateSettings(latestProps.current.settings ?? {});
      const duration = animate && !reducedMotion.matches ? s.duration : 0;
      roll = retargetRoll(roll, coord, now, duration);
      requestDraw();
    };
    getPositionRef.current = () => sampleRoll(roll, performance.now());

    sync();

    return () => {
      disposed = true;
      refreshRef.current = null;
      navigateRef.current = null;
      getPositionRef.current = null;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointercancel', onPointerCancel);
      renderer.domElement.removeEventListener('lostpointercapture', onPointerCancel);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);

      for (const tile of tiles.values()) {
        disposeTile(tile);
      }
      tiles.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    refreshRef.current?.();
  }, [
    center.q,
    center.r,
    settings.sphereRadius,
    settings.cameraDistance,
    settings.perspective,
    settings.cellSize,
    settings.duration,
    settings.visibleRings,
    resetKey,
    enableDrag,
    dragLimitProp,
    renderVersion,
    selected?.q,
    selected?.r,
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const p = latestProps.current;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const data = p.cellProvider(p.center);
      p.onSelectedChange?.(p.center);
      p.onCellSelect?.(p.center, data);
      return;
    }
    
    const directionMap: Record<string, number> = {
      'ArrowRight': 0,
      'ArrowUp': 1,
      'ArrowLeft': 3,
      'ArrowDown': 4,
    };
    
    if (e.key in directionMap) {
      e.preventDefault();
      const neighborList = neighbors(p.center);
      const dirIndex = directionMap[e.key];
      
      let targetIndex = dirIndex;
      if (e.key === 'ArrowUp') {
        targetIndex = e.shiftKey ? 2 : 1;
      } else if (e.key === 'ArrowDown') {
        targetIndex = e.shiftKey ? 5 : 4;
      }
      
      const target = neighborList[targetIndex];
      const navigable = p.isNavigable?.(target, p.center) ?? true;
      
      if (navigable) {
        const data = p.cellProvider(target);
        p.onSelectedChange?.(target);
        p.onCellSelect?.(target, data);
        p.onCenterChange?.(target);
      }
    }
  }, []);

  if (error) {
    return (
      <div className={`endless-roll endless-roll-error ${className}`} role="alert">
        {fallback ?? <p>{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`endless-roll ${className}`}
      role="application"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="endless-roll-canvas" ref={containerRef} />
    </div>
  );
}

export const EndlessRoll = forwardRef(EndlessRollInner) as <T = unknown>(
  props: EndlessRollProps<T> & { ref?: ForwardedRef<EndlessRollHandle> }
) => JSX.Element;

export default EndlessRoll;
