// Drawing tools. Every look here is deterministic (seeded randomness, textures anchored to the page),
// so undo, reload and the time-lapse replay redraw a page pixel for pixel.
import { mulberry32 } from './paints';

export type Brush = 'marker' | 'felt' | 'crayon' | 'pencil' | 'paint' | 'glitter' | 'neon' | 'rainbow';
export type StampKind = 'star' | 'heart' | 'flower' | 'paw' | 'smile' | 'sparkle';
export type Tool = Brush | 'spray' | 'erase' | `stamp-${StampKind}`;

export interface BrushSpec {
  /** radius relative to the kid's marker */
  size: number;
  /** a tap fills the whole region and a scribble finishes it (marker, crayon) */
  fills?: boolean;
  /** counts towards a region being coloured in */
  covers?: boolean;
  /** drawn as one whole stroke and composited at the end (soft edges, glow, sparkles) */
  wet?: { alpha: number; pad: number };
}

export const BRUSHES: Record<Brush, BrushSpec> = {
  marker: { size: 1, fills: true, covers: true },
  felt: { size: 0.36 },
  crayon: { size: 0.9, fills: true, covers: true },
  pencil: { size: 0.16 },
  paint: { size: 1.1, covers: true, wet: { alpha: 0.62, pad: 0.4 } },
  glitter: { size: 0.75, covers: true, wet: { alpha: 1, pad: 0.2 } },
  neon: { size: 0.6, covers: true, wet: { alpha: 1, pad: 1.6 } },
  rainbow: { size: 0.9, covers: true },
};

export const STAMPS: StampKind[] = ['star', 'heart', 'flower', 'paw', 'smile', 'sparkle'];
export const isStamp = (t: Tool): t is `stamp-${StampKind}` => t.startsWith('stamp-');
export const isBrush = (t: Tool): t is Brush => t in BRUSHES;

type Style = string | CanvasPattern;

// ---------------------------------------------------------------- textures

/** paper grain to knock out of crayon and pencil strokes (white = removed) */
function grainTile(kind: 'crayon' | 'pencil') {
  const S = 192;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const rnd = mulberry32(kind === 'crayon' ? 91 : 37);
  const n = kind === 'crayon' ? 1100 : 2600;
  for (let i = 0; i < n; i++) {
    const px = rnd() * S, py = rnd() * S;
    x.globalAlpha = kind === 'crayon' ? 0.45 + rnd() * 0.45 : 0.25 + rnd() * 0.45;
    x.fillStyle = '#000';
    if (kind === 'crayon' && rnd() < 0.35) {
      // waxy streaks run mostly sideways
      const len = 3 + rnd() * 9, w = 0.8 + rnd() * 1.4;
      for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) x.fillRect(px + dx, py + dy, len, w);
    } else {
      const r = kind === 'crayon' ? 0.7 + rnd() * 1.6 : 0.5 + rnd() * 0.9;
      for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
        x.beginPath();
        x.arc(px + dx, py + dy, r, 0, Math.PI * 2);
        x.fill();
      }
    }
  }
  return c;
}

const tiles = new Map<string, HTMLCanvasElement>();
const grains = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();
function grain(ctx: CanvasRenderingContext2D, kind: 'crayon' | 'pencil') {
  let m = grains.get(ctx);
  if (!m) grains.set(ctx, (m = new Map()));
  let p = m.get(kind);
  if (!p) {
    let t = tiles.get(kind);
    if (!t) tiles.set(kind, (t = grainTile(kind)));
    p = ctx.createPattern(t, 'repeat')!;
    m.set(kind, p);
  }
  return p;
}

/** knock the paper grain out of what was just drawn inside the box */
export function knockGrain(s: CanvasRenderingContext2D, kind: 'crayon' | 'pencil', x: number, y: number, w: number, h: number) {
  s.save();
  s.globalCompositeOperation = 'destination-out';
  s.fillStyle = grain(s, kind);
  s.fillRect(x, y, w, h);
  s.restore();
}

export const hueColor = (h: number) => `hsl(${Math.round(((h % 360) + 360) % 360)} 88% 56%)`;
/** the rainbow brush cycles through the colours every this many radii of stroke */
const RAINBOW_CYCLE = 9;

