import { FLAGS } from './flags';
import { PICTURES } from './pictures';
import type { Level, PageDef } from './types';

export type Category = 'pictures' | 'flags';

export const PAGES: PageDef[] = [...PICTURES, ...FLAGS];
export const PAGE_BY_ID = new Map(PAGES.map((p) => [p.id, p]));

export function pagesFor(category: Category, maxLevel: Level): PageDef[] {
  const list = category === 'flags' ? FLAGS : PICTURES;
  return list.filter((p) => p.level <= maxLevel);
}
