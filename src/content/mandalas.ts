import { P } from './pictures.ts';
import type { Level, PictureDef } from './types';

// Generated mandala pages for the 7-year-old. Rings of shapes are drawn from the outside in, so each
// inner ring sits on top of the bases of the ring outside it; every shape is its own region.

type Shape = 'petal' | 'drop' | 'diamond' | 'round';
interface Ring {
  n: number;
  shape: Shape;
  /** inner and outer radius of each shape */
  r0: number;
  r1: number;
  /** half-width */
  w: number;
  /** rotation of the first shape, degrees */
  offset?: number;
  fills: string[];
}

function shapePath(s: Shape, r0: number, r1: number, w: number) {
  const m = (r0 + r1) / 2, a = r0 + (r1 - r0) * 0.2, b = r0 + (r1 - r0) * 0.8, h = w / 0.75;
  switch (s) {
    case 'petal':
      return `M${r0},0 C${P(a)},${P(h)} ${P(b)},${P(h)} ${r1},0 C${P(b)},${P(-h)} ${P(a)},${P(-h)} ${r0},0 Z`;
    case 'drop': {
      const k = r0 + (r1 - r0) * 0.45;
      return `M${r1},0 C${P(k)},${P(w * 1.1)} ${P(r0 - w * 0.2)},${P(w * 0.95)} ${r0},0 C${P(r0 - w * 0.2)},${P(-w * 0.95)} ${P(k)},${P(-w * 1.1)} ${r1},0 Z`;
    }
    case 'diamond':
      return `M${r0},0 L${P(m)},${w} L${r1},0 L${P(m)},${-w} Z`;
    case 'round':
      return '';
  }
}

function ring(r: Ring) {
  let out = '';
  for (let i = 0; i < r.n; i++) {
    const deg = P((r.offset ?? 0) + (i * 360) / r.n), fill = r.fills[i % r.fills.length];
    const t = `transform="translate(500 500) rotate(${deg})"`;
    out += r.shape === 'round'
      ? `<circle class="c" fill="${fill}" cx="${P((r.r0 + r.r1) / 2)}" cy="0" r="${r.w}" ${t}/>`
      : `<path class="c" fill="${fill}" d="${shapePath(r.shape, r.r0, r.r1, r.w)}" ${t}/>`;
  }
  return out;
}

const disc = (r: number, fill: string) => `<circle class="c" fill="${fill}" cx="500" cy="500" r="${r}"/>`;

function mandala(id: string, name: string, level: Level, bg: string, parts: string[]): PictureDef {
  return { kind: 'picture', id: `mandala-${id}`, name, level, theme: 'patterns', bg, sw: level === 2 ? 10 : 9, body: parts.join('') };
}

const RAINBOW = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];

