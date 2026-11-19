// "My drawings": turn a photo of a child's paper drawing into clean line art.
// Adaptive threshold (copes with uneven light), speck removal, drop big dark areas touching the
// photo edge (desk, shadows), then thicken the lines a little so regions close up.
import { components, dilate } from './segment';

export const DRAW_MAX = 1000;

export interface LineArt {
  w: number;
  h: number;
  /** black lines on transparent */
  rgba: Uint8ClampedArray;
  /** share of pixels that ended up as ink (sanity check for the preview) */
  inkRatio: number;
}

export function extractLines(src: CanvasImageSource, iw: number, ih: number): LineArt {
  const sc = Math.min(1, DRAW_MAX / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * sc)), h = Math.max(1, Math.round(ih * sc)), n = w * h;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.fillStyle = '#fff';
  x.fillRect(0, 0, w, h);
  x.drawImage(src, 0, 0, w, h);
  const px = x.getImageData(0, 0, w, h).data;
  return linesFromPixels(px, w, h);
}

export function linesFromPixels(px: Uint8ClampedArray, w: number, h: number): LineArt {
  const n = w * h;
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  // integral image for local means
  const W1 = w + 1;
  const integ = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x];
      integ[(y + 1) * W1 + x + 1] = integ[y * W1 + x + 1] + row;
    }
  }
  const half = Math.max(7, Math.round(Math.max(w, h) / 24));
  const T = 0.17;
  const ink = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - half), y1 = Math.min(h, y + half + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half), x1 = Math.min(w, x + half + 1);
      const sum = integ[y1 * W1 + x1] - integ[y0 * W1 + x1] - integ[y1 * W1 + x0] + integ[y0 * W1 + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const g = gray[y * w + x];
      if (g < mean * (1 - T) && g < 215) ink[y * w + x] = 1;
    }
  }
  // remove specks and big dark areas touching the photo edge
  const { lab, count } = components(Int16Array.from(ink, (v) => (v ? 0 : -1)), w, h);
  const area = new Int32Array(count + 1), edge = new Uint8Array(count + 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = lab[y * w + x];
    if (!l) continue;
    area[l]++;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge[l] = 1;
  }
  const minArea = Math.max(25, Math.round(n * 0.00004));
  for (let i = 0; i < n; i++) {
    const l = lab[i];
    if (l && (area[l] < minArea || (edge[l] && area[l] > n * 0.02))) ink[i] = 0;
  }
  const thick = dilate(ink, w, h, 1);
  const rgba = new Uint8ClampedArray(n * 4);
  let inkCount = 0;
  for (let i = 0; i < n; i++) {
    if (!thick[i]) continue;
    inkCount++;
    rgba[i * 4] = 34;
    rgba[i * 4 + 1] = 34;
    rgba[i * 4 + 2] = 40;
    rgba[i * 4 + 3] = 255;
  }
  return { w, h, rgba, inkRatio: inkCount / n };
}

export function lineArtCanvas(a: LineArt, background?: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = a.w;
  c.height = a.h;
  const x = c.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = a.w;
  tmp.height = a.h;
  tmp.getContext('2d')!.putImageData(new ImageData(a.rgba as Uint8ClampedArray<ArrayBuffer>, a.w, a.h), 0, 0);
  if (background) {
    x.fillStyle = background;
    x.fillRect(0, 0, a.w, a.h);
  }
  x.drawImage(tmp, 0, 0);
  return c;
}

export const canvasBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'));
