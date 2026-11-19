// Pure image-segmentation helpers. No DOM here: typed arrays in, typed arrays out,
// so the same code runs in the browser, in a worker, and in Node tests.

export interface Region {
  id: number;
  area: number;
  /** bounding box, x1/y1 exclusive */
  x0: number; y0: number; x1: number; y1: number;
  /** deepest interior point: where hints, sparkles and the "magic" bloom start */
  ax: number; ay: number;
  /** touches the image edge */
  border: boolean;
  /** target colour, #rrggbb */
  color: string;
  /** too small / hidden under the lines to colour by hand: shown pre-coloured, not required */
  fixed: boolean;
  /** not required for completion (picture background) */
  optional: boolean;
}

export interface Segmented {
  w: number;
  h: number;
  /** region id (1..n) for every pixel; 0 never appears after fillGaps */
  labels: Uint16Array;
  regions: Region[]; // regions[id - 1]
  /** RGBA for the outline layer drawn on top of the paint */
  outline: Uint8ClampedArray;
}

/** Binary dilation with a (2r+1)^2 square, via separable running sums. O(N). */
export function dilate(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return src.slice();
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = 0; x < r && x < w; x++) sum += src[row + x];
    for (let x = 0; x < w; x++) {
      if (x + r < w) sum += src[row + x + r];
      if (x - r - 1 >= 0) sum -= src[row + x - r - 1];
      tmp[row + x] = sum > 0 ? 1 : 0;
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = 0; y < r && y < h; y++) sum += tmp[y * w + x];
    for (let y = 0; y < h; y++) {
      if (y + r < h) sum += tmp[(y + r) * w + x];
      if (y - r - 1 >= 0) sum -= tmp[(y - r - 1) * w + x];
      out[y * w + x] = sum > 0 ? 1 : 0;
    }
  }
  return out;
}

/**
 * 4-connected components. cls[i] < 0 = barrier; neighbours join only if their class is equal
 * (one class for line art, a palette index per pixel for flags).
 */
export function components(cls: Int16Array, w: number, h: number): { lab: Int32Array; count: number } {
  const n = w * h;
  const lab = new Int32Array(n);
  const parent = new Int32Array(n + 1);
  let next = 1;
  const find = (a: number) => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = cls[i];
      if (c < 0) continue;
      const up = y > 0 && cls[i - w] === c ? lab[i - w] : 0;
      const left = x > 0 && cls[i - 1] === c ? lab[i - 1] : 0;
      if (!up && !left) {
        parent[next] = next;
        lab[i] = next++;
      } else if (up && left) {
        const a = find(up), b = find(left);
        if (a === b) lab[i] = a;
        else if (a < b) { parent[b] = a; lab[i] = a; }
        else { parent[a] = b; lab[i] = b; }
      } else lab[i] = up || left;
    }
  }
  const remap = new Int32Array(next);
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (!lab[i]) continue;
    const r = find(lab[i]);
    if (!remap[r]) remap[r] = ++count;
    lab[i] = remap[r];
  }
  return { lab, count };
}

/** Removes components smaller than minArea (they become 0). Returns kept count and which pixels were dropped. */
export function dropSmall(lab: Int32Array, count: number, minArea: number): { kept: number; small: Uint8Array } {
  const n = lab.length;
  const area = new Int32Array(count + 1);
  for (let i = 0; i < n; i++) area[lab[i]]++;
  const keep = new Int32Array(count + 1);
  let kept = 0;
  for (let id = 1; id <= count; id++) if (area[id] >= minArea) keep[id] = ++kept;
  const small = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const l = lab[i];
    if (l && !keep[l]) small[i] = 1;
    lab[i] = keep[l];
  }
  return { kept, small };
}

