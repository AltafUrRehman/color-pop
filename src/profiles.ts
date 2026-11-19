import type { Level } from './content/types';

export type ProfileId = 'little' | 'big';

export interface Profile {
  id: ProfileId;
  /** the kid's name on the start screen (parent settings can override it) */
  label: string;
  avatar: 'chick' | 'lion';
  tint: string;
  /** highest page level shown */
  maxLevel: Level;
  /** start each page with "magic" colours (marker picks the right colour) */
  magicDefault: boolean;
  brushFrac: number;
  autoAt: number;
  hintAfterMs: number;
  showEraser: boolean;
  showDone: boolean;
  /** show page / country names (needs reading) */
  showNames: boolean;
  palette: string[];
}

const BIG_PALETTE = [
  '#e53935', '#fb8c00', '#fdd835', '#7cb342', '#2e7d32', '#4fc3f7', '#1e88e5',
  '#5e35b1', '#ec407a', '#f8bbd0', '#8d6e63', '#ffccbc', '#ffffff', '#212121',
];
const LITTLE_PALETTE = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#29b6f6', '#1e88e5', '#8e24aa', '#ec407a', '#8d6e63', '#212121'];

export const PROFILES: Record<ProfileId, Profile> = {
  // Ibrahim, 3½: tap-first, huge forgiving brush, magic colours on, nothing to read
  little: {
    id: 'little', label: 'Ibrahim', avatar: 'chick', tint: '#ffd54f', maxLevel: 1,
    magicDefault: true, brushFrac: 0.06, autoAt: 0.45, hintAfterMs: 2500,
    showEraser: false, showDone: false, showNames: false, palette: LITTLE_PALETTE,
  },
  // Fatima, 7: all pages, free colours by default, scribble to 80 %, eraser + done, names
  big: {
    id: 'big', label: 'Fatima', avatar: 'lion', tint: '#ff8a65', maxLevel: 3,
    magicDefault: false, brushFrac: 0.035, autoAt: 0.8, hintAfterMs: 6000,
    showEraser: true, showDone: true, showNames: true, palette: BIG_PALETTE,
  },
};
