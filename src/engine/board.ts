import { sfx } from './audio';
import type { Prepared } from './prepare';

export type Tool = 'paint' | 'erase';

/** The action log is the source of truth for a page: saved, replayed on load, popped by undo. */
export type Action =
  | { t: 'fill'; r: number; c: string; x: number; y: number; auto?: 1 }
  | { t: 'stroke'; r: number; c: string; w: number; p: number[] }
  | { t: 'erase'; r: number };

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
}

export interface BoardElements {
  color: HTMLCanvasElement;
  /** glow for the next region to colour; sits between paint and lines */
  hint: HTMLCanvasElement;
  outline: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  pen: HTMLElement;
  stage: HTMLElement;
}

const CELL = 12; // coverage grid cell, page px
const TAP_SLOP = 8; // css px a press may wander and still count as a tap

interface Bloom { id: number; c: string; cx: number; cy: number; rMax: number; t0: number; dur: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number }

const easeOut = (k: number) => 1 - (1 - k) ** 3;

export class Board {
  private p!: Prepared;
  private W = 0;
  private H = 0;
  private cctx: CanvasRenderingContext2D;
  private fctx: CanvasRenderingContext2D;
  private hctx: CanvasRenderingContext2D;
  private hintShown = false;
  private scratch = document.createElement('canvas');
  private sctx: CanvasRenderingContext2D;
  private masks = new Map<number, HTMLCanvasElement>();

  actions: Action[] = [];
  private done = new Uint8Array(1);
  private hasPaint = new Uint8Array(1);
  private solid: (string | null)[] = [];

  private gw = 0;
  private gh = 0;
  private cellRegion = new Uint16Array(0);
  private cellColor = new Uint16Array(0);
  private regionCells: Int32Array[] = [];
  private colorIds = new Map<string, number>();

  tool: Tool = 'paint';
  color = '#e53935';
  magic = true;

  private pointerId: number | null = null;
  private mode: 'idle' | 'pending' | 'stroke' | 'consumed' | 'erase' = 'idle';
  private downClient = { x: 0, y: 0 };
  private downPage = { x: 0, y: 0 };
  private lastPage = { x: 0, y: 0 };
  private lastClient = { x: 0, y: 0, t: 0 };
  private stroke: Extract<Action, { t: 'stroke' }> | null = null;
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
    for (const c of [this.els.color, this.els.hint, this.els.outline, this.els.fx, this.scratch]) {
      c.width = W;
      c.height = H;
    }
    this.els.outline.getContext('2d')!.drawImage(p.outlineCanvas, 0, 0);
    const n = p.regions.length;
    this.done = new Uint8Array(n + 1);
    this.hasPaint = new Uint8Array(n + 1);
    this.solid = new Array(n + 1).fill(null);
    this.masks.clear();
    this.hintCanvas = null;

    this.gw = Math.ceil(W / CELL);
    this.gh = Math.ceil(H / CELL);
    this.cellRegion = new Uint16Array(this.gw * this.gh);
    this.cellColor = new Uint16Array(this.gw * this.gh);
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
  private paintMasked(id: number, x: number, y: number, w: number, h: number, draw: (s: CanvasRenderingContext2D) => void, target = this.cctx) {
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
    target.drawImage(this.scratch, x0, y0, bw, bh, x0, y0, bw, bh);
  }

