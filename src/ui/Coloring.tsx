import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { themeOf } from '../content';
import type { PageDef } from '../content/types';
import { sfx } from '../engine/audio';
import { Board, type Action, type Tool } from '../engine/board';
import { isStamp } from '../engine/brushes';
import { paintName, SPECIALS, swatchBackground } from '../engine/paints';
import { preparePage } from '../engine/prepare';
import { say } from '../engine/speech';
import type { Profile } from '../profiles';
import { useSettings } from '../settings';
import { del, get, set } from '../storage/db';
import { Celebrate } from './Celebrate';
import { previewUrl } from './Home';
import { CheckIcon, EraserIcon, HomeIcon, Pen, PlayIcon, SkipIcon, SoundIcon, ToolIcon, UndoIcon, WandIcon } from './icons';

/** everything in the tool tray, in order */
const TOOLS: { id: Tool; name: string }[] = [
  { id: 'marker', name: 'Marker' },
  { id: 'felt', name: 'Felt pen' },
  { id: 'crayon', name: 'Crayon' },
  { id: 'pencil', name: 'Pencil' },
  { id: 'paint', name: 'Paintbrush' },
  { id: 'glitter', name: 'Glitter pen' },
  { id: 'neon', name: 'Neon pen' },
  { id: 'rainbow', name: 'Rainbow brush' },
  { id: 'spray', name: 'Spray can' },
  { id: 'stamp-star', name: 'Star stamp' },
  { id: 'stamp-heart', name: 'Heart stamp' },
  { id: 'stamp-flower', name: 'Flower stamp' },
  { id: 'stamp-paw', name: 'Paw stamp' },
  { id: 'stamp-smile', name: 'Smiley stamp' },
  { id: 'stamp-sparkle', name: 'Sparkle stamp' },
];

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
  /** a page was finished for the first time */
  onEarned: () => void;
  autoReplay?: boolean;
  onHome: () => void;
  onNext: () => void;
}

export function Coloring({ profile, def, onEarned, autoReplay, onHome, onNext }: Props) {
  const { settings, update } = useSettings();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLCanvasElement>(null);
  const wetRef = useRef<HTMLCanvasElement>(null);
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
  const [tool, setTool] = useState<Tool>('marker');
  /** last drawing tool, to go back to after the eraser */
  const [lastTool, setLastTool] = useState<Tool>('marker');
  const [tray, setTray] = useState(false);
  const [magic, setMagic] = useState(settings.magic[profile.id]);
  const [color, setColor] = useState(profile.palette[0]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
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
    setCelebrate(true);
    void board;
  };

  useEffect(() => {
    let alive = true;
    let dirty = false;
    /** painted since the full-size picture (for the parent's export) was last written */
    let artDirty = false;

    const board = new Board(
      { color: colorRef.current!, hint: hintRef.current!, wet: wetRef.current!, outline: outlineRef.current!, fx: fxRef.current!, pen: penRef.current!, stage: sheetRef.current! },
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
      // tracing a whole mandala would be a chore, so patterns skip the trace step
      if (def.kind === 'picture' && themeOf(def) !== 'patterns' && settings.trace[profile.id] && !traced.current && !board.actions.length) {
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
    if (tool === 'erase') setTool(lastTool);
  };

  const chooseTool = (t: Tool, name: string) => {
    sfx.unlock();
    sfx.click();
    if (settings.speak) say(name);
    setTool(t);
    setLastTool(t);
    setTray(false);
  };

  const replay = () => {
    const b = boardRef.current;
    if (!b || !b.actions.length) return;
    setCelebrate(false);
    setReplaying(true);
    void b.replay().then(() => setReplaying(false));
  };

  const pct = tracing ? traceProg : progress.total ? progress.done / progress.total : 0;
  const busy = tracing || replaying;
  const specials = SPECIALS;
  const current = TOOLS.find((t) => t.id === lastTool) ?? TOOLS[0];
  const tipColor = magic || color.startsWith('p:') ? '#ab47bc' : color;

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
                if (tool === 'erase') setTool(lastTool);
              }}
              aria-label="Magic colours"
              data-testid="magic"
            >
              <WandIcon />
            </button>
            <button
              className={`round tool-btn ${tray ? 'open' : ''}`}
              disabled={busy}
              onClick={() => {
                sfx.unlock();
                sfx.click();
                if (tool === 'erase') setTool(lastTool);
                setTray((o) => !o);
              }}
              aria-label={`Tools: ${current.name}`}
              data-testid="tools"
            >
              <ToolIcon tool={current.id} c={tipColor} size={48} />
            </button>
            {profile.showEraser && (
              <button className={`round ${tool === 'erase' ? 'on' : ''}`} disabled={busy} onClick={() => setTool((t) => (t === 'erase' ? lastTool : 'erase'))} aria-label="Eraser" data-testid="eraser">
                <EraserIcon />
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
          <canvas ref={wetRef} className="layer" />
          <canvas ref={outlineRef} className="layer" />
          <canvas ref={fxRef} className="layer top" data-testid="canvas" />
          <div ref={penRef} className="pen">
            <Pen tool={tool === 'erase' ? 'marker' : tool} />
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
          {specials.map((s) => (
            <button
              key={s.id}
              className={`swatch special ${!magic && tool !== 'erase' && color === s.id ? 'sel' : ''}`}
              style={{ background: swatchBackground(s.id) }}
              onClick={() => pick(s.id)}
              aria-label={s.name}
              data-testid={`swatch-${s.id}`}
            />
          ))}
        </div>
      </aside>

      {tray && (
        <div className="tray-backdrop" onClick={() => setTray(false)}>
          <div className="tray" onClick={(e) => e.stopPropagation()} data-testid="tray">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`tray-item ${tool === t.id ? 'on' : ''} ${isStamp(t.id) ? 'stamp' : ''}`}
                onClick={() => chooseTool(t.id, t.name)}
                aria-label={t.name}
                data-testid={`tool-${t.id}`}
              >
                <ToolIcon tool={t.id} c={t.id === 'rainbow' ? '#e53935' : tipColor} size={profile.showNames ? 50 : 60} />
                {profile.showNames && <span>{t.name}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {celebrate && (
        <Celebrate
          name={profile.showNames ? def.name : undefined}
          onHome={onHome}
          onNext={onNext}
          onReplay={replay}
          onStay={() => setCelebrate(false)}
        />
      )}
    </div>
  );
}
