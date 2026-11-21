/**
 * Canvas texture generation for hex cells.
 * Renders cell content to a canvas texture for Three.js.
 * Includes automatic text wrapping and scaling for readability.
 */

import type { CellContent } from './types';

const TEXTURE_SIZE = 256;
const HEX_RADIUS = 123;
const HEX_INNER_WIDTH = 180;

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

/** Word wrap text to fit within a given width */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number, weight = '500'): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  ctx.font = `${weight} ${fontSize}px system-ui, sans-serif`;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/** Find optimal font size that fits text within constraints */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number,
  minFontSize: number,
  maxLines: number,
  weight = '500'
): { fontSize: number; lines: string[] } {
  let fontSize = baseFontSize;
  let lines: string[] = [];
  
  while (fontSize >= minFontSize) {
    lines = wrapText(ctx, text, maxWidth, fontSize, weight);
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    
    if (lines.length <= maxLines && totalHeight <= maxHeight) {
      let allFit = true;
      ctx.font = `${weight} ${fontSize}px system-ui, sans-serif`;
      for (const line of lines) {
        if (ctx.measureText(line).width > maxWidth) {
          allFit = false;
          break;
        }
      }
      if (allFit) break;
    }
    
    fontSize -= 2;
  }
  
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    if (lines.length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -3) + '...';
    }
  }
  
  return { fontSize: Math.max(fontSize, minFontSize), lines };
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
    fontSize: fontSizeMultiplier = 1,
  } = content;
  
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  
  drawHexPath(ctx, 128, 128, HEX_RADIUS);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  const hasIcon = !!icon;
  const hasSublabel = !!sublabel;
  
  const availableHeight = hasSublabel ? 70 : (hasIcon ? 80 : 100);
  const maxWidth = HEX_INNER_WIDTH - 20;
  
  if (label !== undefined) {
    const labelStr = String(label);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    
    const isNumeric = /^\d+$/.test(labelStr);
    const baseFontSize = isNumeric 
      ? Math.round(72 * fontSizeMultiplier)
      : Math.round((labelStr.length > 15 ? 32 : labelStr.length > 8 ? 40 : 52) * fontSizeMultiplier);
    const minFontSize = Math.round(24 * fontSizeMultiplier);
    const maxLines = isNumeric ? 1 : 2;
    
    const { fontSize, lines } = fitText(
      ctx,
      labelStr,
      maxWidth,
      availableHeight,
      baseFontSize,
      minFontSize,
      maxLines,
      '500'
    );
    
    ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
    const lineHeight = fontSize * 1.15;
    const totalHeight = lines.length * lineHeight;
    
    let startY = hasSublabel 
      ? 100 - totalHeight / 2 + lineHeight / 2
      : (hasIcon ? 110 : 128) - totalHeight / 2 + lineHeight / 2;
    
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 128, startY + i * lineHeight);
    }
  }
  
  if (sublabel) {
    const sublabelMaxWidth = HEX_INNER_WIDTH - 30;
    const baseSublabelSize = Math.round(32 * fontSizeMultiplier);
    const minSublabelSize = Math.round(20 * fontSizeMultiplier);
    
    const { fontSize: sublabelFontSize, lines: sublabelLines } = fitText(
      ctx,
      sublabel,
      sublabelMaxWidth,
      hasIcon ? 35 : 45,
      baseSublabelSize,
      minSublabelSize,
      hasIcon ? 1 : 2,
      '400'
    );
    
    ctx.font = `400 ${sublabelFontSize}px system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    
    const sublabelStartY = hasIcon ? 155 : 160;
    const sublabelLineHeight = sublabelFontSize * 1.1;
    
    for (let i = 0; i < sublabelLines.length; i++) {
      ctx.fillText(sublabelLines[i], 128, sublabelStartY + i * sublabelLineHeight);
    }
  }
  
  if (icon) {
    const iconY = label !== undefined ? (sublabel ? 195 : 190) : 128;
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