// ---------------------------------------------------------------- segment brushes

function line(s: CanvasRenderingContext2D, R: number, ax: number, ay: number, bx: number, by: number) {
  s.lineWidth = 2 * R;
  s.lineCap = 'round';
  s.lineJoin = 'round';
  s.beginPath();
  if (ax === bx && ay === by) {
    s.arc(ax, ay, R, 0, Math.PI * 2);
    s.fill();
  } else {
    s.moveTo(ax, ay);
    s.lineTo(bx, by);
    s.stroke();
  }
}

/**
 * One piece of a stroke for the brushes that are drawn as you go (everything but the wet ones).
 * `dist` = stroke length before this piece (rainbow colour), `seed` = the stroke's seed.
 */
export function drawSegment(s: CanvasRenderingContext2D, b: Brush, style: Style, R: number, ax: number, ay: number, bx: number, by: number, dist: number, seed: number) {
  const x0 = Math.min(ax, bx) - R - 2, y0 = Math.min(ay, by) - R - 2, w = Math.abs(bx - ax) + 2 * R + 4, h = Math.abs(by - ay) + 2 * R + 4;
  if (b === 'rainbow') {
    const c = hueColor((seed % 360) + (dist / (R * RAINBOW_CYCLE)) * 360);
    s.fillStyle = s.strokeStyle = c;
    line(s, R, ax, ay, bx, by);
    return;
  }
  s.fillStyle = s.strokeStyle = style;
  if (b === 'pencil') {
    s.globalAlpha = 0.9;
    line(s, R, ax, ay, bx, by);
    s.globalAlpha = 1;
    knockGrain(s, 'pencil', x0, y0, w, h);
    return;
  }
  line(s, R, ax, ay, bx, by);
  if (b === 'crayon') knockGrain(s, 'crayon', x0, y0, w, h);
}

// ---------------------------------------------------------------- wet brushes (whole stroke)

function path(s: CanvasRenderingContext2D, pts: number[], R: number) {
  s.lineCap = 'round';
  s.lineJoin = 'round';
  s.beginPath();
  if (pts.length === 2) {
    s.arc(pts[0], pts[1], R, 0, Math.PI * 2);
    return true;
  }
  s.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]);
  return false;
}

function sparkleShape(s: CanvasRenderingContext2D, x: number, y: number, r: number) {
  s.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, rr = k % 2 ? r * 0.32 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (k) s.lineTo(px, py);
    else s.moveTo(px, py);
  }
  s.closePath();
  s.fill();
}

/** a whole stroke of a wet brush; `colorText` is the plain colour for glows (patterns have none) */
export function drawWet(s: CanvasRenderingContext2D, b: Brush, style: Style, colorText: string, R: number, pts: number[], seed: number) {
  if (b === 'paint') {
    // watercolour: soft edge; the stroke is laid down at once, so it never darkens itself, only other strokes
    s.filter = `blur(${Math.max(1, R * 0.22).toFixed(1)}px)`;
    s.fillStyle = s.strokeStyle = style;
    s.lineWidth = 2 * R * 0.88;
    if (path(s, pts, R * 0.88)) s.fill();
    else s.stroke();
    s.filter = 'none';
    return;
  }
  if (b === 'neon') {
    s.shadowColor = colorText.startsWith('#') ? colorText : '#ffffff';
    s.shadowBlur = R * 1.5;
    s.fillStyle = s.strokeStyle = style;
    s.lineWidth = R * 1.15;
    // twice, for a stronger glow
    if (path(s, pts, R * 0.58)) {
      s.fill();
      s.fill();
    } else {
      s.stroke();
      s.stroke();
    }
    s.shadowBlur = 0;
    s.fillStyle = s.strokeStyle = 'rgba(255,255,255,0.88)';
    s.lineWidth = R * 0.38;
    if (path(s, pts, R * 0.2)) s.fill();
    else s.stroke();
    return;
  }
  // glitter pen: the colour, then sparkles scattered along the line
  s.fillStyle = s.strokeStyle = style;
  s.lineWidth = 2 * R;
  if (path(s, pts, R)) s.fill();
  else s.stroke();
  const rnd = mulberry32(seed), step = R * 0.5;
  let carry = 0;
  const spark = (x: number, y: number) => {
    const a = rnd() * Math.PI * 2, d = R * 0.82 * Math.sqrt(rnd()), r = R * (0.14 + rnd() * 0.24);
    s.fillStyle = rnd() < 0.55 ? '#ffffff' : '#fff59d';
    s.globalAlpha = 0.75 + rnd() * 0.25;
    sparkleShape(s, x + Math.cos(a) * d, y + Math.sin(a) * d, r);
  };
  if (pts.length === 2) for (let k = 0; k < 4; k++) spark(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) {
    const ax = pts[i - 2], ay = pts[i - 1], bx = pts[i], by = pts[i + 1], len = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= len) {
      spark(ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len);
      t += step;
    }
    carry = len - (t - step);
  }
  s.globalAlpha = 1;
}

