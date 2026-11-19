// Paints: a plain "#rrggbb" colour, or a special marker "p:<name>" drawn as a repeating pattern.
// Patterns are anchored to the canvas origin, so a replay redraws them pixel-for-pixel.

export interface SpecialPaint {
  id: string;
  name: string;
  /** stars needed to unlock */
  unlockAt: number;
}

export const SPECIALS: SpecialPaint[] = [
  { id: 'p:rainbow', name: 'Rainbow', unlockAt: 2 },
  { id: 'p:gold', name: 'Gold glitter', unlockAt: 4 },
  { id: 'p:dots', name: 'Polka dots', unlockAt: 6 },
  { id: 'p:pink', name: 'Pink glitter', unlockAt: 8 },
  { id: 'p:candy', name: 'Candy stripes', unlockAt: 11 },
  { id: 'p:hearts', name: 'Hearts', unlockAt: 14 },
  { id: 'p:stars', name: 'Stars', unlockAt: 17 },
  { id: 'p:galaxy', name: 'Galaxy', unlockAt: 20 },
];

export const COLOR_NAMES: Record<string, string> = {
  '#e53935': 'Red', '#fb8c00': 'Orange', '#fdd835': 'Yellow', '#7cb342': 'Light green', '#43a047': 'Green',
  '#2e7d32': 'Dark green', '#4fc3f7': 'Sky blue', '#29b6f6': 'Sky blue', '#1e88e5': 'Blue', '#5e35b1': 'Purple',
  '#8e24aa': 'Purple', '#ec407a': 'Pink', '#f8bbd0': 'Light pink', '#8d6e63': 'Brown', '#ffccbc': 'Peach',
  '#ffffff': 'White', '#212121': 'Black',
};

export const paintName = (c: string) => SPECIALS.find((s) => s.id === c)?.name ?? COLOR_NAMES[c] ?? '';
export const isSpecial = (c: string) => c.startsWith('p:');

/** small deterministic PRNG (patterns, spray) */
export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(s: number) {
  const c = document.createElement('canvas');
  c.width = c.height = s;
  return [c, c.getContext('2d')!] as const;
}

function sparkle(x: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  x.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, rr = k % 2 ? r * 0.3 : r;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (k) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.closePath();
  x.fill();
}

/** draw `fn` at (x,y) and at the wrapped copies so the tile repeats without seams */
function wrapped(S: number, x: number, y: number, m: number, fn: (x: number, y: number) => void) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    const px = x + dx, py = y + dy;
    if (px > -m && px < S + m && py > -m && py < S + m) fn(px, py);
  }
}

function heart(x: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  x.beginPath();
  x.moveTo(cx, cy + s * 0.9);
  x.bezierCurveTo(cx - s * 1.4, cy, cx - s * 0.7, cy - s * 1.1, cx, cy - s * 0.35);
  x.bezierCurveTo(cx + s * 0.7, cy - s * 1.1, cx + s * 1.4, cy, cx, cy + s * 0.9);
  x.fill();
}

function star(x: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.45 : R;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.closePath();
  x.fill();
}

function glitter(base: string, light: string, dark: string, seed: number) {
  const S = 160;
  const [c, x] = canvas(S);
  x.fillStyle = base;
  x.fillRect(0, 0, S, S);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 70; i++) {
    const px = rnd() * S, py = rnd() * S, r = 1 + rnd() * 2;
    x.fillStyle = rnd() < 0.5 ? dark : light;
    wrapped(S, px, py, 4, (a, b) => { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill(); });
  }
  for (let i = 0; i < 16; i++) {
    const px = rnd() * S, py = rnd() * S, r = 4 + rnd() * 6;
    x.fillStyle = i % 3 ? '#ffffff' : light;
    wrapped(S, px, py, 12, (a, b) => sparkle(x, a, b, r));
  }
  return c;
}

