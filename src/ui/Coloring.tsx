import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ALL_PICTURES } from '../content';
import type { PageDef } from '../content/types';
import { sfx } from '../engine/audio';
import { Board, type Action, type Tool } from '../engine/board';
import { paintName, SPECIALS, swatchBackground } from '../engine/paints';
import { preparePage } from '../engine/prepare';
import { say } from '../engine/speech';
import type { Profile } from '../profiles';
import { useSettings } from '../settings';
import { del, get, set } from '../storage/db';
import { Celebrate, type News } from './Celebrate';
import { previewUrl } from './Home';
import { CheckIcon, EraserIcon, HomeIcon, LockIcon, Pen, PlayIcon, SkipIcon, SoundIcon, SprayIcon, UndoIcon, WandIcon } from './icons';

export interface SavedPage {
  /** page version: progress is dropped if the artwork changes */
  v: string;
  actions: Action[];
  done: boolean;
  at: number;
  /** trace step finished */
  traced?: boolean;
}

interface Props {
  profile: Profile;
  def: PageDef;
  stars: number;
  /** a page was finished for the first time */
  onEarned: () => void;
  autoReplay?: boolean;
  onHome: () => void;
  onNext: () => void;
}

/** what a new star unlocks */
function unlocksAt(stars: number, profile: Profile): News[] {
  return [
    ...SPECIALS.filter((s) => s.unlockAt === stars).map((s) => ({ kind: 'paint' as const, id: s.id, name: s.name })),
    ...ALL_PICTURES.filter((p) => p.surprise === stars && p.level <= profile.maxLevel).map((p) => ({ kind: 'page' as const, id: p.id, name: p.name, img: previewUrl(p) })),
  ];
}

