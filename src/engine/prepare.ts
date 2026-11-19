import type { FlagDef, PageDef, PictureDef } from '../content/types';
import { segmentFlag, segmentLineArt, svgPalette, type Segmented } from './segment';

export interface Prepared extends Segmented {
  def: PageDef;
  version: string;
  outlineCanvas: HTMLCanvasElement;
  /** regions a child has to colour, biggest first (hint order) */
  order: number[];
  ms: number;
}

/** Long side of the working bitmap. 1000 px is sharper than the sheet on an 11-14" Chromebook screen
 *  and keeps first-open time around half a second on a budget CPU. */
export const PAGE_SIZE = 1000;

const STYLES = {
  // what the child sees before colouring; defines the regions
  line: '<style>.c{fill:#fff !important}.s{display:none}</style>',
  // the "answer key" for magic colours
  color: '<style>.s{display:none}</style>',
  // stickers (shines, blush, stars) that sit on top of the paint
  overlay: '<style>*{visibility:hidden}.s,.s *{visibility:visible}</style>',
};

export function pictureSvg(def: PictureDef, mode: keyof typeof STYLES, size = PAGE_SIZE): string {
  const sw = def.sw ?? 14;
  const style = STYLES[mode];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="${size}" height="${size}">${style}` +
    `<g stroke="#222228" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">${def.body}</g></svg>`
  );
}

export function flagSize(def: FlagDef, long = PAGE_SIZE): [number, number] {
  const m = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/.exec(def.svg);
  const vw = m ? parseFloat(m[1]) : 4, vh = m ? parseFloat(m[2]) : 3;
  return vw >= vh ? [long, Math.round((long * vh) / vw)] : [Math.round((long * vw) / vh), long];
}

export function flagSvg(def: FlagDef, w: number, h: number): string {
  return def.svg.replace('<svg', `<svg width="${w}" height="${h}" preserveAspectRatio="none"`);
}

export const svgUrl = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

async function loadSvg(svg: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = svgUrl(svg);
  await img.decode();
  return img;
}

async function rasterize(svg: string, w: number, h: number): Promise<Uint8ClampedArray> {
  const img = await loadSvg(svg);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const cache = new Map<string, Prepared>();
const MAX_CACHED = 6;

export async function preparePage(def: PageDef): Promise<Prepared> {
  const hit = cache.get(def.id);
  if (hit) {
    cache.delete(def.id);
    cache.set(def.id, hit); // LRU bump
    return hit;
  }
  const t0 = performance.now();
  let seg: Segmented;
  let version: string;
  if (def.kind === 'picture') {
    const [line, colored] = await Promise.all([
      rasterize(pictureSvg(def, 'line'), PAGE_SIZE, PAGE_SIZE),
      rasterize(pictureSvg(def, 'color'), PAGE_SIZE, PAGE_SIZE),
    ]);
    seg = segmentLineArt(line, colored, PAGE_SIZE, PAGE_SIZE, { background: def.bg });
    version = hashString(def.body + (def.sw ?? '') + def.bg + PAGE_SIZE);
  } else {
    const [w, h] = flagSize(def);
    const colored = await rasterize(flagSvg(def, w, h), w, h);
    seg = segmentFlag(colored, w, h, { palette: svgPalette(def.svg) });
    version = hashString(def.svg + PAGE_SIZE);
  }
  const ink = document.createElement('canvas');
  ink.width = seg.w;
  ink.height = seg.h;
  ink.getContext('2d')!.putImageData(new ImageData(seg.outline as Uint8ClampedArray<ArrayBuffer>, seg.w, seg.h), 0, 0);
  let outlineCanvas = ink;
  if (def.kind === 'picture' && def.body.includes('class="s"')) {
    // stickers go under the ink but above the paint
    outlineCanvas = document.createElement('canvas');
    outlineCanvas.width = seg.w;
    outlineCanvas.height = seg.h;
    const ctx = outlineCanvas.getContext('2d')!;
    ctx.drawImage(await loadSvg(pictureSvg(def, 'overlay')), 0, 0, seg.w, seg.h);
    ctx.drawImage(ink, 0, 0);
  }
  const order = seg.regions
    .filter((r) => !r.fixed && !r.optional)
    .sort((a, b) => b.area - a.area)
    .map((r) => r.id);
  const prepared: Prepared = { ...seg, def, version, outlineCanvas, order, ms: performance.now() - t0 };
  cache.set(def.id, prepared);
  while (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!);
  return prepared;
}
