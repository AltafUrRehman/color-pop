import { useState } from 'react';
import { PAGE_BY_ID } from '../content';
import { makeZip } from '../engine/zip';
import { PROFILES, type ProfileId } from '../profiles';
import { FRAMED, useSettings } from '../settings';
import { delPrefix, entries } from '../storage/db';
import { HoldButton } from './HoldButton';
import { Avatar, BackIcon } from './icons';

const rnd = (n: number) => Math.floor(Math.random() * n);

function question() {
  const a = 6 + rnd(4), b = 6 + rnd(4), ans = a * b;
  const set = new Set([ans]);
  while (set.size < 4) set.add(ans + (rnd(2) ? 1 : -1) * (1 + rnd(9)));
  return { a, b, ans, choices: [...set].sort(() => Math.random() - 0.5) };
}

/** Grown-ups only: a times-table question a 3- or 7-year-old is unlikely to know. */
export function ParentGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [q, setQ] = useState(question);
  const [wrong, setWrong] = useState(false);
  return (
    <div className="modal" onClick={onCancel}>
      <div className={`sheet-card gate ${wrong ? 'shake' : ''}`} onClick={(e) => e.stopPropagation()} data-testid="gate">
        <h2>Grown-ups only</h2>
        <p className="gate-q" data-testid="gate-q">
          {q.a} × {q.b} = ?
        </p>
        <div className="gate-choices">
          {q.choices.map((n) => (
            <button
              key={n}
              data-testid={`gate-${n}`}
              onClick={() => {
                if (n === q.ans) onPass();
                else {
                  setWrong(true);
                  setTimeout(() => setWrong(false), 400);
                  setQ(question());
                }
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="text-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const safe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'picture';

export function Parent({ onBack, onChanged }: { onBack: () => void; onChanged: () => void }) {
  const { settings, update } = useSettings();
  const [msg, setMsg] = useState('');

  const toggle = (label: string, value: boolean, set: (v: boolean) => void, testid?: string) => (
    <label className="toggle" data-testid={testid}>
      <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} />
      <span className="switch" />
      {label}
    </label>
  );

  const exportAll = async () => {
    setMsg('Packing pictures…');
    // full-size pictures; a page only ever saved as a small thumbnail is exported at that size
    const byPage = new Map<string, Blob>();
    for (const prefix of ['thumb:', 'art:']) {
      for (const [k, b] of await entries<Blob>(prefix)) if (b instanceof Blob) byPage.set(k.slice(k.indexOf(':') + 1), b);
    }
    if (!byPage.size) {
      setMsg('No pictures yet.');
      return;
    }
    const used = new Map<string, number>();
    const files = [...byPage].sort(([a], [b]) => a.localeCompare(b)).map(([k, data]) => {
      const [pid, pageId] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
      const kid = settings.names[pid as ProfileId] || PROFILES[pid as ProfileId]?.label || pid;
      const base = `${safe(kid)}/${safe(PAGE_BY_ID.get(pageId)?.name ?? 'My drawing')}`;
      const n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      return { name: `${base}${n > 1 ? ` ${n}` : ''}.png`, data };
    });
    const zip = await makeZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip);
    a.download = 'color-pop-pictures.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    setMsg(`Saved ${files.length} pictures to your Downloads.`);
  };

  return (
    <div className="parent" data-testid="parent">
      <header className="parent-bar">
        <button className="round" onClick={onBack} aria-label="Back" data-testid="parent-back">
          <BackIcon />
        </button>
        <h1>Parent settings</h1>
      </header>
      <div className="parent-body">
        <section>
          <h2>Players</h2>
          {(Object.keys(PROFILES) as ProfileId[]).map((id) => {
            const p = PROFILES[id];
            return (
              <div className="player-row" key={id}>
                <div className="player-avatar" style={{ background: p.tint }}>
                  <Avatar kind={p.avatar} size={64} />
                </div>
                <div className="player-fields">
                  <input
                    className="name-input"
                    placeholder={`Name (shown as "${p.label}")`}
                    value={settings.names[id]}
                    maxLength={14}
                    data-testid={`name-${id}`}
                    onChange={(e) => update({ names: { ...settings.names, [id]: e.target.value } })}
                  />
                  {toggle('Magic colours on at the start', settings.magic[id], (v) => update({ magic: { ...settings.magic, [id]: v } }))}
                  {toggle('Trace the dotted lines first (pictures)', settings.trace[id], (v) => update({ trace: { ...settings.trace, [id]: v } }), `trace-${id}`)}
                  <div className="danger-row">
                    <HoldButton
                      className="danger"
                      label="Hold to reset progress"
                      ms={2000}
                      onHold={async () => {
                        await Promise.all([delPrefix(`progress:${id}:`), delPrefix(`thumb:${id}:`), delPrefix(`art:${id}:`)]);
                        setMsg(`${settings.names[id] || p.label}: progress reset.`);
                        onChanged();
                      }}
                    >
                      Hold to reset progress
                    </HoldButton>
                    <HoldButton
                      className="danger"
                      label="Hold to delete drawings"
                      ms={2000}
                      onHold={async () => {
                        await Promise.all(['drawing:', 'progress:', 'thumb:', 'art:'].map((k) => delPrefix(k === 'drawing:' ? `${k}${id}:` : `${k}${id}:my-`)));
                        setMsg(`${settings.names[id] || p.label}: drawings deleted.`);
                        onChanged();
                      }}
                    >
                      Hold to delete their drawings
                    </HoldButton>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
        <section>
          <h2>Sound</h2>
          {toggle('Sound on', settings.sound, (v) => update({ sound: v }))}
          {toggle('Soft background music', settings.music, (v) => update({ music: v }), 'music')}
          {toggle('Say colour and picture names out loud', settings.speak, (v) => update({ speak: v }))}
        </section>
        <section>
          <h2>Pictures</h2>
          <p className="hint">Finished and in-progress pictures, as full-size PNGs in one zip file.</p>
          {FRAMED ? (
            <p className="hint">Saving the zip works in the installed app (this preview can't download files).</p>
          ) : (
            <button className="pill" onClick={exportAll} data-testid="export">
              Save all pictures (zip)
            </button>
          )}
        </section>
        {msg && <p className="parent-msg" data-testid="parent-msg">{msg}</p>}
        <section className="about">
          <h2>About</h2>
          <p>Color Pop {__APP_VERSION__}. Everything stays on this device: no accounts, ads or tracking.</p>
          <p>Flags: flag-icons by Panayiotis Lipiridis (MIT licence). Pictures drawn for Color Pop.</p>
        </section>
      </div>
    </div>
  );
}