export function Coloring({ profile, def, stars, onEarned, autoReplay, onHome, onNext }: Props) {
  const { settings, update } = useSettings();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLCanvasElement>(null);
  const outlineRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const penRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<Board | null>(null);
  const everDone = useRef(false);
  const traced = useRef(false);
  const saveTimer = useRef(0);
  const saveRef = useRef<(completed: boolean, final?: boolean) => Promise<void>>(async () => undefined);

  const [ready, setReady] = useState(false);
  const [dims, setDims] = useState<[number, number]>(def.kind === 'flag' ? [4, 3] : def.kind === 'drawing' ? [def.w, def.h] : [1, 1]);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const [tool, setTool] = useState<Tool>('paint');
  const [magic, setMagic] = useState(settings.magic[profile.id]);
  const [color, setColor] = useState(profile.palette[0]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const [celebrate, setCelebrate] = useState<News[] | null>(null);
  const [tracing, setTracing] = useState(false);
  const [traceProg, setTraceProg] = useState(0);
  const [replaying, setReplaying] = useState(false);

  const key = `progress:${profile.id}:${def.id}`;
  const thumbKey = `thumb:${profile.id}:${def.id}`;
  const artKey = `art:${profile.id}:${def.id}`;

  const finishPage = (board: Board) => {
    const first = !everDone.current;
    sfx.chime();
    clearTimeout(saveTimer.current);
    void saveRef.current(true);
    if (settings.speak) say(def.kind === 'drawing' ? 'Well done!' : `${def.name}! Well done!`);
    if (first) onEarned();
    setCelebrate(first ? unlocksAt(stars + 1, profile) : []);
    void board;
  };

  useEffect(() => {
    let alive = true;
    let dirty = false;
    /** painted since the full-size picture (for the parent's export) was last written */
    let artDirty = false;

    const board = new Board(
      { color: colorRef.current!, hint: hintRef.current!, outline: outlineRef.current!, fx: fxRef.current!, pen: penRef.current!, stage: sheetRef.current! },
      { brushFrac: profile.brushFrac, autoAt: profile.autoAt, hintAfterMs: profile.hintAfterMs },
      {
        onChange: (actions, done, total) => {
          setProgress({ done, total });
          setCanUndo(actions.length > 0);
          dirty = true;
          artDirty = true;
          clearTimeout(saveTimer.current);
          saveTimer.current = window.setTimeout(() => void saveRef.current(false), 700);
        },
        onComplete: () => finishPage(board),
        onTrace: (p, done) => {
          setTraceProg(p);
          if (done) {
            traced.current = true;
            setTracing(false);
            dirty = true;
            void saveRef.current(false);
          }
        },
      },
    );

    saveRef.current = async (completed: boolean, final = false) => {
      dirty = false;
      const b = board;
      if (!b.prepared) return;
      if (completed) everDone.current = true;
      if (!b.actions.length && !everDone.current) {
        artDirty = false;
        if (traced.current) await set(key, { v: b.prepared.version, actions: [], done: false, at: Date.now(), traced: true } satisfies SavedPage);
        else await del(key);
        await Promise.all([del(thumbKey), del(artKey)]);
        return;
      }
      const rec: SavedPage = { v: b.prepared.version, actions: b.actions.slice(), done: everDone.current, at: Date.now(), traced: traced.current };
      // snapshot the canvases now: on leaving the page the board is torn down right after this call
      const thumbP = b.thumbnail();
      const artP = completed || (final && artDirty) ? b.thumbnail(Math.max(b.prepared.w, b.prepared.h)) : null;
      if (artP) artDirty = false;
      await set(key, rec);
      const thumb = await thumbP;
      if (thumb) await set(thumbKey, thumb);
      const art = await artP;
      if (art) await set(artKey, art);
    };
    // closing the app or switching away also keeps the full-size picture up to date
    const onHide = () => {
      if (document.visibilityState === 'hidden' && (dirty || artDirty)) {
        clearTimeout(saveTimer.current);
        void saveRef.current(false, true);
      }
    };
    document.addEventListener('visibilitychange', onHide);

    board.setMagic(settings.magic[profile.id]);
    board.setColor(profile.palette[0]);
    boardRef.current = board;

    (async () => {
      const [p, saved] = await Promise.all([preparePage(def), get<SavedPage>(key)]);
      if (!alive) return;
      const usable = saved && saved.v === p.version;
      everDone.current = !!(usable && saved.done);
      traced.current = !!(usable && saved.traced);
      setDims([p.w, p.h]);
      board.load(p, usable ? saved.actions : []);
      setProgress(board.progress);
      setCanUndo(board.actions.length > 0);
      setReady(true);
      if (def.kind === 'picture' && settings.trace[profile.id] && !traced.current && !board.actions.length) {
        board.startTrace();
        setTracing(board.tracing);
      }
      if (autoReplay && board.actions.length) {
        setReplaying(true);
        void board.replay().then(() => alive && setReplaying(false));
      }
      if (location.search.includes('test')) Object.assign(window, { __board: board, __prepMs: p.ms });
    })();

    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onHide);
      clearTimeout(saveTimer.current);
      if (dirty || artDirty) void saveRef.current(false, true);
      board.destroy();
      boardRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.id, profile.id]);

  useEffect(() => boardRef.current?.setTool(tool), [tool]);
  useEffect(() => boardRef.current?.setMagic(magic), [magic]);
  useEffect(() => boardRef.current?.setColor(color), [color]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const s = Math.min(el.clientWidth / dims[0], el.clientHeight / dims[1]);
      setSize([Math.floor(dims[0] * s), Math.floor(dims[1] * s)]);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        boardRef.current?.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (c: string) => {
    sfx.unlock();
    sfx.click();
    if (settings.speak) say(paintName(c));
    setColor(c);
    setMagic(false);
    if (tool === 'erase') setTool('paint');
  };

  const replay = () => {
    const b = boardRef.current;
    if (!b || !b.actions.length) return;
    setCelebrate(null);
    setReplaying(true);
    void b.replay().then(() => setReplaying(false));
  };

  const pct = tracing ? traceProg : progress.total ? progress.done / progress.total : 0;
  const busy = tracing || replaying;
  const specials = SPECIALS.filter((s) => profile.id === 'big' || stars >= s.unlockAt);

  return (
    <div className={`coloring ${profile.id}`}>
      <aside className="tools">
        <button className="round" onClick={onHome} aria-label="Home" data-testid="home">
          <HomeIcon />
        </button>
        {tracing ? (
          <button className="round" onClick={() => boardRef.current?.finishTrace(false)} aria-label="Skip tracing" data-testid="skip-trace">
            <SkipIcon />
          </button>
        ) : (
          <>
            <button className="round" onClick={() => boardRef.current?.undo()} disabled={!canUndo || busy} aria-label="Undo" data-testid="undo">
              <UndoIcon />
            </button>
            <button
              className={`round magic ${magic && tool !== 'erase' ? 'on' : ''}`}
              disabled={busy}
              onClick={() => {
                sfx.unlock();
                sfx.sparkle();
                if (settings.speak) say(magic ? '' : 'Magic colours!');
                setMagic((m) => !(m && tool !== 'erase'));
                if (tool === 'erase') setTool('paint');
              }}
              aria-label="Magic colours"
              data-testid="magic"
            >
              <WandIcon />
            </button>
            {profile.showEraser && (
              <button className={`round ${tool === 'erase' ? 'on' : ''}`} disabled={busy} onClick={() => setTool((t) => (t === 'erase' ? 'paint' : 'erase'))} aria-label="Eraser" data-testid="eraser">
                <EraserIcon />
              </button>
            )}
            {profile.showEraser && (
              <button className={`round ${tool === 'spray' ? 'on' : ''}`} disabled={busy} onClick={() => setTool((t) => (t === 'spray' ? 'paint' : 'spray'))} aria-label="Spray" data-testid="spray">
                <SprayIcon />
              </button>
            )}
          </>
        )}
        <span className="spacer" />
        <button className="round" onClick={() => update({ sound: !settings.sound })} aria-label={settings.sound ? 'Sound off' : 'Sound on'}>
          <SoundIcon muted={!settings.sound} />
        </button>
        {profile.showDone && !busy && (
          <button className="round done-btn" onClick={() => boardRef.current && finishPage(boardRef.current)} aria-label="Finished" data-testid="done">
            <CheckIcon />
          </button>
        )}
      </aside>

      <section className="stage-wrap" ref={wrapRef}>
        <div className="sheet" ref={sheetRef} style={{ width: size[0], height: size[1] }} data-ready={ready ? '1' : '0'}>
          <canvas ref={colorRef} className="layer" />
          <canvas ref={hintRef} className="layer" data-testid="hint" />
          <canvas ref={outlineRef} className="layer" />
          <canvas ref={fxRef} className="layer top" data-testid="canvas" />
          <div ref={penRef} className="pen">
            <Pen />
          </div>
          <div className={`progress ${tracing ? 'trace' : ''}`} aria-hidden>
            <div style={{ width: `${pct * 100}%` }} />
          </div>
          {tracing && (
            <div className="chip" data-testid="trace-chip">
              <span className="dotted" />
              {profile.showNames && 'Trace the dotted lines'}
            </div>
          )}
          {replaying && (
            <div className="chip" data-testid="replay-chip">
              <PlayIcon size={22} />
              {profile.showNames && 'Replay: tap to skip'}
            </div>
          )}
          {!ready && (
            <div className="loading">
              {def.kind === 'picture' && <img src={previewUrl(def)} alt="" />}
              <div className="dots">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className={`side ${busy ? 'dim' : ''}`}>
        {def.kind === 'flag' && (
          <div className="reference">
            <img src={previewUrl(def)} alt="" />
            {profile.showNames && <span>{def.name}</span>}
          </div>
        )}
        <div className={`palette ${magic && tool !== 'erase' ? 'magic-on' : ''} ${profile.palette.length + specials.length <= 10 ? 'cols2' : ''}`}>
          {profile.palette.map((c) => (
            <button
              key={c}
              className={`swatch ${!magic && tool !== 'erase' && color === c ? 'sel' : ''}`}
              style={{ background: c }}
              onClick={() => pick(c)}
              aria-label={paintName(c) || c}
              data-testid={`swatch-${c}`}
            />
          ))}
          {specials.map((s) => {
            const locked = stars < s.unlockAt;
            return (
              <button
                key={s.id}
                className={`swatch special ${locked ? 'locked' : ''} ${!locked && !magic && tool !== 'erase' && color === s.id ? 'sel' : ''}`}
                style={locked ? undefined : { background: swatchBackground(s.id) }}
                onClick={() => (locked ? settings.speak && say(`${s.unlockAt} stars`) : pick(s.id))}
                aria-label={locked ? `${s.name}: ${s.unlockAt} stars` : s.name}
                data-testid={`swatch-${s.id}`}
              >
                {locked && (
                  <span className="lock-num">
                    <LockIcon size={20} />
                    {s.unlockAt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {celebrate && (
        <Celebrate
          name={profile.showNames ? def.name : undefined}
          news={celebrate}
          showNames={profile.showNames}
          onHome={onHome}
          onNext={onNext}
          onReplay={replay}
          onStay={() => setCelebrate(null)}
        />
      )}
    </div>
  );
}