  private fillFull(id: number, c: string) {
    const r = this.region(id);
    this.paintMasked(id, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, (s) => {
      s.fillStyle = c;
      s.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
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

  /** pts = flat [x0,y0,x1,y1,...]; a single point paints a dot */
  private paintPolyline(id: number, c: string, R: number, pts: number[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i]);
      minY = Math.min(minY, pts[i + 1]); maxY = Math.max(maxY, pts[i + 1]);
    }
    this.paintMasked(id, minX - R - 2, minY - R - 2, maxX - minX + 2 * R + 4, maxY - minY + 2 * R + 4, (s) => {
      s.fillStyle = c;
      s.strokeStyle = c;
      s.lineWidth = 2 * R;
      s.lineCap = 'round';
      s.lineJoin = 'round';
      s.beginPath();
      if (pts.length === 2) {
        s.arc(pts[0], pts[1], R, 0, Math.PI * 2);
        s.fill();
      } else {
        s.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]);
        s.stroke();
      }
    });
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
      this.fillFull(id, a.c);
      this.setCells(id, this.colorIndex(a.c));
      this.done[id] = 1;
      this.hasPaint[id] = 1;
      this.solid[id] = a.c;
    } else if (a.t === 'stroke') {
      const ci = this.colorIndex(a.c), p = a.p;
      if (p.length >= 2) {
        this.paintPolyline(id, a.c, a.w, p);
        this.markCells(id, ci, a.w, p[0], p[1], p[0], p[1]);
        for (let i = 2; i < p.length; i += 2) this.markCells(id, ci, a.w, p[i - 2], p[i - 1], p[i], p[i + 1]);
      }
      this.hasPaint[id] = 1;
      this.solid[id] = null;
    } else {
      this.eraseRegion(id);
      this.setCells(id, 0);
      this.done[id] = 0;
      this.hasPaint[id] = 0;
      this.solid[id] = null;
    }
  }

  private rebuildRegion(id: number) {
    this.eraseRegion(id);
    this.setCells(id, 0);
    this.done[id] = 0;
    this.hasPaint[id] = 0;
    this.solid[id] = null;
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
    if (!this.actions.length || this.pointerId !== null) return false;
    this.finishBlooms();
    const a = this.actions.pop()!;
    this.rebuildRegion(a.r);
    sfx.click();
    this.emitChange();
    this.checkComplete();
    this.bumpIdle();
    return true;
  }

  private startFill(id: number, c: string, x: number, y: number, auto: boolean) {
    this.finishBlooms(id);
    const a: Action = auto ? { t: 'fill', r: id, c, x: Math.round(x), y: Math.round(y), auto: 1 } : { t: 'fill', r: id, c, x: Math.round(x), y: Math.round(y) };
    this.actions.push(a);
    this.setCells(id, this.colorIndex(c));
    this.done[id] = 1;
    this.hasPaint[id] = 1;
    this.solid[id] = c;
    const r = this.region(id);
    const rMax = Math.max(Math.hypot(x - r.x0, y - r.y0), Math.hypot(x - r.x1, y - r.y0), Math.hypot(x - r.x0, y - r.y1), Math.hypot(x - r.x1, y - r.y1));
    const frac = r.area / (this.W * this.H);
    const dur = (auto ? 230 : 320) + 520 * Math.sqrt(frac);
    this.blooms.push({ id, c, cx: x, cy: y, rMax, t0: performance.now(), dur });
    sfx.bloom(dur / 1000);
    this.emitChange();
    this.loop();
  }

  private finishBlooms(onlyId?: number) {
    for (let i = this.blooms.length - 1; i >= 0; i--) {
      const b = this.blooms[i];
      if (onlyId !== undefined && b.id !== onlyId) continue;
      this.fillFull(b.id, b.c);
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
    if (this.tool === 'erase') {
      this.mode = 'erase';
      this.lastErased = 0;
      this.eraseAt(pt);
      this.showPen(e, '#ffffff');
      return;
    }
    this.mode = 'pending';
    const id = this.regionAt(pt.x, pt.y);
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
    if (this.mode === 'pending') {
      if (Math.hypot(e.clientX - this.downClient.x, e.clientY - this.downClient.y) < TAP_SLOP) return;
      this.beginStroke();
    }
    if (this.mode !== 'stroke' || !this.stroke) return;
    const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const list = evs.length ? evs : [e];
    const s = this.stroke, R = s.w, ci = this.colorIndex(s.c);
    const pts: number[] = [this.lastPage.x, this.lastPage.y];
    let gained = 0;
    for (const ev of list) {
      const pt = this.toPage(ev);
      if (Math.hypot(pt.x - this.lastPage.x, pt.y - this.lastPage.y) < 1.5) continue;
      gained += this.markCells(s.r, ci, R, this.lastPage.x, this.lastPage.y, pt.x, pt.y);
      pts.push(pt.x, pt.y);
      s.p.push(Math.round(pt.x), Math.round(pt.y));
      this.lastPage = pt;
    }
    if (pts.length > 2) this.paintPolyline(s.r, s.c, R, pts);
    this.strokeHits += gained;
    const dt = Math.max(1, e.timeStamp - this.lastClient.t);
    const v = Math.hypot(e.clientX - this.lastClient.x, e.clientY - this.lastClient.y) / dt;
    this.lastClient = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    sfx.scratchSpeed(v);
    const cells = this.regionCells[s.r].length;
    if (cells === 0 || this.strokeHits / cells >= this.settings.autoAt) this.autoComplete();
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    if (this.mode === 'pending') this.tapFill(this.downPage);
    else if (this.mode === 'stroke') this.endStroke();
    sfx.scratchStop();
    this.mode = 'idle';
    this.pen.hideAt = performance.now() + 200;
    this.bumpIdle();
  };

  private beginStroke() {
    const id = this.regionAt(this.downPage.x, this.downPage.y);
    if (!id || this.region(id).fixed) {
      this.mode = 'consumed';
      return;
    }
    this.finishBlooms(id);
    const c = this.colorFor(id);
    const ci = this.colorIndex(c);
    const R = Math.max(6, Math.round(this.settings.brushFrac * Math.max(this.W, this.H)));
    const x = Math.round(this.downPage.x), y = Math.round(this.downPage.y);
    this.stroke = { t: 'stroke', r: id, c, w: R, p: [x, y] };
    this.strokeHits = this.countCells(id, ci) + this.markCells(id, ci, R, x, y, x, y);
    this.paintPolyline(id, c, R, [x, y]);
    this.lastPage = { x, y };
    this.mode = 'stroke';
    this.setPenColor(c);
    sfx.scratchStart();
  }

  private endStroke() {
    const s = this.stroke;
    this.stroke = null;
    if (!s) return;
    this.actions.push(s);
    this.hasPaint[s.r] = 1;
    this.solid[s.r] = null;
    this.emitChange();
  }

  private autoComplete() {
    const s = this.stroke!;
    this.endStroke();
    sfx.scratchStop();
    this.mode = 'consumed';
    this.startFill(s.r, s.c, this.lastPage.x, this.lastPage.y, true);
  }

  private tapFill(pt: { x: number; y: number }) {
    const id = this.regionAt(pt.x, pt.y);
    if (!id || this.region(id).fixed) return;
    const c = this.colorFor(id);
    if (this.solid[id] === c && !this.blooms.some((b) => b.id === id)) {
      this.sparkle(pt.x, pt.y, c, 7);
      sfx.sparkle();
      this.loop();
      return;
    }
    this.startFill(id, c, pt.x, pt.y, false);
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
    if (!this.magic || !this.p || this.destroyed) return;
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
    let ended = false;
    for (let i = this.blooms.length - 1; i >= 0; i--) {
      const b = this.blooms[i];
      const k = Math.min(1, (now - b.t0) / b.dur);
      const rad = 6 + (b.rMax - 6) * easeOut(k);
      this.paintMasked(b.id, b.cx - rad, b.cy - rad, rad * 2, rad * 2, (s) => {
        s.fillStyle = b.c;
        s.beginPath();
        s.arc(b.cx, b.cy, rad, 0, Math.PI * 2);
        s.fill();
      });
      if (k >= 1) {
        this.fillFull(b.id, b.c);
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
