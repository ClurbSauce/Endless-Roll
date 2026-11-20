/**
 * Canvas texture generation for hex cells.
 * Renders cell content to a canvas texture for Three.js.
 */

import type { CellContent } from './types';

const TEXTURE_SIZE = 256;
const HEX_RADIUS = 123;

/** Draw a pointy-top hexagon path */
function drawHexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (60 * i - 30) * Math.PI / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy - radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draw an icon in the cell */
function drawIcon(ctx: CanvasRenderingContext2D, icon: CellContent['icon'], x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  switch (icon) {
    case 'dot':
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const outerX = x + 10 * Math.cos(angle);
        const outerY = y + 10 * Math.sin(angle);
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        ctx.lineTo(x + 5 * Math.cos(innerAngle), y + 5 * Math.sin(innerAngle));
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'check':
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x - 2, y + 6);
      ctx.lineTo(x + 8, y - 6);
      ctx.stroke();
      break;
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x + 2, y - 4);
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + 2, y + 4);
      ctx.stroke();
      break;
  }
}

/** Create a canvas texture for a cell */
export function createCellTexture(content: CellContent): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  const {
    label,
    sublabel,
    backgroundColor = '#f0f2e8',
    textColor = '#69785d',
    outlineColor = '#d4dac9',
    icon,
    fontSize = 1,
  } = content;
  
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  
  // Hex outline
  drawHexPath(ctx, 128, 128, HEX_RADIUS);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Label
  if (label !== undefined) {
    const labelStr = String(label);
    const baseFontSize = labelStr.length > 10 ? 36 : labelStr.length > 5 ? 48 : labelStr.length > 2 ? 60 : 72;
    ctx.font = `500 ${Math.round(baseFontSize * fontSize)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    
    const labelY = sublabel ? 110 : 128;
    ctx.fillText(labelStr, 128, labelY);
    
    // Sublabel
    if (sublabel) {
      ctx.font = `400 ${Math.round(28 * fontSize)}px system-ui, sans-serif`;
      ctx.fillText(sublabel.slice(0, 20), 128, 160);
    }
  }
  
  // Icon
  if (icon) {
    const iconY = label !== undefined ? 190 : 128;
    drawIcon(ctx, icon, 128, iconY, textColor);
  }
  
  return canvas;
}

/** Generate a signature string for content to detect changes */
export function contentSignature(content: CellContent): string {
  return JSON.stringify([
    content.label,
    content.sublabel,
    content.backgroundColor,
    content.textColor,
    content.outlineColor,
    content.icon,
    content.fontSize,
  ]);
}
