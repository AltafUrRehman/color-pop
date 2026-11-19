import { createContext, useContext } from 'react';
import type { ProfileId } from './profiles';
import { get, set } from './storage/db';

export interface Settings {
  /** settings format; 2 = music on by default */
  v?: number;
  /** master sound switch (the speaker button) */
  sound: boolean;
  music: boolean;
  /** speak colour and picture names */
  speak: boolean;
  names: Record<ProfileId, string>;
  /** start pictures with the trace-the-dots step */
  trace: Record<ProfileId, boolean>;
  /** start pages with magic colours on */
  magic: Record<ProfileId, boolean>;
}

export const DEFAULT_SETTINGS: Settings = {
  v: 2,
  sound: true,
  music: true,
  speak: true,
  names: { little: '', big: '' },
  trace: { little: false, big: true },
  magic: { little: true, big: false },
};

export async function loadSettings(): Promise<Settings> {
  const s = await get<Partial<Settings> & { muted?: boolean }>('settings');
  if (!s) return DEFAULT_SETTINGS;
  const out: Settings = {
    ...DEFAULT_SETTINGS,
    ...s,
    names: { ...DEFAULT_SETTINGS.names, ...s.names },
    trace: { ...DEFAULT_SETTINGS.trace, ...s.trace },
    magic: { ...DEFAULT_SETTINGS.magic, ...s.magic },
  };
  if (typeof s.muted === 'boolean' && s.sound === undefined) out.sound = !s.muted; // v0.1 setting
  if (!s.v || s.v < 2) {
    // music used to start off; turn it on once, after that the parent's choice sticks
    out.music = true;
    out.v = 2;
  }
  return out;
}

export const saveSettings = (s: Settings) => set('settings', s);

export const SettingsContext = createContext<{ settings: Settings; update: (patch: Partial<Settings>) => void }>({
  settings: DEFAULT_SETTINGS,
  update: () => undefined,
});
export const useSettings = () => useContext(SettingsContext);

/** running inside someone else's page (e.g. a preview frame): downloads and the camera are usually blocked there */
export const FRAMED = (() => {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
})();
