import { FLAGS } from './flags';
import { MANDALAS } from './mandalas';
import { PICTURES } from './pictures';
import { MORE_PICTURES } from './pictures2';
import { PICTURES3 } from './pictures3';
import { PICTURES4 } from './pictures4';
import type { Level, PageDef, PictureDef, Theme } from './types';

export type Category = 'pictures' | 'flags' | 'mine' | 'gallery';

const byLevel = <T extends { level: Level }>(list: T[]) =>
  list.map((p, i) => [p, i] as const).sort((a, b) => a[0].level - b[0].level || a[1] - b[1]).map(([p]) => p);

/** all built-in pictures, easiest first */
export const ALL_PICTURES: PictureDef[] = byLevel([...PICTURES, ...MORE_PICTURES, ...PICTURES3, ...PICTURES4, ...MANDALAS]);
export const ALL_FLAGS = byLevel(FLAGS);

export const PAGES: PageDef[] = [...ALL_PICTURES, ...ALL_FLAGS];
export const PAGE_BY_ID = new Map<string, PageDef>(PAGES.map((p) => [p.id, p]));

export function pagesFor(category: 'pictures' | 'flags', maxLevel: Level): PageDef[] {
  const list: PageDef[] = category === 'flags' ? ALL_FLAGS : ALL_PICTURES;
  return list.filter((p) => p.level <= maxLevel);
}

// themes of the pictures drawn before themes existed
const OLD_THEMES: Record<string, Theme> = {
  apple: 'fun', balloons: 'fun', sun: 'fun', fish: 'animals', icecream: 'fun', cat: 'animals', bear: 'animals', duck: 'animals',
  house: 'fun', car: 'vehicles', flower: 'fun', butterfly: 'animals', rocket: 'space', turtle: 'animals', owl: 'animals', robot: 'space',
  ladybug: 'animals', strawberry: 'fun', cupcake: 'fun', whale: 'animals', frog: 'animals', star: 'space', snail: 'animals', tree: 'fun',
  unicorn: 'fairy', dinosaur: 'space', crab: 'animals', train: 'vehicles', penguin: 'animals', 'hot-air-balloon': 'vehicles',
  castle: 'fairy', dragon: 'fairy',
};
export const themeOf = (p: PageDef): Theme => (p.kind === 'picture' ? p.theme ?? OLD_THEMES[p.id] ?? 'fun' : 'fun');

export const THEMES: { id: Theme; name: string }[] = [
  { id: 'animals', name: 'Animals' },
  { id: 'vehicles', name: 'Vehicles' },
  { id: 'fairy', name: 'Fairy tale' },
  { id: 'space', name: 'Space & dinos' },
  { id: 'patterns', name: 'Patterns' },
  { id: 'fun', name: 'Fun' },
];