// ---------------------------------------------------------------- stamps

function stampPath(s: CanvasRenderingContext2D, k: StampKind, r: number) {
  s.beginPath();
  switch (k) {
    case 'star':
    case 'sparkle': {
      const n = k === 'star' ? 5 : 4, inner = k === 'star' ? 0.46 : 0.3;
      for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r * inner : r;
        if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      s.closePath();
      break;
    }
    case 'heart':
      s.moveTo(0, r * 0.9);
      s.bezierCurveTo(-r * 1.35, 0, -r * 0.72, -r * 1.05, 0, -r * 0.38);
      s.bezierCurveTo(r * 0.72, -r * 1.05, r * 1.35, 0, 0, r * 0.9);
      s.closePath();
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        s.moveTo(Math.cos(a) * r * 0.55 + r * 0.42, Math.sin(a) * r * 0.55);
        s.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42, 0, Math.PI * 2);
      }
      break;
    case 'paw':
      s.ellipse(0, r * 0.28, r * 0.5, r * 0.42, 0, 0, Math.PI * 2);
      for (const [x, y, rr] of [[-0.62, -0.18, 0.21], [-0.24, -0.62, 0.22], [0.24, -0.62, 0.22], [0.62, -0.18, 0.21]]) {
        s.moveTo(x * r + rr * r, y * r);
        s.arc(x * r, y * r, rr * r, 0, Math.PI * 2);
      }
      break;
    case 'smile':
      s.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      break;
  }
}

/** one stamp, centred on (x, y); the i-th stamp of a press gets its own small tilt */
export function drawStamp(s: CanvasRenderingContext2D, k: StampKind, style: Style, r: number, x: number, y: number, seed: number, i: number) {
  const tilt = (mulberry32(seed + i * 7919)() * 2 - 1) * 0.42;
  s.save();
  s.translate(x, y);
  s.rotate(k === 'smile' ? tilt * 0.4 : tilt);
  s.fillStyle = style;
  stampPath(s, k, r);
  s.fill();
  s.lineWidth = Math.max(2, r * 0.07);
  s.strokeStyle = 'rgba(30,20,40,0.45)';
  s.stroke();
  if (k === 'flower') {
    s.fillStyle = '#fff59d';
    s.beginPath();
    s.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    s.fill();
    s.stroke();
  }
  if (k === 'smile') {
    s.fillStyle = 'rgba(30,20,40,0.8)';
    for (const ex of [-0.32, 0.32]) {
      s.beginPath();
      s.ellipse(ex * r, -r * 0.2, r * 0.1, r * 0.14, 0, 0, Math.PI * 2);
      s.fill();
    }
    s.lineWidth = Math.max(2, r * 0.09);
    s.strokeStyle = 'rgba(30,20,40,0.8)';
    s.lineCap = 'round';
    s.beginPath();
    s.arc(0, r * 0.05, r * 0.46, 0.2 * Math.PI, 0.8 * Math.PI);
    s.stroke();
  }
  // sticker shine
  s.fillStyle = 'rgba(255,255,255,0.45)';
  s.beginPath();
  s.ellipse(-r * 0.32, -r * 0.38, r * 0.16, r * 0.09, -0.6, 0, Math.PI * 2);
  s.fill();
  s.restore();
}
