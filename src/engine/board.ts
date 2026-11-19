import { sfx } from './audio';
import { BRUSHES, drawSegment, drawStamp, drawWet, hueColor, isBrush, isStamp, knockGrain, type Brush, type StampKind, type Tool } from './brushes';
import { mulberry32, paintStyle } from './paints';
import type { Prepared } from './prepare';

export type { Brush, StampKind, Tool } from './brushes';

/** The action log is the source of truth for a page: saved, replayed on load, popped by undo.
 *  Strokes and fills without `b` are marker (that is all older saves contain). */
export type Action =
  | { t: 'fill'; r: number; c: string; x: number; y: number; auto?: 1; b?: 'crayon' }
  | { t: 'stroke'; r: number; c: string; w: number; p: number[]; b?: Brush; s?: number }
  | { t: 'spray'; r: number; c: string; w: number; s: number; p: number[] }
  | { t: 'stamp'; r: number; c: string; k: StampKind; w: number; s: number; p: number[] }
  | { t: 'erase'; r: number };
type StrokeAction = Extract<Action, { t: 'stroke' }>;
type StampAction = Extract<Action, { t: 'stamp' }>;

export interface BoardSettings {
  /** marker radius as a fraction of the page's long side */
  brushFrac: number;
  /** share of a region a scribble must cover before it fills itself */
  autoAt: number;
  /** idle time before the next region starts to glow (magic mode) */
  hintAfterMs: number;
}

export interface BoardCallbacks {
  onChange(actions: Action[], done: number, total: number): void;
  onComplete(): void;
  /** trace step progress 0..1, and when it is finished */
  onTrace?(progress: number, done: boolean): void;
}

export interface BoardElements {
  color: HTMLCanvasElement;
  /** glow for the next region to colour; sits between paint and lines */
  hint: HTMLCanvasElement;
  /** the stroke being painted with a "wet" brush, until the finger lifts */
  wet: HTMLCanvasElement;
  outline: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  pen: HTMLElement;
  stage: HTMLElement;
}

const CELL = 12; // coverage grid cell, page px
const TCELL = 10; // trace grid cell, page px
const TRACE_DONE = 0.88;
const TAP_SLOP = 8; // css px a press may wander and still count as a tap
/** share of a region painted over (any brush) that counts it as coloured in */
const COVER_DONE = 0.75;

interface Bloom { id: number; c: string; b?: 'crayon'; cx: number; cy: number; rMax: number; t0: number; dur: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number }

const easeOut = (k: number) => 1 - (1 - k) ** 3;
/** rAF timestamps can be a little older than performance.now(), so time fractions can start below 0 */
const clamp01 = (k: number) => (k < 0 ? 0 : k > 1 ? 1 : k);

export class Board {
  private p!: Prepared;
  private W = 0;
  private H = 0;
  private cctx: CanvasRenderingContext2D;
  private fctx: CanvasRenderingContext2D;
  private hctx: CanvasRenderingContext2D;
  private wctx: CanvasRenderingContext2D;
  private wetBox: [number, number, number, number] | null = null;
  private wetDirty = false;
  private hintShown = false;
  private scratch = document.createElement('canvas');
  private sctx: CanvasRenderingContext2D;
  private masks = new Map<number, HTMLCanvasElement>();

  actions: Action[] = [];
  private done = new Uint8Array(1);
  private hasPaint = new Uint8Array(1);
  private solid: (string | null)[] = [];
  private solidB: (string | undefined)[] = [];

  private gw = 0;
  private gh = 0;
  private cellRegion = new Uint16Array(0);
  private cellColor = new Uint16Array(0);
  private regionCells: Int32Array[] = [];
  /** cells painted over by any covering brush */
  private covered = new Uint8Array(0);
  private colorIds = new Map<string, number>();

  tool: Tool = 'marker';
  color = '#e53935';
  magic = true;

  private pointerId: number | null = null;
  private mode: 'idle' | 'pending' | 'stroke' | 'consumed' | 'erase' | 'spray' | 'stamp' | 'trace' = 'idle';
  private stampPress: StampAction | null = null;
  /** length of the current stroke so far (the rainbow brush changes colour along it) */
  private strokeDist = 0;
  private spray: { a: Extract<Action, { t: 'spray' }>; rng: () => number } | null = null;
  private trace: {
    ink: Uint8Array; revealed: Uint8Array; total: number; got: number; tw: number; th: number;
    guide: HTMLCanvasElement; mask: HTMLCanvasElement; mctx: CanvasRenderingContext2D; R: number; finishing?: boolean;
  } | null = null;
  replaying = false;
  private skipReplay = false;
  private downClient = { x: 0, y: 0 };
  private downPage = { x: 0, y: 0 };
  private lastPage = { x: 0, y: 0 };
  private lastClient = { x: 0, y: 0, t: 0 };
  private stroke: StrokeAction | null = null;
  private strokeHits = 0;
  private lastErased = 0;

  private blooms: Bloom[] = [];
  private sparks: Spark[] = [];
  private raf = 0;
  private hintId = 0;
  private hintCanvas: { id: number; c: HTMLCanvasElement } | null = null;
  private hintTimer = 0;
  private completeFired = false;
  private completeTimer = 0;
  private pen = { x: 0, y: 0, tx: 0, ty: 0, vis: false, tilt: 0, hideAt: 0 };
  private destroyed = false;

  constructor(private els: BoardElements, private settings: BoardSettings, private cb: BoardCallbacks) {
    this.cctx = els.color.getContext('2d', { willReadFrequently: false })!;
    this.fctx = els.fx.getContext('2d')!;
    this.hctx = els.hint.getContext('2d')!;
    this.wctx = els.wet.getContext('2d')!;
    this.sctx = this.scratch.getContext('2d')!;
    const fx = els.fx;
    fx.addEventListener('pointerdown', this.onDown);
    fx.addEventListener('pointermove', this.onMove);
    fx.addEventListener('pointerup', this.onUp);
    fx.addEventListener('pointercancel', this.onUp);
    fx.addEventListener('lostpointercapture', this.onUp);
  }

  // ---------------------------------------------------------------- setup