const TILES: Record<string, () => HTMLCanvasElement> = {
  'p:rainbow': () => {
    const bands = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#5e35b1', '#ec407a'];
    const B = 24, S = B * bands.length;
    const [c, x] = canvas(S);
    const wave = (yy: number, xx: number) => yy + 6 * Math.sin((2 * Math.PI * xx) / S);
    for (let i = -1; i <= bands.length; i++) {
      x.fillStyle = bands[((i % bands.length) + bands.length) % bands.length];
      x.beginPath();
      for (let xx = 0; xx <= S; xx += 4) x.lineTo(xx, wave(i * B, xx));
      for (let xx = S; xx >= 0; xx -= 4) x.lineTo(xx, wave((i + 1) * B, xx) + 0.5);
      x.closePath();
      x.fill();
    }
    return c;
  },
  'p:gold': () => glitter('#f9b724', '#fff59d', '#e08e00', 7),
  'p:pink': () => glitter('#f48fb1', '#fce4ec', '#d81b60', 11),
  'p:dots': () => {
    const S = 56;
    const [c, x] = canvas(S);
    x.fillStyle = '#29b6f6';
    x.fillRect(0, 0, S, S);
    x.fillStyle = '#ffffff';
    for (const [px, py] of [[14, 14], [42, 42]]) { x.beginPath(); x.arc(px, py, 9, 0, Math.PI * 2); x.fill(); }
    return c;
  },
  'p:candy': () => {
    const S = 48, d = 24;
    const [c, x] = canvas(S);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, S, S);
    x.fillStyle = '#e53935';
    for (let k = -4; k <= 4; k++) {
      const c0 = k * d;
      x.beginPath();
      x.moveTo(c0, 0); x.lineTo(c0 + d / 2, 0); x.lineTo(c0 + d / 2 - S, S); x.lineTo(c0 - S, S);
      x.closePath();
      x.fill();
    }
    return c;
  },
  'p:hearts': () => {
    const S = 72;
    const [c, x] = canvas(S);
    x.fillStyle = '#f8bbd0';
    x.fillRect(0, 0, S, S);
    x.fillStyle = '#e91e63';
    heart(x, 18, 18, 11);
    heart(x, 54, 54, 11);
    return c;
  },
  'p:stars': () => {
    const S = 72;
    const [c, x] = canvas(S);
    x.fillStyle = '#7e57c2';
    x.fillRect(0, 0, S, S);
    x.fillStyle = '#ffeb3b';
    star(x, 18, 20, 12);
    star(x, 54, 56, 12);
    return c;
  },
  'p:galaxy': () => {
    const S = 200;
    const [c, x] = canvas(S);
    x.fillStyle = '#1a1446';
    x.fillRect(0, 0, S, S);
    const rnd = mulberry32(5);
    for (let i = 0; i < 6; i++) {
      const px = rnd() * S, py = rnd() * S, r = 40 + rnd() * 40;
      const col = ['#6a1b9a', '#283593', '#ad1457'][i % 3];
      wrapped(S, px, py, r, (a, b) => {
        const g = x.createRadialGradient(a, b, 0, a, b, r);
        g.addColorStop(0, col + 'cc');
        g.addColorStop(1, col + '00');
        x.fillStyle = g;
        x.fillRect(a - r, b - r, r * 2, r * 2);
      });
    }
    for (let i = 0; i < 60; i++) {
      const px = rnd() * S, py = rnd() * S, r = 0.6 + rnd() * 1.6;
      x.fillStyle = rnd() < 0.8 ? '#ffffff' : '#ffe082';
      wrapped(S, px, py, 3, (a, b) => { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill(); });
    }
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) wrapped(S, rnd() * S, rnd() * S, 8, (a, b) => sparkle(x, a, b, 5));
    return c;
  },
};

const tileCache = new Map<string, HTMLCanvasElement>();
export function tile(id: string): HTMLCanvasElement | null {
  const make = TILES[id];
  if (!make) return null;
  let t = tileCache.get(id);
  if (!t) {
    t = make();
    tileCache.set(id, t);
  }
  return t;
}

const patterns = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();
/** fillStyle / strokeStyle for a paint on a given context */
export function paintStyle(ctx: CanvasRenderingContext2D, c: string): string | CanvasPattern {
  if (!isSpecial(c)) return c;
  let m = patterns.get(ctx);
  if (!m) patterns.set(ctx, (m = new Map()));
  let p = m.get(c);
  if (!p) {
    const t = tile(c);
    if (!t) return '#999999';
    p = ctx.createPattern(t, 'repeat')!;
    m.set(c, p);
  }
  return p;
}

/** CSS background for a palette swatch */
const swatchCache = new Map<string, string>();
export function swatchBackground(c: string): string {
  if (!isSpecial(c)) return c;
  let s = swatchCache.get(c);
  if (!s) {
    s = `url(${tile(c)!.toDataURL()}) center / ${c === 'p:rainbow' ? 90 : 60}px`;
    swatchCache.set(c, s);
  }
  return s;
}
