import { describe, expect, it } from 'vitest';
import { components, dilate, dropSmall, fillGaps, regionStats, segmentFlag, segmentLineArt, svgPalette } from '../src/engine/segment';

const W = 400, H = 300;

/** RGBA canvas helper: white page, black ink, optional colour fills */
function page() {
  const px = new Uint8ClampedArray(W * H * 4).fill(255);
  const set = (x: number, y: number, [r, g, b]: number[]) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const o = (y * W + x) * 4;
    px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: number[]) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c);
  };
  return { px, rect, set };
}

describe('segment primitives', () => {
  it('dilate closes a 3px gap so two halves stay separate', () => {
    const ink = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) if (y < 140 || y > 142) ink[y * W + 200] = 1; // vertical line with a 3px gap
    const cls = (barrier: Uint8Array) => Int16Array.from(barrier, (v) => (v ? -1 : 0));
    expect(components(cls(ink), W, H).count).toBe(1); // leaks
    const closed = dilate(ink, W, H, 2);
    expect(components(cls(closed), W, H).count).toBe(2);
  });

  it('drops specks and grows regions under the ink', () => {
    const ink = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) ink[y * W + 200] = 1;
    // a tiny enclosed 2x2 hole inside a 4x4 ink block on the left
    for (let y = 50; y < 54; y++) for (let x = 50; x < 54; x++) ink[y * W + x] = 1;
    ink[51 * W + 51] = 0;
    const cls = Int16Array.from(ink, (v) => (v ? -1 : 0));
    const { lab, count } = components(cls, W, H);
    expect(count).toBe(3);
    const { kept } = dropSmall(lab, count, 20);
    expect(kept).toBe(2);
    fillGaps(lab, W, H);
    expect(lab.every((v) => v > 0)).toBe(true);
    const stats = regionStats(lab, W, H, kept);
    expect(stats[0].area + stats[1].area).toBe(W * H);
    // anchors sit inside their own region
    for (const r of stats) expect(lab[r.ay * W + r.ax]).toBe(r.id);
  });
});

describe('segmentLineArt', () => {
  it('finds regions, samples target colours and marks the background optional', () => {
    const line = page();
    const col = page();
    // a box with a divider: two colourable cells inside a background
    const ink = [30, 30, 40];
    for (const p of [line, col]) {
      p.rect(100, 50, 300, 56, ink); p.rect(100, 244, 300, 250, ink);
      p.rect(100, 50, 106, 250, ink); p.rect(294, 50, 300, 250, ink);
      p.rect(197, 50, 203, 250, ink);
    }
    col.rect(106, 56, 197, 244, [229, 57, 53]); // red left cell
    col.rect(203, 56, 294, 244, [30, 136, 229]); // blue right cell
    const seg = segmentLineArt(line.px, col.px, W, H, { background: '#fff3b0' });
    expect(seg.regions.length).toBe(3);
    const colours = seg.regions.map((r) => r.color).sort();
    expect(colours).toEqual(['#1e88e5', '#e53935', '#fff3b0']);
    const bg = seg.regions.find((r) => r.optional)!;
    expect(bg.border).toBe(true);
    expect(seg.labels.every((v) => v > 0)).toBe(true);
  });
});

describe('segmentFlag', () => {
  it('splits a tricolour into three regions with exact colours', () => {
    const p = page();
    p.rect(0, 0, 133, H, [0, 146, 70]);
    p.rect(133, 0, 267, H, [255, 255, 255]);
    p.rect(267, 0, W, H, [206, 43, 55]);
    const seg = segmentFlag(p.px, W, H, { palette: ['#009246', '#fff', '#ce2b37'] });
    expect(seg.regions.map((r) => r.color)).toEqual(['#009246', '#ffffff', '#ce2b37']);
    expect(seg.regions.every((r) => !r.fixed)).toBe(true);
  });

  it('reads palettes including named colours', () => {
    expect(svgPalette('<path fill="#FFF"/><path fill="red"/><g fill="gold"><path/></g>').sort()).toEqual(['#ff0000', '#ffd700', '#ffffff']);
  });
});
