import { useEffect, useState } from 'react';
import { PAGE_BY_ID, pagesFor, type Category } from './content';
import { sfx } from './engine/audio';
import { PROFILES, type ProfileId } from './profiles';
import { get, persist, set } from './storage/db';
import { Coloring } from './ui/Coloring';
import { Home } from './ui/Home';
import { Picker } from './ui/Picker';

type Screen = { name: 'pick' } | { name: 'home' } | { name: 'color'; pageId: string };

interface Settings {
  muted: boolean;
}

export function App() {
  const [kid, setKid] = useState<ProfileId | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'pick' });
  const [category, setCategory] = useState<Category>('pictures');
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    void get<Settings>('settings').then((s) => {
      if (s) {
        setMuted(s.muted);
        sfx.setMuted(s.muted);
      }
    });
  }, []);

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    sfx.setMuted(m);
    void set('settings', { muted: m } satisfies Settings);
  };

  const profile = kid ? PROFILES[kid] : null;

  if (!profile || screen.name === 'pick') {
    return (
      <Picker
        onPick={(id) => {
          sfx.unlock();
          sfx.click();
          persist();
          setKid(id);
          setScreen({ name: 'home' });
        }}
      />
    );
  }

  if (screen.name === 'color') {
    const def = PAGE_BY_ID.get(screen.pageId)!;
    const list = pagesFor(def.kind === 'flag' ? 'flags' : 'pictures', profile.maxLevel);
    const next = list[(list.findIndex((p) => p.id === def.id) + 1) % list.length];
    return (
      <Coloring
        key={`${profile.id}:${def.id}`}
        profile={profile}
        def={def}
        muted={muted}
        toggleMute={toggleMute}
        onHome={() => setScreen({ name: 'home' })}
        onNext={() => setScreen({ name: 'color', pageId: next.id })}
      />
    );
  }

  return (
    <Home
      profile={profile}
      category={category}
      setCategory={(c) => {
        sfx.unlock();
        sfx.click();
        setCategory(c);
      }}
      onOpen={(id) => {
        sfx.unlock();
        sfx.click();
        setScreen({ name: 'color', pageId: id });
      }}
      onSwitchKid={() => setScreen({ name: 'pick' })}
      muted={muted}
      toggleMute={toggleMute}
    />
  );
}
