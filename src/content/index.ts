import { FLAGS } from './flags';
import { PICTURES } from './pictures';
import { MORE_PICTURES } from './pictures2';
import type { Level, PageDef, PictureDef } from './types';

export type Category = 'pictures' | 'flags' | 'mine' | 'gallery';

const byLevel = <T extends { level: Level }>(list: T[]) =>
  list.map((p, i) => [p, i] as const).sort((a, b) => a[0].level - b[0].level || a[1] - b[1]).map(([p]) => p);

/** all built-in pictures, easiest first; surprise pages last within their level */
export const ALL_PICTURES: PictureDef[] = byLevel([...PICTURES, ...MORE_PICTURES].sort((a, b) => (a.surprise ? 1 : 0) - (b.surprise ? 1 : 0)));
export const ALL_FLAGS = byLevel(FLAGS);

export const PAGES: PageDef[] = [...ALL_PICTURES, ...ALL_FLAGS];
export const PAGE_BY_ID = new Map<string, PageDef>(PAGES.map((p) => [p.id, p]));

export function pagesFor(category: 'pictures' | 'flags', maxLevel: Level): PageDef[] {
  const list: PageDef[] = category === 'flags' ? ALL_FLAGS : ALL_PICTURES;
  return list.filter((p) => p.level <= maxLevel);
}

export const isLocked = (p: PageDef, stars: number) => p.kind === 'picture' && !!p.surprise && stars < p.surprise;