export const MANDALAS: PictureDef[] = [
  mandala('flower', 'Flower mandala', 2, '#fffde7', [
    disc(470, '#fff3e0'),
    ring({ n: 8, shape: 'petal', r0: 130, r1: 430, w: 72, fills: ['#f48fb1', '#ce93d8'] }),
    ring({ n: 8, shape: 'petal', r0: 55, r1: 250, w: 44, offset: 22.5, fills: ['#fff59d', '#ffcc80'] }),
    disc(70, '#ffb74d'),
  ]),
  mandala('star', 'Star mandala', 2, '#e8eaf6', [
    disc(470, '#e3f2fd'),
    ring({ n: 10, shape: 'diamond', r0: 170, r1: 440, w: 62, fills: ['#42a5f5', '#7e57c2'] }),
    ring({ n: 5, shape: 'petal', r0: 50, r1: 240, w: 62, fills: ['#fdd835'] }),
    disc(60, '#ff7043'),
  ]),
  mandala('ocean', 'Ocean mandala', 3, '#e0f2f1', [
    disc(470, '#e0f7fa'),
    ring({ n: 6, shape: 'drop', r0: 150, r1: 450, w: 105, fills: ['#26c6da', '#00acc1'] }),
    ring({ n: 6, shape: 'round', r0: 250, r1: 350, w: 45, offset: 30, fills: ['#4dd0e1'] }),
    ring({ n: 6, shape: 'petal', r0: 50, r1: 200, w: 48, offset: 30, fills: ['#80deea'] }),
    disc(55, '#00838f'),
  ]),
  mandala('candy', 'Candy mandala', 2, '#fce4ec', [
    disc(470, '#fce4ec'),
    ring({ n: 10, shape: 'round', r0: 330, r1: 450, w: 58, fills: ['#f06292', '#ba68c8'] }),
    ring({ n: 10, shape: 'petal', r0: 80, r1: 330, w: 52, offset: 18, fills: ['#4fc3f7', '#81c784'] }),
    disc(85, '#ffd54f'),
  ]),
  mandala('sun', 'Sun mandala', 3, '#fffde7', [
    disc(470, '#fff8e1'),
    ring({ n: 12, shape: 'drop', r0: 220, r1: 455, w: 50, fills: ['#ffb300', '#ff7043'] }),
    disc(262, '#fdd835'),
    ring({ n: 8, shape: 'petal', r0: 40, r1: 210, w: 40, fills: ['#ff8a65', '#ffcc80'] }),
    disc(48, '#e53935'),
  ]),
  mandala('lotus', 'Lotus mandala', 3, '#fce4ec', [
    disc(470, '#f3e5f5'),
    ring({ n: 16, shape: 'petal', r0: 290, r1: 430, w: 30, fills: ['#ce93d8', '#f48fb1'] }),
    ring({ n: 8, shape: 'petal', r0: 150, r1: 390, w: 68, fills: ['#ab47bc', '#7e57c2'] }),
    ring({ n: 8, shape: 'round', r0: 141, r1: 209, w: 32, offset: 22.5, fills: ['#fdd835'] }),
    ring({ n: 8, shape: 'petal', r0: 40, r1: 165, w: 30, offset: 22.5, fills: ['#ffb74d'] }),
    disc(50, '#ff7043'),
  ]),
  mandala('snowflake', 'Snowflake mandala', 3, '#e3f2fd', [
    disc(470, '#e1f5fe'),
    ring({ n: 12, shape: 'diamond', r0: 290, r1: 460, w: 52, fills: ['#4fc3f7', '#90caf9'] }),
    ring({ n: 12, shape: 'round', r0: 222, r1: 282, w: 28, offset: 15, fills: ['#ffffff', '#b3e5fc'] }),
    ring({ n: 6, shape: 'petal', r0: 60, r1: 250, w: 52, fills: ['#5c6bc0', '#7986cb'] }),
    ring({ n: 6, shape: 'diamond', r0: 100, r1: 205, w: 34, offset: 30, fills: ['#e1f5fe'] }),
    disc(55, '#3949ab'),
  ]),
  mandala('rainbow', 'Rainbow mandala', 3, '#fafafa', [
    disc(470, '#ffffff'),
    ring({ n: 12, shape: 'round', r0: 378, r1: 462, w: 42, fills: RAINBOW }),
    ring({ n: 12, shape: 'petal', r0: 200, r1: 380, w: 46, offset: 15, fills: RAINBOW }),
    ring({ n: 12, shape: 'drop', r0: 95, r1: 225, w: 30, fills: RAINBOW }),
    disc(82, '#fdd835'),
  ]),
  mandala('garden', 'Garden mandala', 3, '#f1f8e9', [
    disc(470, '#f1f8e9'),
    ring({ n: 16, shape: 'round', r0: 380, r1: 440, w: 30, fills: ['#e57373', '#fff176'] }),
    ring({ n: 8, shape: 'petal', r0: 180, r1: 400, w: 74, fills: ['#81c784', '#aed581'] }),
    ring({ n: 8, shape: 'drop', r0: 150, r1: 300, w: 38, offset: 22.5, fills: ['#f06292'] }),
    ring({ n: 8, shape: 'round', r0: 92, r1: 152, w: 30, fills: ['#ffd54f'] }),
    disc(62, '#8d6e63'),
  ]),
  mandala('night', 'Night sky mandala', 3, '#e8eaf6', [
    disc(470, '#283593'),
    ring({ n: 8, shape: 'diamond', r0: 250, r1: 440, w: 88, fills: ['#5c6bc0', '#3949ab'] }),
    ring({ n: 8, shape: 'petal', r0: 120, r1: 300, w: 52, offset: 22.5, fills: ['#fdd835', '#fff59d'] }),
    ring({ n: 12, shape: 'round', r0: 98, r1: 142, w: 22, fills: ['#ffffff'] }),
    disc(70, '#fff59d'),
  ]),
];