  load(p: Prepared, actions: Action[]) {
    this.p = p;
    const W = (this.W = p.w), H = (this.H = p.h);
    for (const c of [this.els.color, this.els.hint, this.els.wet, this.els.outline, this.els.fx, this.scratch]) {
      c.width = W;
      c.height = H;
    }
    this.els.outline.getContext('2d')!.drawImage(p.outlineCanvas, 0, 0);
    const n = p.regions.length;
    this.done = new Uint8Array(n + 1);
    this.hasPaint = new Uint8Array(n + 1);
    this.solid = new Array(n + 1).fill(null);
    this.solidB = new Array(n + 1).fill(undefined);
    this.masks.clear();
    this.wetBox = null;
    this.hintCanvas = null;
    this.trace = null;
    this.replaying = false;

    this.gw = Math.ceil(W / CELL);
    this.gh = Math.ceil(H / CELL);
    this.cellRegion = new Uint16Array(this.gw * this.gh);
    this.cellColor = new Uint16Array(this.gw * this.gh);
    this.covered = new Uint8Array(this.gw * this.gh);
    const counts = new Int32Array(n + 1);
    for (let gy = 0; gy < this.gh; gy++) {
      const py = Math.min(H - 1, gy * CELL + (CELL >> 1));
      for (let gx = 0; gx < this.gw; gx++) {
        const px = Math.min(W - 1, gx * CELL + (CELL >> 1));
        const id = p.labels[py * W + px];
        this.cellRegion[gy * this.gw + gx] = id;
        counts[id]++;
      }
    }
    this.regionCells = Array.from({ length: n + 1 }, (_, id) => new Int32Array(counts[id]));
    const fillAt = new Int32Array(n + 1);
    for (let c = 0; c < this.cellRegion.length; c++) {
      const id = this.cellRegion[c];
      this.regionCells[id][fillAt[id]++] = c;
    }

    this.actions = [];
    for (const a of actions) {
      if (a.r < 1 || a.r > n) continue;
      this.applyInstant(a);
      this.actions.push(a);
    }
    this.completeFired = this.isComplete();
    this.bumpIdle();
    this.warmMasks();
  }

  /** build region masks in idle time so the first tap on a slow Chromebook doesn't stutter */
  private warmMasks() {
    const ids = [...this.p.order, ...this.p.regions.filter((r) => r.optional).map((r) => r.id)];
    const ric: (cb: () => void) => void =
      'requestIdleCallback' in window ? (cb) => requestIdleCallback(cb, { timeout: 500 }) : (cb) => setTimeout(cb, 16);
    const step = () => {
      if (this.destroyed) return;
      const t0 = performance.now();
      while (ids.length && performance.now() - t0 < 8) this.mask(ids.shift()!);
      if (ids.length) ric(step);
    };
    ric(step);
  }

  setTool(t: Tool) {
    this.tool = t;
  }

  setColor(c: string) {
    this.color = c;
  }

  setMagic(m: boolean) {
    this.magic = m;
    this.bumpIdle();
  }

