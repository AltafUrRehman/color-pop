import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_BY_ID, pagesFor, type Category } from './content';
import { loadDrawings } from './content/drawings';
import type { DrawingDef, PageDef } from './content/types';
import { sfx } from './engine/audio';
import { setSpeech } from './engine/speech';
import { PROFILES, type ProfileId } from './profiles';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, SettingsContext, type Settings } from './settings';
import { entries, persist } from './storage/db';
import { Coloring, type SavedPage } from './ui/Coloring';
import { Home } from './ui/Home';
import { Parent } from './ui/Parent';
import { Picker } from './ui/Picker';

type Screen = { name: 'pick' } | { name: 'parent' } | { name: 'home' } | { name: 'color'; pageId: string; replay?: boolean };

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [kid, setKid] = useState<ProfileId | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'pick' });
  const [category, setCategory] = useState<Category>('pictures');
  const [drawings, setDrawings] = useState<DrawingDef[]>([]);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  // sound, music and speech follow the settings
  useEffect(() => {
    sfx.setMuted(!settings.sound);
    sfx.setMusic(settings.sound && settings.music);
    setSpeech(settings.sound && settings.speak);
  }, [settings.sound, settings.music, settings.speak]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const refreshKid = useCallback(async (id: ProfileId) => {
    const [d, prog] = await Promise.all([loadDrawings(id), entries<SavedPage>(`progress:${id}:`)]);
    setDrawings(d);
    setStars(prog.filter(([, s]) => s?.done).length);
    return d;
  }, []);

  const profile = kid ? PROFILES[kid] : null;
  const findDef = (id: string): PageDef | undefined => PAGE_BY_ID.get(id) ?? drawings.find((d) => d.id === id);

  let body: React.ReactElement;
  if (screen.name === 'parent') {
    body = <Parent onBack={() => setScreen({ name: 'pick' })} onChanged={() => kid && void refreshKid(kid)} />;
  } else if (!profile || screen.name === 'pick') {
    body = (
      <Picker
        onParent={() => setScreen({ name: 'parent' })}
        onPick={(id) => {
          sfx.unlock();
          sfx.click();
          persist();
          setKid(id);
          void refreshKid(id);
          setScreen({ name: 'home' });
        }}
      />
    );
  } else if (screen.name === 'color' && findDef(screen.pageId)) {
    const def = findDef(screen.pageId)!;
    const list: PageDef[] = def.kind === 'drawing' ? drawings : pagesFor(def.kind === 'flag' ? 'flags' : 'pictures', profile.maxLevel);
    const playable = list.filter((p) => !(p.kind === 'picture' && p.surprise && stars < p.surprise));
    const next = playable[(playable.findIndex((p) => p.id === def.id) + 1) % Math.max(1, playable.length)] ?? def;
    body = (
      <Coloring
        key={`${profile.id}:${def.id}:${screen.replay ? 'r' : ''}`}
        profile={profile}
        def={def}
        stars={stars}
        autoReplay={screen.replay}
        onEarned={() => setStars((s) => s + 1)}
        onHome={() => setScreen({ name: 'home' })}
        onNext={() => setScreen({ name: 'color', pageId: next.id })}
      />
    );
  } else {
    body = (
      <Home
        profile={profile}
        category={category}
        stars={stars}
        drawings={drawings}
        setCategory={(c) => {
          sfx.unlock();
          sfx.click();
          setCategory(c);
        }}
        onOpen={(id, opts) => {
          sfx.unlock();
          sfx.click();
          setScreen({ name: 'color', pageId: id, replay: opts?.replay });
        }}
        onDrawingsChanged={(openId) => {
          void refreshKid(profile.id).then(() => {
            if (openId) setScreen({ name: 'color', pageId: openId });
          });
        }}
        onSwitchKid={() => setScreen({ name: 'pick' })}
      />
    );
  }

  return <SettingsContext.Provider value={{ settings, update }}>{body}</SettingsContext.Provider>;
}