/** Grows labelled regions into every unlabelled pixel (multi-source BFS), so paint tucks under the lines. */
export function fillGaps(lab: Int32Array, w: number, h: number): void {
  const n = w * h;
  const q = new Int32Array(n);
  let head = 0, tail = 0;
  for (let i = 0; i < n; i++) if (lab[i]) q[tail++] = i;
  while (head < tail) {
    const i = q[head++];
    const x = i % w;
    const l = lab[i];
    if (x > 0 && !lab[i - 1]) { lab[i - 1] = l; q[tail++] = i - 1; }
    if (x < w - 1 && !lab[i + 1]) { lab[i + 1] = l; q[tail++] = i + 1; }
    if (i >= w && !lab[i - w]) { lab[i - w] = l; q[tail++] = i - w; }
    if (i < n - w && !lab[i + w]) { lab[i + w] = l; q[tail++] = i + w; }
  }
}

/** Area, bbox, border contact and an interior anchor (max distance to the region edge) per region. */
export function regionStats(lab: Int32Array, w: number, h: number, count: number): Region[] {
  const n = w * h;
  const regions: Region[] = [];
  for (let id = 1; id <= count; id++) {
    regions.push({ id, area: 0, x0: w, y0: h, x1: 0, y1: 0, ax: 0, ay: 0, border: false, color: '#ffffff', fixed: false, optional: false });
  }
  // distance from region boundaries via BFS; seeds = pixels on an edge between labels or on the image border
  const dist = new Uint16Array(n).fill(65535);
  const q = new Int32Array(n);
  let head = 0, tail = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const l = lab[i];
      if (!l) continue;
      const r = regions[l - 1];
      r.area++;
      if (x < r.x0) r.x0 = x;
      if (y < r.y0) r.y0 = y;
      if (x + 1 > r.x1) r.x1 = x + 1;
      if (y + 1 > r.y1) r.y1 = y + 1;
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (edge) r.border = true;
      if (edge || lab[i - 1] !== l || lab[i + 1] !== l || lab[i - w] !== l || lab[i + w] !== l) {
        dist[i] = 0;
        q[tail++] = i;
      }
    }
  }
  while (head < tail) {
    const i = q[head++];
    const x = i % w;
    const d = dist[i] + 1;
    const l = lab[i];
    if (x > 0 && dist[i - 1] > d && lab[i - 1] === l) { dist[i - 1] = d; q[tail++] = i - 1; }
    if (x < w - 1 && dist[i + 1] > d && lab[i + 1] === l) { dist[i + 1] = d; q[tail++] = i + 1; }
    if (i >= w && dist[i - w] > d && lab[i - w] === l) { dist[i - w] = d; q[tail++] = i - w; }
    if (i < n - w && dist[i + w] > d && lab[i + w] === l) { dist[i + w] = d; q[tail++] = i + w; }
  }
  const best = new Int32Array(count + 1).fill(-1);
  for (let i = 0; i < n; i++) {
    const l = lab[i];
    if (!l) continue;
    if (dist[i] !== 65535 && dist[i] > best[l]) {
      best[l] = dist[i];
      regions[l - 1].ax = i % w;
      regions[l - 1].ay = (i / w) | 0;
    }
  }
  return regions;
}

const hex2 = (v: number) => v.toString(16).padStart(2, '0');
export const rgbHex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

