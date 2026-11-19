import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PageDef } from '../content/types';
import { sfx } from '../engine/audio';
import { Board, type Action, type Tool } from '../engine/board';
import { preparePage } from '../engine/prepare';
import type { Profile } from '../profiles';
import { del, get, set } from '../storage/db';
import { Celebrate } from './Celebrate';
import { previewUrl } from './Home';
import { CheckIcon, EraserIcon, HomeIcon, Pen, SoundIcon, UndoIcon, WandIcon } from './icons';

export interface SavedPage {
  /** page version: progress is dropped if the artwork changes */
  v: string;
  actions: Action[];
  done: boolean;
  at: number;
}

interface Props {
  profile: Profile;
  def: PageDef;
  onHome: () => void;
  onNext: () => void;
  muted: boolean;
  toggleMute: () => void;
}

export function Coloring({ profile, def, onHome, onNext, muted, toggleMute }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLCanvasElement>(null);
  const outlineRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const penRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<Board | null>(null);
  const everDone = useRef(false);
  const saveTimer = useRef(0);

  const [ready, setReady] = useState(false);
  const [dims, setDims] = useState<[number, number]>(def.kind === 'flag' ? [4, 3] : [1, 1]);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const [tool, setTool] = useState<Tool>('paint');
  const [magic, setMagic] = useState(profile.magicDefault);
  const [color, setColor] = useState(profile.palette[0]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const key = `progress:${profile.id}:${def.id}`;
  const thumbKey = `thumb:${profile.id}:${def.id}`;

  useEffect(() => {
    let alive = true;
    let dirty = false;

    const save = async (b: Board, completed: boolean) => {
      dirty = false;
      if (!b.prepared) return;
      if (completed) everDone.current = true;
      if (!b.actions.length && !everDone.current) {
        await Promise.all([del(key), del(thumbKey)]);
        return;
      }
      const rec: SavedPage = { v: b.prepared.version, actions: b.actions.slice(), done: everDone.current, at: Date.now() };
      await set(key, rec);
      const blob = await b.thumbnail();
      if (blob) await set(thumbKey, blob);
    };

    const board = new Board(
      { color: colorRef.current!, hint: hintRef.current!, outline: outlineRef.current!, fx: fxRef.current!, pen: penRef.current!, stage: sheetRef.current! },
      { brushFrac: profile.brushFrac, autoAt: profile.autoAt, hintAfterMs: profile.hintAfterMs },
      {
        onChange: (actions, done, total) => {
          setProgress({ done, total });
          setCanUndo(actions.length > 0);
          dirty = true;
          clearTimeout(saveTimer.current);
          saveTimer.current = window.setTimeout(() => void save(board, false), 700);
        },
        onComplete: () => {
          sfx.chime();
          clearTimeout(saveTimer.current);
          void save(board, true);
          setCelebrate(true);
        },
      },
    );
    board.setMagic(profile.magicDefault);
    board.setColor(profile.palette[0]);
    boardRef.current = board;

    (async () => {
      const [p, saved] = await Promise.all([preparePage(def), get<SavedPage>(key)]);
      if (!alive) return;
      everDone.current = !!saved?.done;
      setDims([p.w, p.h]);
      board.load(p, saved && saved.v === p.version ? saved.actions : []);
      setProgress(board.progress);
      setCanUndo(board.actions.length > 0);
      setReady(true);
      if (location.search.includes('test')) Object.assign(window, { __board: board, __prepMs: p.ms });
    })();

    return () => {
      alive = false;
      clearTimeout(saveTimer.current);
      if (dirty) void save(board, false);
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
    setColor(c);
    setMagic(false);
    setTool('paint');
  };

  const finish = () => {
    sfx.unlock();
    sfx.chime();
    setCelebrate(true);
    const b = boardRef.current;
    if (b) {
      everDone.current = true;
      void set(key, { v: b.prepared.version, actions: b.actions.slice(), done: true, at: Date.now() } satisfies SavedPage);
      void b.thumbnail().then((blob) => blob && set(thumbKey, blob));
    }
  };

  const pct = progress.total ? progress.done / progress.total : 0;

  return (
    <div className={`coloring ${profile.id}`}>
      <aside className="tools">
        <button className="round" onClick={onHome} aria-label="Home" data-testid="home">
          <HomeIcon />
        </button>
        <button className="round" onClick={() => boardRef.current?.undo()} disabled={!canUndo} aria-label="Undo" data-testid="undo">
          <UndoIcon />
        </button>
        <button
          className={`round magic ${magic && tool === 'paint' ? 'on' : ''}`}
          onClick={() => {
            sfx.unlock();
            sfx.sparkle();
            setMagic((m) => !(m && tool === 'paint'));
            setTool('paint');
          }}
          aria-label="Magic colours"
          data-testid="magic"
        >
          <WandIcon />
        </button>
        {profile.showEraser && (
          <button className={`round ${tool === 'erase' ? 'on' : ''}`} onClick={() => setTool((t) => (t === 'erase' ? 'paint' : 'erase'))} aria-label="Eraser" data-testid="eraser">
            <EraserIcon />
          </button>
        )}
        <span className="spacer" />
        <button className="round" onClick={toggleMute} aria-label={muted ? 'Sound on' : 'Sound off'}>
          <SoundIcon muted={muted} />
        </button>
        {profile.showDone && (
          <button className="round done-btn" onClick={finish} aria-label="Finished" data-testid="done">
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
          <div className="progress" aria-hidden>
            <div style={{ width: `${pct * 100}%` }} />
          </div>
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

      <aside className="side">
        {def.kind === 'flag' && (
          <div className="reference">
            <img src={previewUrl(def)} alt="" />
            {profile.showNames && <span>{def.name}</span>}
          </div>
        )}
        <div className={`palette ${magic && tool === 'paint' ? 'magic-on' : ''}`}>
          {profile.palette.map((c) => (
            <button
              key={c}
              className={`swatch ${!magic && tool === 'paint' && color === c ? 'sel' : ''}`}
              style={{ background: c }}
              onClick={() => pick(c)}
              aria-label={`colour ${c}`}
              data-testid={`swatch-${c}`}
            />
          ))}
        </div>
      </aside>

      {celebrate && (
        <Celebrate
          name={profile.showNames ? def.name : undefined}
          onHome={onHome}
          onNext={onNext}
          onStay={() => setCelebrate(false)}
        />
      )}
    </div>
  );
}
