import { describe, expect, it } from 'vitest';
import { linesFromPixels } from '../src/engine/drawing';
import { crc32, makeZip } from '../src/engine/zip';

describe('zip export', () => {
  it('crc32 matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('writes a valid stored zip that reads back byte-for-byte', async () => {
    const files = [
      { name: 'Little/Apple.png', data: new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])]) },
      { name: 'Big/Türkiye flag.png', data: new Blob([new Uint8Array(5000).map((_, i) => i % 251)]) },
    ];
    const zip = new Uint8Array(await (await makeZip(files, new Date(2026, 10, 19, 10, 30, 0))).arrayBuffer());
    const v = new DataView(zip.buffer);
    // end of central directory
    const eocd = zip.length - 22;
    expect(v.getUint32(eocd, true)).toBe(0x06054b50);
    expect(v.getUint16(eocd + 10, true)).toBe(2);
    let cd = v.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    for (const f of files) {
      expect(v.getUint32(cd, true)).toBe(0x02014b50);
      const size = v.getUint32(cd + 24, true), nameLen = v.getUint16(cd + 28, true), off = v.getUint32(cd + 42, true);
      expect(dec.decode(zip.subarray(cd + 46, cd + 46 + nameLen))).toBe(f.name);
      // local header points at the same bytes
      expect(v.getUint32(off, true)).toBe(0x04034b50);
      const start = off + 30 + v.getUint16(off + 26, true);
      const body = zip.subarray(start, start + size);
      expect(body).toEqual(new Uint8Array(await f.data.arrayBuffer()));
      expect(v.getUint32(cd + 16, true)).toBe(crc32(body));
      cd += 46 + nameLen;
    }
  });
});

describe('photo of a drawing -> line art', () => {
  const W = 600, H = 450;
  /** uneven "paper" (dark corner like a shadow), a pen circle, pencil specks, a dark desk strip at the edge */
  function photo() {
    const px = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const g = 235 - (70 * (x + y)) / (W + H); // light falls off across the sheet
      const o = (y * W + x) * 4;
      px[o] = px[o + 1] = px[o + 2] = g;
      px[o + 3] = 255;
    }
    const dark = (x: number, y: number, g = 40) => {
      const o = (y * W + x) * 4;
      px[o] = px[o + 1] = px[o + 2] = g;
    };
    for (let a = 0; a < Math.PI * 2; a += 0.002) {
      for (let t = -2; t <= 2; t++) dark(Math.round(300 + (120 + t) * Math.cos(a)), Math.round(220 + (120 + t) * Math.sin(a)));
    }
    for (const [x, y] of [[80, 60], [520, 400], [500, 90]]) dark(x, y); // specks
    for (let y = 0; y < H; y++) for (let x = W - 40; x < W; x++) dark(x, y, 30); // desk showing at the right
    return px;
  }

  it('keeps the pen lines, drops specks and the desk, leaves the inside empty', () => {
    const art = linesFromPixels(photo(), W, H);
    const ink = (x: number, y: number) => art.rgba[(y * W + x) * 4 + 3] > 0;
    expect(ink(300 + 120, 220)).toBe(true); // on the circle (dark side of the sheet too)
    expect(ink(300 - 120, 220)).toBe(true);
    expect(ink(300, 220 - 120)).toBe(true);
    expect(ink(300, 220)).toBe(false); // inside
    expect(ink(80, 60)).toBe(false); // speck
    expect(ink(W - 10, 200)).toBe(false); // desk strip
    expect(art.inkRatio).toBeGreaterThan(0.005);
    expect(art.inkRatio).toBeLessThan(0.05);
  });
});