export function hexRgb(hex: string): [number, number, number] {
  let s = hex.replace('#', '').trim();
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const v = parseInt(s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const lumAt = (px: Uint8ClampedArray, i: number) => {
  // composite over white so transparent pixels count as paper
  const a = px[i * 4 + 3] / 255;
  const r = px[i * 4] * a + 255 * (1 - a);
  const g = px[i * 4 + 1] * a + 255 * (1 - a);
  const b = px[i * 4 + 2] * a + 255 * (1 - a);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

export interface LineArtOptions {
  /** close gaps up to ~2r px in the line art */
  closeRadius?: number;
  /** regions smaller than this fraction of the page are shown pre-coloured instead */
  minAreaFrac?: number;
  /** colour for the region in the top-left corner (picture background) */
  background?: string;
}

/**
 * Line-art page: `line` is the drawing with colourable shapes filled white, `colored` the same drawing
 * with its intended colours. Regions come from `line`; target colours are sampled from `colored`.
 */
export function segmentLineArt(
  line: Uint8ClampedArray,
  colored: Uint8ClampedArray,
  w: number,
  h: number,
  opts: LineArtOptions = {},
): Segmented {
  const n = w * h;
  const closeRadius = opts.closeRadius ?? 1;
  const minArea = Math.max(24, Math.round(n * (opts.minAreaFrac ?? 0.0004)));

  const lum = new Float32Array(n);
  const ink = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    lum[i] = lumAt(line, i);
    ink[i] = lum[i] < 150 ? 1 : 0;
  }
  const barrier = dilate(ink, w, h, closeRadius);
  const cls = new Int16Array(n);
  for (let i = 0; i < n; i++) cls[i] = barrier[i] ? -1 : 0;

  const { lab, count } = components(cls, w, h);
  const { kept, small } = dropSmall(lab, count, minArea);
  fillGaps(lab, w, h);
  const regions = regionStats(lab, w, h, kept);

  // target colour = most common colour of the region's non-ink pixels in the coloured render
  const votes = new Map<number, number>();
  const exact = new Map<number, number>();
  const clear = new Int32Array(kept + 1); // samples where no shape was drawn (background)
  const solid = new Int32Array(kept + 1);
  for (let y = 1; y < h; y += 2) {
    for (let x = 1; x < w; x += 2) {
      const i = y * w + x;
      if (barrier[i] || small[i]) continue;
      const r = colored[i * 4], g = colored[i * 4 + 1], b = colored[i * 4 + 2];
      if (colored[i * 4 + 3] < 128) {
        clear[lab[i]]++;
        continue;
      }
      solid[lab[i]]++;
      const key = lab[i] * 32768 + ((r >> 3) << 10) + ((g >> 3) << 5) + (b >> 3);
      votes.set(key, (votes.get(key) ?? 0) + 1);
      if (!exact.has(key)) exact.set(key, (r << 16) | (g << 8) | b);
    }
  }
  const bestVote = new Int32Array(kept + 1);
  const bestRgb = new Int32Array(kept + 1).fill(0xffffff);
  for (const [key, v] of votes) {
    const id = Math.floor(key / 32768);
    if (v > bestVote[id]) {
      bestVote[id] = v;
      bestRgb[id] = exact.get(key)!;
    }
  }
  for (const r of regions) {
    const v = bestRgb[r.id];
    r.color = rgbHex((v >> 16) & 255, (v >> 8) & 255, v & 255);
  }
  // the background, and any pocket of background enclosed by lines (e.g. between a leaf and a stem),
  // is optional: a child shouldn't have to hunt for an invisible gap to finish a page
  const bgId = lab[2 * w + 2];
  for (const r of regions) {
    if (r.id === bgId || clear[r.id] > solid[r.id]) {
      r.optional = true;
      if (opts.background) r.color = opts.background;
    }
  }

  // outline layer: ink keeps its anti-aliased edge; dropped specks are "printed" in their own colour
  const outline = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (small[i] && lum[i] > 150) {
      outline[o] = colored[o];
      outline[o + 1] = colored[o + 1];
      outline[o + 2] = colored[o + 2];
      outline[o + 3] = 255;
      continue;
    }
    const a = Math.min(255, Math.max(0, (255 - lum[i]) * 1.2));
    if (a < 10) continue;
    outline[o] = 34;
    outline[o + 1] = 34;
    outline[o + 2] = 40;
    outline[o + 3] = a;
  }
  markHidden(regions, lab, outline, w, h);
  return { w, h, labels: Uint16Array.from(lab), regions, outline };
}

export interface FlagOptions {
  palette: string[];
  /** outline half-width in px */
  lineRadius?: number;
  minAreaFrac?: number;
}

/** Flag page: regions are the connected areas of each flag colour; outlines are drawn on the colour edges. */
export function segmentFlag(colored: Uint8ClampedArray, w: number, h: number, opts: FlagOptions): Segmented {
  const n = w * h;
  const pal = opts.palette.map(hexRgb);
  const minArea = Math.max(24, Math.round(n * (opts.minAreaFrac ?? 0.0006)));
  const cache = new Map<number, number>();
  const cls = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const a = colored[i * 4 + 3] / 255;
    const r = Math.round(colored[i * 4] * a + 255 * (1 - a));
    const g = Math.round(colored[i * 4 + 1] * a + 255 * (1 - a));
    const b = Math.round(colored[i * 4 + 2] * a + 255 * (1 - a));
    const key = (r << 16) | (g << 8) | b;
    let k = cache.get(key);
    if (k === undefined) {
      let bestD = Infinity;
      k = 0;
      for (let p = 0; p < pal.length; p++) {
        const d = (pal[p][0] - r) ** 2 + (pal[p][1] - g) ** 2 + (pal[p][2] - b) ** 2;
        if (d < bestD) { bestD = d; k = p; }
      }
      cache.set(key, k);
    }
    cls[i] = k;
  }
  const { lab, count } = components(cls, w, h);
  const { kept } = dropSmall(lab, count, minArea);
  fillGaps(lab, w, h);
  const regions = regionStats(lab, w, h, kept);

  // target colour = palette colour at the anchor
  for (const r of regions) {
    const k = cls[r.ay * w + r.ax];
    r.color = rgbHex(pal[k][0], pal[k][1], pal[k][2]);
  }

  // outline: label edges + a frame, thickened
  const edge = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) { edge[i] = 1; continue; }
      if (lab[i] !== lab[i + 1] || lab[i] !== lab[i + w]) edge[i] = 1;
    }
  }
  const r = opts.lineRadius ?? Math.max(2, Math.round(w / 400));
  const thick = dilate(edge, w, h, r);
  // soften with a 3x3 box blur on alpha for smoother lines
  const outline = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          s += thick[yy * w + xx];
        }
      }
      if (!s) continue;
      const o = (y * w + x) * 4;
      outline[o] = 34;
      outline[o + 1] = 34;
      outline[o + 2] = 40;
      outline[o + 3] = Math.round((s / 9) * 255);
    }
  }
  markHidden(regions, lab, outline, w, h);
  return { w, h, labels: Uint16Array.from(lab), regions, outline };
}

