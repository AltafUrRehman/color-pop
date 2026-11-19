import { useEffect, useMemo, useState } from 'react';
import { pagesFor, type Category } from '../content';
import type { PageDef } from '../content/types';
import { flagSize, flagSvg, pictureSvg, svgUrl } from '../engine/prepare';
import type { Profile } from '../profiles';
import { entries } from '../storage/db';
import type { SavedPage } from './Coloring';
import { Avatar, CrayonIcon, FlagIcon, SoundIcon, StarIcon } from './icons';

interface Props {
  profile: Profile;
  category: Category;
  setCategory: (c: Category) => void;
  onOpen: (id: string) => void;
  onSwitchKid: () => void;
  muted: boolean;
  toggleMute: () => void;
}

export function previewUrl(def: PageDef): string {
  if (def.kind === 'picture') return svgUrl(pictureSvg(def, 'line', 300));
  const [w, h] = flagSize(def, 300);
  return svgUrl(flagSvg(def, w, h));
}

export function Home({ profile, category, setCategory, onOpen, onSwitchKid, muted, toggleMute }: Props) {
  const pages = useMemo(() => pagesFor(category, profile.maxLevel), [category, profile.maxLevel]);
  const [saved, setSaved] = useState<Record<string, SavedPage>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    (async () => {
      const [prog, th] = await Promise.all([
        entries<SavedPage>(`progress:${profile.id}:`),
        entries<Blob>(`thumb:${profile.id}:`),
      ]);
      if (!alive) return;
      const s: Record<string, SavedPage> = {};
      for (const [k, v] of prog) s[k.split(':')[2]] = v;
      const t: Record<string, string> = {};
      for (const [k, v] of th) {
        if (!(v instanceof Blob)) continue;
        const u = URL.createObjectURL(v);
        urls.push(u);
        t[k.split(':')[2]] = u;
      }
      setSaved(s);
      setThumbs(t);
    })();
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [profile.id]);

  // stars earned across both categories
  const doneCount = Object.values(saved).filter((s) => s.done).length;

  return (
    <div className={`home ${profile.id}`}>
      <header className="bar">
        <button className="round avatar-btn" onClick={onSwitchKid} aria-label="Switch player" style={{ background: profile.tint }}>
          <Avatar kind={profile.avatar} size={64} />
        </button>
        <nav className="tabs">
          <button className={`tab ${category === 'pictures' ? 'on' : ''}`} onClick={() => setCategory('pictures')} aria-label="Pictures" data-testid="tab-pictures">
            <CrayonIcon />
          </button>
          <button className={`tab ${category === 'flags' ? 'on' : ''}`} onClick={() => setCategory('flags')} aria-label="Flags" data-testid="tab-flags">
            <FlagIcon />
          </button>
        </nav>
        <div className="stars-count" aria-label={`${doneCount} finished`}>
          <StarIcon size={38} />
          <span>{doneCount}</span>
        </div>
        <button className="round" onClick={toggleMute} aria-label={muted ? 'Sound on' : 'Sound off'}>
          <SoundIcon muted={muted} />
        </button>
      </header>
      <main className={`grid ${category}`}>
        {pages.map((p) => {
          const s = saved[p.id];
          const thumb = s && thumbs[p.id];
          return (
            <button key={p.id} className={`card ${s?.done ? 'done' : ''}`} onClick={() => onOpen(p.id)} data-testid={`page-${p.id}`}>
              <img src={thumb || previewUrl(p)} alt="" draggable={false} />
              {s?.done && (
                <span className="badge">
                  <StarIcon size={40} />
                </span>
              )}
              {profile.showNames && <span className="card-name">{p.name}</span>}
            </button>
          );
        })}
      </main>
    </div>
  );
}