  get progress() {
    let d = 0;
    for (const id of this.p.order) if (this.done[id]) d++;
    return { done: d, total: this.p.order.length };
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.hintTimer);
    clearTimeout(this.completeTimer);
    sfx.scratchStop();
    const fx = this.els.fx;
    fx.removeEventListener('pointerdown', this.onDown);
    fx.removeEventListener('pointermove', this.onMove);
    fx.removeEventListener('pointerup', this.onUp);
    fx.removeEventListener('pointercancel', this.onUp);
    fx.removeEventListener('lostpointercapture', this.onUp);
  }

  // ---------------------------------------------------------------- painting primitives

  private region(id: number) {
    return this.p.regions[id - 1];
  }

  private mask(id: number): HTMLCanvasElement {
    let m = this.masks.get(id);
    if (m) return m;
    const r = this.region(id);
    const mw = r.x1 - r.x0, mh = r.y1 - r.y0;
    m = document.createElement('canvas');
    m.width = mw;
    m.height = mh;
    const img = new ImageData(mw, mh);
    const d = img.data, L = this.p.labels, W = this.W;
    for (let y = 0; y < mh; y++) {
      const row = (y + r.y0) * W + r.x0;
      let o = y * mw * 4 + 3;
      for (let x = 0; x < mw; x++, o += 4) if (L[row + x] === id) d[o] = 255;
    }
    m.getContext('2d')!.putImageData(img, 0, 0);
    this.masks.set(id, m);
    return m;
  }

  /** Draw something, keep only the part inside region `id`, composite it onto `target`. */
  private paintMasked(id: number, x: number, y: number, w: number, h: number, draw: (s: CanvasRenderingContext2D) => void, target = this.cctx, alpha = 1) {
    const r = this.region(id);
    const x0 = Math.max(Math.floor(x), r.x0), y0 = Math.max(Math.floor(y), r.y0);
    const x1 = Math.min(Math.ceil(x + w), r.x1), y1 = Math.min(Math.ceil(y + h), r.y1);
    if (x1 <= x0 || y1 <= y0) return;
    const s = this.sctx, bw = x1 - x0, bh = y1 - y0;
    s.save();
    s.beginPath();
    s.rect(x0, y0, bw, bh);
    s.clip();
    s.clearRect(x0, y0, bw, bh);
    draw(s);
    s.globalCompositeOperation = 'destination-in';
    s.drawImage(this.mask(id), r.x0, r.y0);
    s.restore();
    if (alpha !== 1) target.globalAlpha = alpha;
    target.drawImage(this.scratch, x0, y0, bw, bh, x0, y0, bw, bh);
    if (alpha !== 1) target.globalAlpha = 1;
  }

  private fillFull(id: number, c: string, b?: 'crayon') {
    const r = this.region(id);
    this.paintMasked(id, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, (s) => {
      s.fillStyle = paintStyle(s, c);
      s.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
      if (b) knockGrain(s, b, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    });
  }

  private eraseRegion(id: number) {
    const r = this.region(id);
    const c = this.cctx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.drawImage(this.mask(id), r.x0, r.y0);
    c.restore();
  }

  private brushOf(a: { b?: Brush }): Brush {
    return a.b ?? 'marker';
  }

  /** radius of a brush for this kid (relative to their marker) */
  private brushR(b: Brush) {
    return Math.max(3, Math.round(this.settings.brushFrac * Math.max(this.W, this.H) * BRUSHES[b].size));
  }

  /** one piece of a drawn-as-you-go stroke (also used for replay, so both look the same) */
  private paintSegment(a: StrokeAction, ax: number, ay: number, bx: number, by: number, dist: number) {
    const R = a.w, b = this.brushOf(a);
    this.paintMasked(a.r, Math.min(ax, bx) - R - 2, Math.min(ay, by) - R - 2, Math.abs(bx - ax) + 2 * R + 4, Math.abs(by - ay) + 2 * R + 4, (s) =>
      drawSegment(s, b, paintStyle(s, a.c), R, ax, ay, bx, by, dist, a.s ?? 0));
  }

  /** draws points [from, to) of a stroke the way live drawing did: a dot, then one piece per point */
  private drawStrokeRange(a: StrokeAction, from: number, to: number) {
    const p = a.p;
    let dist = 0;
    for (let i = 0; i < to; i++) {
      if (i > 0) {
        const ax = p[i * 2 - 2], ay = p[i * 2 - 1], bx = p[i * 2], by = p[i * 2 + 1];
        if (i >= from) this.paintSegment(a, ax, ay, bx, by, dist);
        dist += Math.hypot(bx - ax, by - ay);
      } else if (from === 0) this.paintSegment(a, p[0], p[1], p[0], p[1], 0);
    }
  }

  /** a wet stroke (first `upto` coordinates) on the preview layer, or committed to the paint */
  private renderWet(a: StrokeAction, commit: boolean, upto = a.p.length) {
    const b = this.brushOf(a), spec = BRUSHES[b].wet!, pts = upto >= a.p.length ? a.p : a.p.slice(0, Math.max(2, upto));
    const pad = a.w * (1 + spec.pad) + 4;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]);
      y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]);
    }
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    if (!commit) this.clearWet();
    this.paintMasked(a.r, x0, y0, x1 - x0, y1 - y0, (s) => drawWet(s, b, paintStyle(s, a.c), a.c, a.w, pts, a.s ?? 0), commit ? this.cctx : this.wctx, spec.alpha);
    if (!commit) this.wetBox = [x0, y0, x1 - x0, y1 - y0];
  }

  private clearWet() {
    if (!this.wetBox) return;
    const [x, y, w, h] = this.wetBox;
    this.wctx.clearRect(Math.floor(x) - 1, Math.floor(y) - 1, Math.ceil(w) + 2, Math.ceil(h) + 2);
    this.wetBox = null;
  }

  /** the whole stroke at once (loading, undo) */
  private drawStroke(a: StrokeAction) {
    if (BRUSHES[this.brushOf(a)].wet) this.renderWet(a, true);
    else this.drawStrokeRange(a, 0, a.p.length / 2);
  }

  private placeStamp(a: StampAction, i: number) {
    const x = a.p[i * 2], y = a.p[i * 2 + 1], r = a.w;
    this.paintMasked(a.r, x - r * 1.5, y - r * 1.5, r * 3, r * 3, (s) => drawStamp(s, a.k, paintStyle(s, a.c), r, x, y, a.s, i));
  }

  // ---------------------------------------------------------------- coverage

  private colorIndex(c: string) {
    let i = this.colorIds.get(c);
    if (i === undefined) {
      i = this.colorIds.size + 1;
      this.colorIds.set(c, i);
    }
    return i;
  }

  private setCells(id: number, ci: number) {
    for (const c of this.regionCells[id]) this.cellColor[c] = ci;
  }

  private countCells(id: number, ci: number) {
    let k = 0;
    for (const c of this.regionCells[id]) if (this.cellColor[c] === ci) k++;
    return k;
  }

  private coverSeg(id: number, R: number, ax: number, ay: number, bx: number, by: number) {
    const gx0 = Math.max(0, Math.floor((Math.min(ax, bx) - R) / CELL)), gx1 = Math.min(this.gw - 1, Math.floor((Math.max(ax, bx) + R) / CELL));
    const gy0 = Math.max(0, Math.floor((Math.min(ay, by) - R) / CELL)), gy1 = Math.min(this.gh - 1, Math.floor((Math.max(ay, by) + R) / CELL));
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy, R2 = R * R;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const c = gy * this.gw + gx;
      if (this.cellRegion[c] !== id || this.covered[c]) continue;
      const px = gx * CELL + CELL / 2, py = gy * CELL + CELL / 2;
      let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + t * dx - px, qy = ay + t * dy - py;
      if (qx * qx + qy * qy <= R2) this.covered[c] = 1;
    }
  }

  private setCovered(id: number, v: 0 | 1) {
    for (const c of this.regionCells[id]) this.covered[c] = v;
  }

  /** painted over enough with any brush: the region counts as coloured in */
  private checkCovered(id: number) {
    if (this.done[id]) return;
    const cells = this.regionCells[id];
    if (!cells.length) return;
    let k = 0;
    for (const c of cells) if (this.covered[c]) k++;
    if (k / cells.length >= COVER_DONE) this.done[id] = 1;
  }

  /** stroke coverage, for both the scribble auto-fill (same colour) and "coloured in" (any paint) */
  private strokeCoverage(a: StrokeAction) {
    const spec = BRUSHES[this.brushOf(a)], p = a.p, R = a.w;
    const ci = spec.fills ? this.colorIndex(a.c) : 0;
    for (let i = 0; i < p.length; i += 2) {
      const ax = i ? p[i - 2] : p[0], ay = i ? p[i - 1] : p[1];
      if (ci) this.markCells(a.r, ci, R, ax, ay, p[i], p[i + 1]);
      if (spec.covers) this.coverSeg(a.r, R, ax, ay, p[i], p[i + 1]);
    }
    if (spec.covers) this.checkCovered(a.r);
  }

  /** marks cells of region `id` under the segment; returns how many newly became colour `ci` */
  private markCells(id: number, ci: number, R: number, ax: number, ay: number, bx: number, by: number) {
    const gx0 = Math.max(0, Math.floor((Math.min(ax, bx) - R) / CELL));
    const gx1 = Math.min(this.gw - 1, Math.floor((Math.max(ax, bx) + R) / CELL));
    const gy0 = Math.max(0, Math.floor((Math.min(ay, by) - R) / CELL));
    const gy1 = Math.min(this.gh - 1, Math.floor((Math.max(ay, by) + R) / CELL));
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy, R2 = R * R;
    let gained = 0;
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const c = gy * this.gw + gx;
        if (this.cellRegion[c] !== id || this.cellColor[c] === ci) continue;
        const px = gx * CELL + CELL / 2, py = gy * CELL + CELL / 2;
        let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + t * dx - px, qy = ay + t * dy - py;
        if (qx * qx + qy * qy > R2) continue;
        this.cellColor[c] = ci;
        gained++;
      }
    }
    return gained;
  }

  // ---------------------------------------------------------------- actions

  private applyInstant(a: Action) {
    const id = a.r;
    if (a.t === 'fill') {
      this.fillFull(id, a.c, a.b);
      this.setCells(id, this.colorIndex(a.c));
      this.setCovered(id, 1);
      this.done[id] = 1;
      this.hasPaint[id] = 1;
      this.solid[id] = a.c;
      this.solidB[id] = a.b;
    } else if (a.t === 'stroke') {
      if (a.p.length >= 2) {
        this.drawStroke(a);
        this.strokeCoverage(a);
      }
      this.hasPaint[id] = 1;
      this.solid[id] = null;
    } else if (a.t === 'stamp') {
      for (let i = 0; i < a.p.length / 2; i++) this.placeStamp(a, i);
      this.hasPaint[id] = 1;
      this.solid[id] = null;
    } else if (a.t === 'spray') {
      const rng = mulberry32(a.s), p = a.p;
      if (p.length >= 2) {
        this.paintDots(id, a.c, this.sprayDots(rng, a.w, p[0], p[1], p[0], p[1]));
        for (let i = 2; i < p.length; i += 2) this.paintDots(id, a.c, this.sprayDots(rng, a.w, p[i - 2], p[i - 1], p[i], p[i + 1]));
      }
      this.hasPaint[id] = 1;
      this.solid[id] = null;
    } else {
      this.eraseRegion(id);
      this.setCells(id, 0);
      this.setCovered(id, 0);
      this.done[id] = 0;
      this.hasPaint[id] = 0;
      this.solid[id] = null;
    }
  }

  private rebuildRegion(id: number) {
    this.eraseRegion(id);
    this.setCells(id, 0);
    this.setCovered(id, 0);
    this.done[id] = 0;
    this.hasPaint[id] = 0;
    this.solid[id] = null;
    this.solidB[id] = undefined;
    for (const a of this.actions) if (a.r === id) this.applyInstant(a);
  }

  private emitChange() {
    const { done, total } = this.progress;
    this.cb.onChange(this.actions, done, total);
  }

  private isComplete() {
    const { done, total } = this.progress;
    return total > 0 && done === total;
  }

  private checkComplete() {
    if (this.isComplete()) {
      if (!this.completeFired && !this.blooms.length) {
        this.completeFired = true;
        this.hintId = 0;
        this.completeTimer = window.setTimeout(() => this.cb.onComplete(), 450);
      }
    } else {
      this.completeFired = false;
      clearTimeout(this.completeTimer);
    }
  }

  undo(): boolean {
    if (!this.actions.length || this.pointerId !== null || this.replaying || this.trace) return false;
    this.finishBlooms();
    const a = this.actions.pop()!;
    this.rebuildRegion(a.r);
    sfx.click();
    this.emitChange();
    this.checkComplete();
    this.bumpIdle();
    return true;
  }

  private startFill(id: number, c: string, x: number, y: number, auto: boolean, b?: 'crayon') {
    this.finishBlooms(id);
    const a: Extract<Action, { t: 'fill' }> = { t: 'fill', r: id, c, x: Math.round(x), y: Math.round(y) };
    if (auto) a.auto = 1;
    if (b) a.b = b;
    this.actions.push(a);
    this.setCells(id, this.colorIndex(c));
    this.setCovered(id, 1);
    this.done[id] = 1;
    this.hasPaint[id] = 1;
    this.solid[id] = c;
    this.solidB[id] = b;
    const r = this.region(id);
    const rMax = Math.max(Math.hypot(x - r.x0, y - r.y0), Math.hypot(x - r.x1, y - r.y0), Math.hypot(x - r.x0, y - r.y1), Math.hypot(x - r.x1, y - r.y1));
    const frac = r.area / (this.W * this.H);
    const dur = (auto ? 230 : 320) + 520 * Math.sqrt(frac);
    this.blooms.push({ id, c, b, cx: x, cy: y, rMax, t0: performance.now(), dur });
    sfx.bloom(dur / 1000);
    this.emitChange();
    this.loop();
  }

  /** the animated circles of a textured fill pile up, so redraw the region from the log instead */
  private endBloom(b: Bloom) {
    if (b.b) this.rebuildRegion(b.id);
    else this.fillFull(b.id, b.c);
  }

  private finishBlooms(onlyId?: number) {
    for (let i = this.blooms.length - 1; i >= 0; i--) {
      const b = this.blooms[i];
      if (onlyId !== undefined && b.id !== onlyId) continue;
      this.endBloom(b);
      this.blooms.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------- pointer input

  private toPage(e: { clientX: number; clientY: number }) {
    const rect = this.els.fx.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * this.W) / rect.width, y: ((e.clientY - rect.top) * this.H) / rect.height };
  }

  private regionAt(x: number, y: number) {
    const xi = Math.min(this.W - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(this.H - 1, Math.max(0, Math.round(y)));
    return this.p.labels[yi * this.W + xi];
  }

  private colorFor(id: number) {
    return this.magic ? this.region(id).color : this.color;
  }

  private onDown = (e: PointerEvent) => {
    if (this.pointerId !== null || !this.p || this.destroyed) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    sfx.unlock();
    if (this.replaying) {
      this.skipReplay = true;
      return;
    }
    this.hintId = 0;
    clearTimeout(this.hintTimer);
    this.pointerId = e.pointerId;
    try {
      this.els.fx.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events */
    }
    const pt = this.toPage(e);
    this.downClient = { x: e.clientX, y: e.clientY };
    this.downPage = pt;
    this.lastPage = pt;
    this.lastClient = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    if (this.trace) {
      if (this.trace.finishing) return;
      this.mode = 'trace';
      this.lastPage = pt;
      this.traceSegment(pt.x, pt.y, pt.x, pt.y);
      this.showPen(e, '#222228');
      sfx.scratchStart();
      return;
    }
    if (this.tool === 'erase') {
      this.mode = 'erase';
      this.lastErased = 0;
      this.eraseAt(pt);
      this.showPen(e, '#ffffff');
      return;
    }
    const id = this.regionAt(pt.x, pt.y);
    if (this.tool === 'spray' || isStamp(this.tool)) {
      if (!id || this.region(id).fixed) {
        this.mode = 'consumed';
        return;
      }
      this.finishBlooms(id);
      const c = this.colorFor(id), seed = (Math.random() * 2 ** 31) | 0;
      const x = Math.round(pt.x), y = Math.round(pt.y);
      if (this.tool === 'spray') {
        const R = Math.max(8, Math.round(this.settings.brushFrac * 1.5 * Math.max(this.W, this.H)));
        this.spray = { a: { t: 'spray', r: id, c, w: R, s: seed, p: [x, y] }, rng: mulberry32(seed) };
        this.paintDots(id, c, this.sprayDots(this.spray.rng, R, x, y, x, y));
        this.mode = 'spray';
        sfx.scratchStart();
      } else {
        const k = this.tool.slice(6) as StampKind;
        this.stampPress = { t: 'stamp', r: id, c, k, w: Math.round(this.brushR('marker') * 1.25), s: seed, p: [x, y] };
        this.placeStamp(this.stampPress, 0);
        this.mode = 'stamp';
        sfx.pop(0.004);
      }
      this.showPen(e, c);
      return;
    }
    this.mode = 'pending';
    this.showPen(e, id ? this.colorFor(id) : this.color);
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.movePen(e);
    if (this.mode === 'erase') {
      const pt = this.toPage(e);
      this.eraseAt(pt);
      return;
    }
    if (this.mode === 'stamp' && this.stampPress) {
      // keep pressing and dragging: a trail of stamps
      const a = this.stampPress, pt = this.toPage(e), n = a.p.length;
      const x = Math.round(pt.x), y = Math.round(pt.y);
      if (Math.hypot(x - a.p[n - 2], y - a.p[n - 1]) >= a.w * 1.8) {
        a.p.push(x, y);
        this.placeStamp(a, a.p.length / 2 - 1);
        sfx.pop(0.004);
      }
      return;
    }
    if (this.mode === 'trace' || this.mode === 'spray') {
      const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const ev of evs.length ? evs : [e]) {
        const pt = this.toPage(ev);
        const x = Math.round(pt.x), y = Math.round(pt.y);
        if (Math.hypot(x - this.lastPage.x, y - this.lastPage.y) < 2) continue;
        if (this.mode === 'trace') this.traceSegment(this.lastPage.x, this.lastPage.y, x, y);
        else if (this.spray) {
          const s = this.spray;
          this.paintDots(s.a.r, s.a.c, this.sprayDots(s.rng, s.a.w, this.lastPage.x, this.lastPage.y, x, y));
          s.a.p.push(x, y);
        }
        this.lastPage = { x, y };
        if (this.mode !== 'trace' && this.mode !== 'spray') break; // trace may have just finished
      }
      const dt = Math.max(1, e.timeStamp - this.lastClient.t);
      sfx.scratchSpeed(Math.hypot(e.clientX - this.lastClient.x, e.clientY - this.lastClient.y) / dt);
      this.lastClient = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      return;
    }
    if (this.mode === 'pending') {
      if (Math.hypot(e.clientX - this.downClient.x, e.clientY - this.downClient.y) < TAP_SLOP) return;
      this.beginStroke();
    }
    if (this.mode !== 'stroke' || !this.stroke) return;
    const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const s = this.stroke, R = s.w, b = this.brushOf(s), spec = BRUSHES[b], ci = spec.fills ? this.colorIndex(s.c) : 0;
    let gained = 0;
    for (const ev of evs.length ? evs : [e]) {
      const pt = this.toPage(ev);
      const x = Math.round(pt.x), y = Math.round(pt.y);
      const ax = this.lastPage.x, ay = this.lastPage.y, len = Math.hypot(x - ax, y - ay);
      if (len < 1.5) continue;
      if (spec.wet) this.wetDirty = true;
      else this.paintSegment(s, ax, ay, x, y, this.strokeDist);
      if (ci) gained += this.markCells(s.r, ci, R, ax, ay, x, y);
      if (spec.covers) this.coverSeg(s.r, R, ax, ay, x, y);
      s.p.push(x, y);
      this.strokeDist += len;
      this.lastPage = { x, y };
    }
    if (this.wetDirty) this.loop();
    if (b === 'rainbow') this.setPenColor(hueColor(((s.s ?? 0) % 360) + (this.strokeDist / (R * 9)) * 360));
    this.strokeHits += gained;
    const dt = Math.max(1, e.timeStamp - this.lastClient.t);
    const v = Math.hypot(e.clientX - this.lastClient.x, e.clientY - this.lastClient.y) / dt;
    this.lastClient = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    sfx.scratchSpeed(v);
    if (!spec.fills) return;
    const cells = this.regionCells[s.r].length;
    if (cells === 0 || this.strokeHits / cells >= this.settings.autoAt) this.autoComplete();
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    if (this.mode === 'pending') this.tap(this.downPage);
    else if (this.mode === 'stroke') this.endStroke();
    else if (this.mode === 'spray' && this.spray) {
      this.actions.push(this.spray.a);
      this.hasPaint[this.spray.a.r] = 1;
      this.solid[this.spray.a.r] = null;
      this.spray = null;
      this.emitChange();
    } else if (this.mode === 'stamp' && this.stampPress) {
      const a = this.stampPress;
      this.stampPress = null;
      this.actions.push(a);
      this.hasPaint[a.r] = 1;
      this.solid[a.r] = null;
      const last = a.p.length - 2;
      this.sparkle(a.p[last], a.p[last + 1], a.c, 5);
      this.loop();
      this.emitChange();
    }
    sfx.scratchStop();
    this.mode = 'idle';
    this.pen.hideAt = performance.now() + 200;
    this.bumpIdle();
  };

  private currentBrush(): Brush {
    return isBrush(this.tool) ? this.tool : 'marker';
  }

  private newStroke(id: number, x: number, y: number): StrokeAction {
    const b = this.currentBrush();
    const a: StrokeAction = { t: 'stroke', r: id, c: this.colorFor(id), w: this.brushR(b), p: [x, y] };
    if (b !== 'marker') {
      a.b = b;
      a.s = (Math.random() * 2 ** 31) | 0;
    }
    return a;
  }

  private beginStroke() {
    const id = this.regionAt(this.downPage.x, this.downPage.y);
    if (!id || this.region(id).fixed) {
      this.mode = 'consumed';
      return;
    }
    this.finishBlooms(id);
    const x = Math.round(this.downPage.x), y = Math.round(this.downPage.y);
    const a = this.newStroke(id, x, y), spec = BRUSHES[this.brushOf(a)], R = a.w;
    this.stroke = a;
    this.strokeDist = 0;
    this.strokeHits = 0;
    if (spec.fills) {
      const ci = this.colorIndex(a.c);
      this.strokeHits = this.countCells(id, ci) + this.markCells(id, ci, R, x, y, x, y);
    }
    if (spec.covers) this.coverSeg(id, R, x, y, x, y);
    if (spec.wet) {
      this.wetDirty = true;
      this.loop();
    } else this.paintSegment(a, x, y, x, y, 0);
    this.lastPage = { x, y };
    this.mode = 'stroke';
    this.setPenColor(this.brushOf(a) === 'rainbow' ? hueColor((a.s ?? 0) % 360) : a.c);
    sfx.scratchStart();
  }

  private endStroke() {
    const s = this.stroke;
    this.stroke = null;
    if (!s) return;
    if (BRUSHES[this.brushOf(s)].wet) {
      this.wetDirty = false;
      this.clearWet();
      this.renderWet(s, true);
    }
    this.actions.push(s);
    this.hasPaint[s.r] = 1;
    this.solid[s.r] = null;
    this.checkCovered(s.r);
    this.emitChange();
    this.checkComplete();
  }

  private autoComplete() {
    const s = this.stroke!;
    this.endStroke();
    sfx.scratchStop();
    this.mode = 'consumed';
    this.startFill(s.r, s.c, this.lastPage.x, this.lastPage.y, true, this.brushOf(s) === 'crayon' ? 'crayon' : undefined);
  }

  /** a tap: marker and crayon fill the region; the other brushes leave a dot */
  private tap(pt: { x: number; y: number }) {
    const b = this.currentBrush();
    if (BRUSHES[b].fills) return this.tapFill(pt, b === 'crayon' ? 'crayon' : undefined);
    const id = this.regionAt(pt.x, pt.y);
    if (!id || this.region(id).fixed) return;
    this.finishBlooms(id);
    const a = this.newStroke(id, Math.round(pt.x), Math.round(pt.y));
    this.drawStroke(a);
    this.strokeCoverage(a);
    this.actions.push(a);
    this.hasPaint[id] = 1;
    this.solid[id] = null;
    sfx.pop(0.002);
    this.emitChange();
    this.checkComplete();
  }

  private tapFill(pt: { x: number; y: number }, b?: 'crayon') {
    const id = this.regionAt(pt.x, pt.y);
    if (!id || this.region(id).fixed) return;
    const c = this.colorFor(id);
    if (this.solid[id] === c && this.solidB[id] === b && !this.blooms.some((bl) => bl.id === id)) {
      this.sparkle(pt.x, pt.y, c, 7);
      sfx.sparkle();
      this.loop();
      return;
    }
    this.startFill(id, c, pt.x, pt.y, false, b);
  }

  private eraseAt(pt: { x: number; y: number }) {
    const id = this.regionAt(pt.x, pt.y);
    if (!id || id === this.lastErased) return;
    this.lastErased = id;
    if (!this.hasPaint[id] || this.region(id).fixed) return;
    this.finishBlooms(id);
    const a: Action = { t: 'erase', r: id };
    this.applyInstant(a);
    this.actions.push(a);
    this.sparkle(pt.x, pt.y, '#ffffff', 10);
    sfx.poof();
    this.emitChange();
    this.checkComplete();
    this.loop();
  }

  // ---------------------------------------------------------------- hints, sparkles, pen

  private bumpIdle() {
    clearTimeout(this.hintTimer);
    this.hintId = 0;
    if (!this.magic || !this.p || this.destroyed || this.trace || this.replaying) return;
    this.hintTimer = window.setTimeout(() => {
      const next = this.p.order.find((id) => !this.done[id]);
      if (next && this.pointerId === null) {
        this.hintId = next;
        this.loop();
      }
    }, this.settings.hintAfterMs);
  }

  private sparkle(x: number, y: number, c: string, n: number) {
    const scale = Math.max(this.W, this.H) / 1200;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 5) * scale;
      const max = 26 + Math.random() * 18;
      this.sparks.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5 * scale, life: max, max,
        c: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffd54f' : c, s: (6 + Math.random() * 9) * scale,
      });
    }
  }

  private showPen(e: PointerEvent, c: string) {
    const r = this.els.stage.getBoundingClientRect();
    this.pen.tx = e.clientX - r.left;
    this.pen.ty = e.clientY - r.top;
    if (!this.pen.vis) {
      this.pen.x = this.pen.tx;
      this.pen.y = this.pen.ty;
    }
    this.pen.vis = true;
    this.pen.hideAt = 0;
    this.els.pen.style.opacity = '1';
    this.setPenColor(c);
    this.loop();
  }

  private setPenColor(c: string) {
    this.els.pen.style.setProperty('--pen', c);
  }

  private movePen(e: PointerEvent) {
    const r = this.els.stage.getBoundingClientRect();
    this.pen.tx = e.clientX - r.left;
    this.pen.ty = e.clientY - r.top;
  }

  private loop() {
    if (this.raf || this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.destroyed) return;
    if (this.wetDirty && this.stroke) {
      this.wetDirty = false;
      this.renderWet(this.stroke, false);
    }
    let ended = false;
    for (let i = this.blooms.length - 1; i >= 0; i--) {
      const b = this.blooms[i];
      const k = clamp01((now - b.t0) / b.dur);
      const rad = 6 + (b.rMax - 6) * easeOut(k);
      this.paintMasked(b.id, b.cx - rad, b.cy - rad, rad * 2, rad * 2, (s) => {
        s.fillStyle = paintStyle(s, b.c);
        s.beginPath();
        s.arc(b.cx, b.cy, rad, 0, Math.PI * 2);
        s.fill();
        if (b.b) knockGrain(s, b.b, b.cx - rad, b.cy - rad, rad * 2, rad * 2);
      });
      if (k >= 1) {
        this.endBloom(b);
        this.blooms.splice(i, 1);
        const r = this.region(b.id);
        this.sparkle(r.ax, r.ay, b.c, 11);
        sfx.pop(r.area / (this.W * this.H));
        ended = true;
      }
    }
    if (ended) this.checkComplete();

    const f = this.fctx;
    f.clearRect(0, 0, this.W, this.H);
    if (this.hintId && !this.done[this.hintId] && this.magic) {
      const r = this.region(this.hintId);
      if (this.hintCanvas?.id !== this.hintId) {
        // tint the region mask once; each frame then only changes its opacity
        const m = this.mask(this.hintId);
        const c = document.createElement('canvas');
        c.width = m.width;
        c.height = m.height;
        const x = c.getContext('2d')!;
        x.drawImage(m, 0, 0);
        x.globalCompositeOperation = 'source-in';
        x.fillStyle = r.color === '#ffffff' ? '#ffe082' : r.color;
        x.fillRect(0, 0, c.width, c.height);
        this.hintCanvas = { id: this.hintId, c };
      }
      const h = this.hctx;
      h.clearRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
      h.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(now / 240));
      h.drawImage(this.hintCanvas.c, r.x0, r.y0);
      h.globalAlpha = 1;
      this.hintShown = true;
    } else {
      this.hintId = 0;
      if (this.hintShown) {
        this.hctx.clearRect(0, 0, this.W, this.H);
        this.hintShown = false;
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.96;
      p.life--;
      if (p.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      const a = p.life / p.max, s = p.s * (0.6 + 0.4 * a);
      f.globalAlpha = a;
      f.fillStyle = p.c;
      f.strokeStyle = 'rgba(0,0,0,0.25)';
      f.lineWidth = 1.5;
      f.beginPath();
      for (let k = 0; k < 8; k++) {
        const ang = (k * Math.PI) / 4, rr = k % 2 ? s * 0.38 : s;
        const px = p.x + Math.cos(ang) * rr, py = p.y + Math.sin(ang) * rr;
        if (k) f.lineTo(px, py);
        else f.moveTo(px, py);
      }
      f.closePath();
      f.fill();
      f.stroke();
    }
    f.globalAlpha = 1;

    const pen = this.pen;
    if (pen.vis) {
      if (pen.hideAt && now > pen.hideAt) {
        pen.vis = false;
        pen.hideAt = 0;
        this.els.pen.style.opacity = '0';
      } else {
        const dx = pen.tx - pen.x;
        pen.x += dx * 0.45;
        pen.y += (pen.ty - pen.y) * 0.45;
        pen.tilt += (Math.max(-22, Math.min(22, dx * 0.9)) - pen.tilt) * 0.2;
        this.els.pen.style.transform = `translate(${pen.x}px, ${pen.y}px) rotate(${pen.tilt}deg)`;
      }
    }

    if (this.blooms.length || this.sparks.length || this.hintId || this.hintShown || pen.vis) this.loop();
  };


  // ---------------------------------------------------------------- spray

  private sprayDots(rng: () => number, R: number, ax: number, ay: number, bx: number, by: number) {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.round(len === 0 ? 34 : 6 + len * 0.9);
    const sc = Math.max(this.W, this.H) / 1000;
    const dots: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = rng(), a = rng() * Math.PI * 2, d = R * Math.sqrt(rng()), r = (1.3 + rng() * 2.8) * sc;
      dots.push(ax + (bx - ax) * t + Math.cos(a) * d, ay + (by - ay) * t + Math.sin(a) * d, r);
    }
    return dots;
  }

  private paintDots(id: number, c: string, dots: number[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < dots.length; i += 3) {
      minX = Math.min(minX, dots[i]); maxX = Math.max(maxX, dots[i]);
      minY = Math.min(minY, dots[i + 1]); maxY = Math.max(maxY, dots[i + 1]);
    }
    if (!dots.length) return;
    this.paintMasked(id, minX - 6, minY - 6, maxX - minX + 12, maxY - minY + 12, (s) => {
      s.fillStyle = paintStyle(s, c);
      s.beginPath();
      for (let i = 0; i < dots.length; i += 3) {
        s.moveTo(dots[i] + dots[i + 2], dots[i + 1]);
        s.arc(dots[i], dots[i + 1], dots[i + 2], 0, Math.PI * 2);
      }
      s.fill();
    });
  }

  // ---------------------------------------------------------------- trace step

  get tracing() {
    return !!this.trace;
  }

  /** start the "follow the dotted lines" step: outline shows as dots until the child traces it */
  startTrace() {
    if (!this.p || this.trace) return;
    const W = this.W, H = this.H, o = this.p.outline;
    const tw = Math.ceil(W / TCELL), th = Math.ceil(H / TCELL);
    const ink = new Uint8Array(tw * th);
    let total = 0;
    for (let gy = 0; gy < th; gy++) {
      for (let gx = 0; gx < tw; gx++) {
        let hit = false;
        for (const [dx, dy] of [[5, 5], [2, 2], [8, 2], [2, 8], [8, 8]]) {
          const x = Math.min(W - 1, gx * TCELL + dx), y = Math.min(H - 1, gy * TCELL + dy);
          if (o[(y * W + x) * 4 + 3] > 150) { hit = true; break; }
        }
        if (hit) { ink[gy * tw + gx] = 1; total++; }
      }
    }
    if (!total) return;
    // dotted guide = outline kept only where a dot pattern is
    const guide = document.createElement('canvas');
    guide.width = W;
    guide.height = H;
    const g = guide.getContext('2d')!;
    g.drawImage(this.p.outlineCanvas, 0, 0);
    const dot = document.createElement('canvas');
    dot.width = dot.height = 16;
    const d = dot.getContext('2d')!;
    d.beginPath();
    d.arc(8, 8, 4.5, 0, Math.PI * 2);
    d.fill();
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = g.createPattern(dot, 'repeat')!;
    g.fillRect(0, 0, W, H);
    const mask = document.createElement('canvas');
    mask.width = W;
    mask.height = H;
    const R = Math.round(Math.max(W, H) * (this.settings.brushFrac > 0.05 ? 0.045 : 0.032));
    this.trace = { ink, revealed: new Uint8Array(tw * th), total, got: 0, tw, th, guide, mask, mctx: mask.getContext('2d')!, R };
    this.traceRedraw(0, 0, W, H);
    this.hintId = 0;
    this.cb.onTrace?.(0, false);
  }

  /** test hook: centres of the outline cells a child has to trace */
  traceTargets(): [number, number][] {
    const t = this.trace;
    if (!t) return [];
    const out: [number, number][] = [];
    for (let i = 0; i < t.ink.length; i++) if (t.ink[i]) out.push([(i % t.tw) * TCELL + 5, ((i / t.tw) | 0) * TCELL + 5]);
    return out;
  }

  private traceRedraw(x0: number, y0: number, x1: number, y1: number) {
    const t = this.trace!;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(this.W, Math.ceil(x1)); y1 = Math.min(this.H, Math.ceil(y1));
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const o = this.els.outline.getContext('2d')!, s = this.sctx;
    s.save();
    s.beginPath(); s.rect(x0, y0, w, h); s.clip();
    s.clearRect(x0, y0, w, h);
    s.drawImage(this.p.outlineCanvas, 0, 0);
    s.globalCompositeOperation = 'destination-in';
    s.drawImage(t.mask, 0, 0);
    s.restore();
    o.clearRect(x0, y0, w, h);
    o.globalAlpha = 0.6;
    o.drawImage(t.guide, x0, y0, w, h, x0, y0, w, h);
    o.globalAlpha = 1;
    o.drawImage(this.scratch, x0, y0, w, h, x0, y0, w, h);
  }

  private traceSegment(ax: number, ay: number, bx: number, by: number) {
    const t = this.trace;
    if (!t) return;
    const R = t.R, m = t.mctx;
    m.strokeStyle = m.fillStyle = '#000';
    m.lineWidth = R * 2;
    m.lineCap = 'round';
    m.beginPath();
    if (ax === bx && ay === by) { m.arc(ax, ay, R, 0, Math.PI * 2); m.fill(); }
    else { m.moveTo(ax, ay); m.lineTo(bx, by); m.stroke(); }
    const gx0 = Math.max(0, Math.floor((Math.min(ax, bx) - R) / TCELL)), gx1 = Math.min(t.tw - 1, Math.floor((Math.max(ax, bx) + R) / TCELL));
    const gy0 = Math.max(0, Math.floor((Math.min(ay, by) - R) / TCELL)), gy1 = Math.min(t.th - 1, Math.floor((Math.max(ay, by) + R) / TCELL));
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const c = gy * t.tw + gx;
      if (!t.ink[c] || t.revealed[c]) continue;
      const px = gx * TCELL + 5, py = gy * TCELL + 5;
      let k = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      if ((ax + k * dx - px) ** 2 + (ay + k * dy - py) ** 2 > R * R) continue;
      t.revealed[c] = 1;
      t.got++;
    }
    this.traceRedraw(Math.min(ax, bx) - R - 2, Math.min(ay, by) - R - 2, Math.max(ax, bx) + R + 2, Math.max(ay, by) + R + 2);
    const frac = t.got / t.total;
    this.cb.onTrace?.(frac, false);
    if (frac >= TRACE_DONE) this.finishTrace(true, bx, by);
  }

  /** complete the trace step (animate = sweep the rest of the outline in) */
  finishTrace(animate = false, x = this.W / 2, y = this.H / 2) {
    const t = this.trace;
    if (!t || t.finishing) return;
    t.finishing = true;
    sfx.scratchStop();
    if (this.mode === 'trace') this.mode = 'consumed';
    const done = () => {
      this.trace = null;
      const o = this.els.outline.getContext('2d')!;
      o.clearRect(0, 0, this.W, this.H);
      o.drawImage(this.p.outlineCanvas, 0, 0);
      for (let i = 0; i < 6; i++) this.sparkle(this.W * (0.2 + 0.6 * Math.random()), this.H * (0.2 + 0.6 * Math.random()), '#ffd54f', 6);
      sfx.sparkle();
      sfx.pop(0.4);
      this.loop();
      this.cb.onTrace?.(1, true);
      this.bumpIdle();
    };
    if (!animate) return done();
    const rMax = Math.hypot(Math.max(x, this.W - x), Math.max(y, this.H - y));
    const t0 = performance.now();
    const step = (now: number) => {
      if (this.destroyed || !this.trace) return;
      const k = clamp01((now - t0) / 450);
      try {
        t.mctx.beginPath();
        t.mctx.arc(x, y, Math.max(1, rMax * easeOut(k)), 0, Math.PI * 2);
        t.mctx.fill();
        this.traceRedraw(0, 0, this.W, this.H);
      } catch {
        return done(); // never leave the child stuck on the dotted lines
      }
      if (k < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------- time-lapse replay

  private redrawAll() {
    this.cctx.clearRect(0, 0, this.W, this.H);
    this.clearWet();
    this.done.fill(0);
    this.hasPaint.fill(0);
    this.solid.fill(null);
    this.solidB.fill(undefined);
    this.cellColor.fill(0);
    this.covered.fill(0);
    for (const a of this.actions) this.applyInstant(a);
  }

  private animate(ms: number, step: (k: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const f = (now: number) => {
        if (this.destroyed || this.skipReplay) return resolve();
        const k = clamp01((now - t0) / ms);
        step(k);
        if (k < 1) requestAnimationFrame(f);
        else resolve();
      };
      requestAnimationFrame(f);
    });
  }

  /** replays the whole page as a time-lapse (tap to skip); ends in exactly the saved state */
  async replay(): Promise<void> {
    if (this.replaying || this.trace || !this.actions.length) return;
    this.finishBlooms();
    this.replaying = true;
    this.skipReplay = false;
    this.hintId = 0;
    const acts = this.actions.slice();
    this.cctx.clearRect(0, 0, this.W, this.H);
    const per = Math.max(90, Math.min(420, 7000 / acts.length));
    for (const a of acts) {
      if (this.skipReplay || this.destroyed) break;
      const r = this.region(a.r);
      if (!r) continue;
      if (a.t === 'fill') {
        const rMax = Math.max(Math.hypot(a.x - r.x0, a.y - r.y0), Math.hypot(a.x - r.x1, a.y - r.y1), Math.hypot(a.x - r.x1, a.y - r.y0), Math.hypot(a.x - r.x0, a.y - r.y1));
        await this.animate(Math.min(per, 320), (k) => {
          const rad = 4 + rMax * easeOut(k);
          this.paintMasked(a.r, a.x - rad, a.y - rad, rad * 2, rad * 2, (s) => {
            s.fillStyle = paintStyle(s, a.c);
            s.beginPath();
            s.arc(a.x, a.y, rad, 0, Math.PI * 2);
            s.fill();
            if (a.b) knockGrain(s, a.b, a.x - rad, a.y - rad, rad * 2, rad * 2);
          });
        });
        this.fillFull(a.r, a.c, a.b);
        this.sparkle(r.ax, r.ay, a.c, 6);
        sfx.pop(r.area / (this.W * this.H));
        this.loop();
      } else if (a.t === 'stroke') {
        const n = a.p.length / 2;
        if (BRUSHES[this.brushOf(a)].wet) {
          await this.animate(per, (k) => this.renderWet(a, false, Math.max(1, Math.round(n * k)) * 2));
          this.clearWet();
          this.renderWet(a, true);
        } else {
          let drawn = 0;
          await this.animate(per, (k) => {
            const upto = Math.max(1, Math.round(n * k));
            if (upto > drawn) {
              this.drawStrokeRange(a, drawn, upto);
              drawn = upto;
            }
          });
          if (drawn < n) this.drawStrokeRange(a, drawn, n);
        }
      } else if (a.t === 'stamp') {
        const n = a.p.length / 2;
        let drawn = 0;
        await this.animate(Math.min(per, 120 * n), (k) => {
          const upto = Math.max(1, Math.round(n * k));
          for (; drawn < upto; drawn++) this.placeStamp(a, drawn);
        });
        sfx.pop(0.004);
      } else if (a.t === 'spray') {
        const rng = mulberry32(a.s), segs: number[][] = [this.sprayDots(rng, a.w, a.p[0], a.p[1], a.p[0], a.p[1])];
        for (let i = 2; i < a.p.length; i += 2) segs.push(this.sprayDots(rng, a.w, a.p[i - 2], a.p[i - 1], a.p[i], a.p[i + 1]));
        let drawn = 0;
        await this.animate(per, (k) => {
          const upto = Math.round(segs.length * k);
          for (; drawn < upto; drawn++) this.paintDots(a.r, a.c, segs[drawn]);
        });
      } else {
        this.eraseRegion(a.r);
        this.sparkle(r.ax, r.ay, '#ffffff', 8);
        this.loop();
        await this.animate(per / 2, () => undefined);
      }
    }
    this.redrawAll();
    this.replaying = false;
    this.skipReplay = false;
    this.bumpIdle();
  }

  // ---------------------------------------------------------------- export

  async thumbnail(size = 360): Promise<Blob | null> {
    this.finishBlooms();
    const sc = size / Math.max(this.W, this.H);
    const c = document.createElement('canvas');
    c.width = Math.round(this.W * sc);
    c.height = Math.round(this.H * sc);
    const x = c.getContext('2d')!;
    x.fillStyle = '#fffdf8';
    x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingQuality = 'high';
    x.drawImage(this.els.color, 0, 0, c.width, c.height);
    x.drawImage(this.els.outline, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
  }

  /** test hook: colour of the painted layer at a page pixel */
  pixel(x: number, y: number): [number, number, number, number] {
    const d = this.cctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return [d[0], d[1], d[2], d[3]];
  }

  get prepared() {
    return this.p;
  }
}
