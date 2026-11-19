import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { pagesFor, THEMES, themeOf, type Category } from '../content';
import type { DrawingDef, PageDef, Theme } from '../content/types';
import { flagSize, flagSvg, pictureSvg, svgUrl } from '../engine/prepare';
import { say } from '../engine/speech';
import type { Profile } from '../profiles';
import { useSettings } from '../settings';
import { entries } from '../storage/db';
import type { SavedPage } from './Coloring';
import { Avatar, CrayonIcon, FlagIcon, GalleryIcon, MineIcon, PlayIcon, SoundIcon, StarIcon, ThemeIcon } from './icons';
import { MyDrawings } from './MyDrawings';

interface Props {
  profile: Profile;
  category: Category;
  setCategory: (c: Category) => void;
  onOpen: (id: string, opts?: { replay?: boolean }) => void;
  onSwitchKid: () => void;
  drawings: DrawingDef[];
  onDrawingsChanged: (openId?: string) => void;
  stars: number;
}

/** last picked theme per kid, kept while the app is open */
const lastTheme: Record<string, Theme | 'all'> = {};

export function previewUrl(def: PageDef): string {
  if (def.kind === 'picture') return svgUrl(pictureSvg(def, 'line', 300));
  if (def.kind === 'flag') {
    const [w, h] = flagSize(def, 300);
    return svgUrl(flagSvg(def, w, h));
  }
  return '';
}

export function Home({ profile, category, setCategory, onOpen, onSwitchKid, drawings, onDrawingsChanged, stars }: Props) {
  const { settings, update } = useSettings();
  const [theme, setThemeState] = useState<Theme | 'all'>(lastTheme[profile.id] ?? 'all');
  const setTheme = (t: Theme | 'all') => {
    lastTheme[profile.id] = t;
    setThemeState(t);
  };
  const allPages = useMemo(() => (category === 'pictures' || category === 'flags' ? pagesFor(category, profile.maxLevel) : []), [category, profile.maxLevel]);
  const themes = useMemo(() => THEMES.filter((t) => allPages.some((p) => p.kind === 'picture' && themeOf(p) === t.id)), [allPages]);
  const pages = category === 'pictures' && theme !== 'all' ? allPages.filter((p) => themeOf(p) === theme) : allPages;
  const [saved, setSaved] = useState<Record<string, SavedPage>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    (async () => {
      const [prog, th] = await Promise.all([entries<SavedPage>(`progress:${profile.id}:`), entries<Blob>(`thumb:${profile.id}:`)]);
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
  }, [profile.id, drawings]);

  const gallery = useMemo(
    () => Object.entries(saved).filter(([id, s]) => s.actions?.length && thumbs[id]).sort((a, b) => b[1].at - a[1].at).map(([id]) => id),
    [saved, thumbs],
  );

  const tab = (c: Category, icon: React.ReactElement, label: string) => (
    <button className={`tab ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)} aria-label={label} data-testid={`tab-${c}`}>
      {icon}
    </button>
  );

  return (
    <div className={`home ${profile.id}`}>
      <header className="bar">
        <button className="round avatar-btn" onClick={onSwitchKid} aria-label="Switch player" style={{ background: profile.tint }}>
          <Avatar kind={profile.avatar} size={64} />
        </button>
        <nav className="tabs">
          {tab('pictures', <CrayonIcon />, 'Pictures')}
          {tab('flags', <FlagIcon />, 'Flags')}
          {tab('mine', <MineIcon />, 'My drawings')}
          {tab('gallery', <GalleryIcon />, 'Gallery')}
        </nav>
        <div className="stars-count" aria-label={`${stars} stars`} data-testid="stars">
          <StarIcon size={38} />
          <span>{stars}</span>
        </div>
        <button className="round" onClick={() => update({ sound: !settings.sound })} aria-label={settings.sound ? 'Sound off' : 'Sound on'}>
          <SoundIcon muted={!settings.sound} />
        </button>
      </header>

      {category === 'mine' && <MyDrawings profile={profile} drawings={drawings} saved={saved} thumbs={thumbs} onOpen={(id) => onOpen(id)} onChanged={onDrawingsChanged} />}

      {category === 'gallery' && (
        <main className="grid gallery">
          {!gallery.length && (
            <div className="empty">
              <GalleryIcon />
              <p>Pictures you colour will appear here.</p>
            </div>
          )}
          {gallery.map((id) => (
            <button key={id} className={`card ${saved[id]?.done ? 'done' : ''}`} onClick={() => onOpen(id, { replay: true })} data-testid={`gallery-${id}`}>
              <img src={thumbs[id]} alt="" draggable={false} />
              <span className="play-badge">
                <PlayIcon size={30} />
              </span>
            </button>
          ))}
        </main>
      )}

      {category === 'pictures' && (
        <nav className="themes" aria-label="Themes">
          {[{ id: 'all' as const, name: 'All' }, ...themes].map((t) => (
            <button
              key={t.id}
              className={`theme ${theme === t.id ? 'on' : ''}`}
              onClick={() => {
                setTheme(t.id);
                if (settings.speak) say(t.name);
              }}
              aria-label={t.name}
              data-testid={`theme-${t.id}`}
            >
              <ThemeIcon theme={t.id} />
              {profile.showNames && <span>{t.name}</span>}
            </button>
          ))}
        </nav>
      )}

      {(category === 'pictures' || category === 'flags') && (
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
      )}
    </div>
  );
}