/**
 * Regions that are mostly hidden under the lines (thin slivers) can't be coloured by a child.
 * Mark them fixed and paint them into the outline layer in their target colour.
 */
function markHidden(regions: Region[], lab: Int32Array, outline: Uint8ClampedArray, w: number, h: number) {
  const n = w * h;
  const visible = new Int32Array(regions.length + 1);
  for (let i = 0; i < n; i++) if (outline[i * 4 + 3] < 128) visible[lab[i]]++;
  const minVisible = Math.max(64, Math.round(n * 0.0003));
  const fixedIds = new Set<number>();
  for (const r of regions) {
    if (!r.optional && visible[r.id] < minVisible) {
      r.fixed = true;
      fixedIds.add(r.id);
    }
  }
  if (!fixedIds.size) return;
  for (let i = 0; i < n; i++) {
    const l = lab[i];
    if (!fixedIds.has(l)) continue;
    const [cr, cg, cb] = hexRgb(regions[l - 1].color);
    const o = i * 4;
    const a = outline[o + 3] / 255;
    // colour sits under any line pixel
    outline[o] = Math.round(outline[o] * a + cr * (1 - a));
    outline[o + 1] = Math.round(outline[o + 1] * a + cg * (1 - a));
    outline[o + 2] = Math.round(outline[o + 2] * a + cb * (1 - a));
    outline[o + 3] = 255;
  }
}

const NAMED: Record<string, string> = {
  red: '#ff0000', gold: '#ffd700', white: '#ffffff', black: '#000000', yellow: '#ffff00',
  blue: '#0000ff', green: '#008000', orange: '#ffa500', navy: '#000080',
};

/** Unique fill colours used in an SVG (flag palettes), normalised to #rrggbb. */
export function svgPalette(svg: string): string[] {
  const found = new Set<string>();
  const re = /fill\s*[:=]\s*["']?(#[0-9a-fA-F]{3,6}\b|[a-zA-Z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    let c = m[1].toLowerCase();
    if (!c.startsWith('#')) {
      if (!NAMED[c]) continue; // none, url, currentColor…
      c = NAMED[c];
    }
    if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    found.add(c);
  }
  // SVG default fill is black
  if (/<(path|circle|rect|polygon|ellipse)(?![^>]*\bfill=)/i.test(svg) && !/<g[^>]*\bfill=/i.test(svg)) found.add('#000000');
  return [...found];
}
