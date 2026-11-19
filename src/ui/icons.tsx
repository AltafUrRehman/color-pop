import type { ReactNode } from 'react';

const S = ({ children, size = 40 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export const HomeIcon = () => (
  <S>
    <path d="M7 23 24 8l17 15" />
    <path d="M12 20v19h24V20" />
    <path d="M20 39V28h8v11" />
  </S>
);

export const UndoIcon = () => (
  <S>
    <path d="M17 12 8 21l9 9" />
    <path d="M9 21h18a11 11 0 0 1 0 22h-6" />
  </S>
);

export const WandIcon = () => (
  <S>
    <path d="M10 38 30 18" strokeWidth={6} />
    <path d="M33 6v6M30 9h6M40 16v5M37.5 18.5h5M22 6v4M20 8h4" strokeWidth={3.5} />
  </S>
);

export const EraserIcon = () => (
  <S>
    <path d="m20 40-9-9a3 3 0 0 1 0-4L28 10a3 3 0 0 1 4 0l9 9a3 3 0 0 1 0 4L24 40Z" />
    <path d="M18 21l13 13M20 40h20" />
  </S>
);

export const CheckIcon = () => (
  <S>
    <path d="M9 25l10 10 20-22" strokeWidth={6} />
  </S>
);

export const SoundIcon = ({ muted }: { muted: boolean }) => (
  <S>
    <path d="M8 19h8l10-8v26l-10-8H8Z" fill="currentColor" strokeWidth={3} />
    {muted ? <path d="m33 18 10 12M43 18 33 30" /> : <path d="M33 17a10 10 0 0 1 0 14M38 12a17 17 0 0 1 0 24" />}
  </S>
);

export const NextIcon = () => (
  <S size={52}>
    <path d="M10 24h26M26 13l11 11-11 11" strokeWidth={6} />
  </S>
);

export const CrayonIcon = () => (
  <svg width="54" height="54" viewBox="0 0 48 48" aria-hidden>
    <g transform="rotate(-40 24 24)" stroke="#333" strokeWidth="2" strokeLinejoin="round">
      <path d="M24 3 29 13H19Z" fill="#e53935" />
      <rect x="19" y="13" width="10" height="30" rx="2" fill="#ef5350" />
      <path d="M19 19h10M19 37h10" stroke="#b71c1c" strokeWidth="2.5" />
    </g>
    <circle cx="36" cy="36" r="6" fill="#fdd835" stroke="#333" strokeWidth="2" />
    <circle cx="11" cy="37" r="5" fill="#29b6f6" stroke="#333" strokeWidth="2" />
  </svg>
);

export const FlagIcon = () => (
  <svg width="54" height="54" viewBox="0 0 48 48" aria-hidden>
    <path d="M10 6v38" stroke="#5d4037" strokeWidth="4" strokeLinecap="round" />
    <path d="M12 8h26l-6 8 6 8H12Z" fill="#43a047" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 8h7v16h-7Z" fill="#fff" stroke="#333" strokeWidth="2" />
    <circle cx="27" cy="16" r="3.5" fill="#fff" />
  </svg>
);

export const StarIcon = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path d="M24 4l6 13 14 1.5-10.5 9.5 3 14L24 35l-12.5 7 3-14L4 18.5 18 17Z" fill="#ffca28" stroke="#e65100" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

/** big friendly avatars so a non-reader can find "their" button */
export const Avatar = ({ kind, size = 150 }: { kind: 'chick' | 'lion'; size?: number }) =>
  kind === 'chick' ? (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <g stroke="#2b2b30" strokeWidth="6" strokeLinejoin="round">
        <path d="M100 30c-6-14 4-22 12-16-2-10 12-12 12 0" fill="#ffca28" />
        <circle cx="100" cy="108" r="72" fill="#ffd54f" />
        <path d="M86 122h28l-14 20Z" fill="#fb8c00" />
      </g>
      <circle cx="74" cy="100" r="10" fill="#2b2b30" />
      <circle cx="126" cy="100" r="10" fill="#2b2b30" />
      <circle cx="77" cy="96" r="3.5" fill="#fff" />
      <circle cx="129" cy="96" r="3.5" fill="#fff" />
      <ellipse cx="56" cy="128" rx="13" ry="8" fill="#ff7b8a" opacity=".55" />
      <ellipse cx="144" cy="128" rx="13" ry="8" fill="#ff7b8a" opacity=".55" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <g stroke="#2b2b30" strokeWidth="6" strokeLinejoin="round">
        <circle cx="100" cy="104" r="86" fill="#e67e22" />
        <circle cx="52" cy="52" r="20" fill="#f6b26b" />
        <circle cx="148" cy="52" r="20" fill="#f6b26b" />
        <circle cx="100" cy="108" r="60" fill="#f6b26b" />
        <ellipse cx="100" cy="132" rx="30" ry="22" fill="#ffe0b2" />
        <path d="M90 120h20l-10 10Z" fill="#6d4c41" />
      </g>
      <circle cx="78" cy="98" r="9" fill="#2b2b30" />
      <circle cx="122" cy="98" r="9" fill="#2b2b30" />
      <circle cx="81" cy="94" r="3" fill="#fff" />
      <circle cx="125" cy="94" r="3" fill="#fff" />
      <path d="M90 142q10 8 20 0" stroke="#2b2b30" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );

/** the tool that follows the finger while painting; its tip sits at the element origin (22, 148) */
export const Pen = ({ tool = 'marker' }: { tool?: string }) => {
  const ink = { fill: 'var(--pen)' };
  const line = { stroke: '#333', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  let body: ReactNode;
  if (tool === 'crayon') {
    body = (
      <>
        <path d="M12 112 22 148 32 112Z" style={ink} {...line} />
        <rect x="10" y="20" width="24" height="94" rx="4" style={ink} {...line} />
        <rect x="10" y="44" width="24" height="44" fill="#fff" opacity=".85" {...line} />
        <path d="M10 52h24M10 80h24" stroke="var(--pen)" strokeWidth="3" />
      </>
    );
  } else if (tool === 'pencil') {
    body = (
      <>
        <path d="M14 116 22 148 30 116Z" fill="#ffcc80" {...line} />
        <path d="M19.5 138 22 148 24.5 138Z" style={ink} />
        <rect x="13" y="16" width="18" height="100" rx="2" fill="#fdd835" {...line} />
        <path d="M19 16v100M25 16v100" stroke="#f9a825" strokeWidth="2" />
        <rect x="13" y="6" width="18" height="12" rx="3" fill="#f48fb1" {...line} />
      </>
    );
  } else if (tool === 'paint' || tool === 'rainbow') {
    body = (
      <>
        <path d="M14 112c-2 14 4 28 8 36 4-8 10-22 8-36Z" style={tool === 'rainbow' ? { fill: 'url(#pen-rb)' } : ink} {...line} />
        <rect x="13" y="94" width="18" height="20" rx="2" fill="#cfd8dc" {...line} />
        <rect x="16" y="6" width="12" height="90" rx="6" fill="#a1662f" {...line} />
        <defs>
          <linearGradient id="pen-rb" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e53935" /><stop offset=".33" stopColor="#fdd835" /><stop offset=".66" stopColor="#43a047" /><stop offset="1" stopColor="#1e88e5" />
          </linearGradient>
        </defs>
      </>
    );
  } else if (tool === 'spray') {
    body = (
      <>
        <rect x="8" y="60" width="28" height="80" rx="8" style={ink} {...line} />
        <rect x="14" y="46" width="16" height="16" rx="3" fill="#eceff1" {...line} />
        <path d="M16 140h12" stroke="#333" strokeWidth="2.5" />
      </>
    );
  } else if (tool.startsWith('stamp')) {
    body = (
      <>
        <rect x="6" y="122" width="32" height="24" rx="5" style={ink} {...line} />
        <rect x="16" y="78" width="12" height="46" rx="3" fill="#a1662f" {...line} />
        <circle cx="22" cy="70" r="14" fill="#a1662f" {...line} />
      </>
    );
  } else {
    // marker, felt pen, glitter pen, neon pen
    const w = tool === 'marker' ? 32 : 22, x = 22 - w / 2;
    body = (
      <>
        <path d={tool === 'marker' ? 'M13 116 22 148 31 116Z' : 'M17 116 22 148 27 116Z'} style={ink} {...line} />
        <rect x={x + 4} y="92" width={w - 8} height="26" rx="3" fill="#f1f1f1" {...line} />
        <rect x={x} y="8" width={w} height="88" rx="11" style={ink} {...line} />
        <rect x={x + 5} y="14" width="6" height="70" rx="3" fill="#fff" opacity=".35" />
        {tool === 'glitter' && <path d="M22 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM20 60l1.5 3.5 3.5 1.5-3.5 1.5L20 70l-1.5-3.5L15 65l3.5-1.5Z" fill="#fff" />}
      </>
    );
  }
  return (
    <svg width="44" height="150" viewBox="0 0 44 150" className={tool === 'neon' ? 'neon' : undefined} aria-hidden>
      {body}
    </svg>
  );
};

/** buttons in the tool tray; `c` colours the tip */
export const ToolIcon = ({ tool, c, size = 52 }: { tool: string; c: string; size?: number }) => {
  const line = { stroke: '#333', strokeWidth: 2, strokeLinejoin: 'round' as const };
  const stamp = (d: ReactNode) => (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <g fill={c} {...line}>{d}</g>
    </svg>
  );
  switch (tool) {
    case 'stamp-star':
      return stamp(<path d="M24 5l5.6 12 13 1.4-9.7 8.8 2.7 12.8L24 33.6 12.4 40l2.7-12.8-9.7-8.8 13-1.4Z" />);
    case 'stamp-heart':
      return stamp(<path d="M24 42C10 32 5 24 8 16c3-7 12-8 16-1 4-7 13-6 16 1 3 8-2 16-16 26Z" />);
    case 'stamp-flower':
      return stamp(<>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx="24" cy="13" r="8" transform={`rotate(${a} 24 24)`} />)}<circle cx="24" cy="24" r="6" fill="#fff59d" /></>);
    case 'stamp-paw':
      return stamp(<><ellipse cx="24" cy="31" rx="10" ry="8.5" />{[[12, 21], [19, 12], [29, 12], [36, 21]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.6" />)}</>);
    case 'stamp-smile':
      return stamp(<><circle cx="24" cy="24" r="18" /><circle cx="18" cy="20" r="2.4" fill="#333" stroke="none" /><circle cx="30" cy="20" r="2.4" fill="#333" stroke="none" /><path d="M16 28c4 6 12 6 16 0" fill="none" strokeWidth="2.6" strokeLinecap="round" /></>);
    case 'stamp-sparkle':
      return stamp(<path d="M24 4l4 15 15 5-15 5-4 15-4-15-15-5 15-5Z" />);
    case 'spray':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
          <rect x="13" y="18" width="16" height="25" rx="4" fill={c} {...line} />
          <rect x="16" y="11" width="10" height="7" rx="2" fill="#eceff1" {...line} />
          {[[35, 8], [39, 13], [34, 16], [41, 7], [42, 18]].map(([x, y]) => <circle key={x * y} cx={x} cy={y} r="1.6" fill={c} />)}
        </svg>
      );
  }
  // brushes: drawn upright with the tip at the bottom, then tilted
  const ln = { stroke: '#333', strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  let t: ReactNode;
  switch (tool) {
    case 'felt':
    case 'glitter':
    case 'neon':
      t = (
        <>
          <rect x="20" y="3" width="8" height="31" rx="3" fill={c} {...ln} />
          <rect x="20.5" y="32" width="7" height="5" fill="#eee" {...ln} />
          <path d="M21.5 37 24 46 26.5 37Z" fill={c} {...ln} />
        </>
      );
      break;
    case 'crayon':
      t = (
        <>
          <rect x="17" y="6" width="14" height="29" rx="2" fill={c} {...ln} />
          <rect x="17" y="13" width="14" height="15" fill="#fff" {...ln} />
          <path d="M17 17h14M17 24h14" stroke={c} strokeWidth="2" />
          <path d="M18 35 24 46 30 35Z" fill={c} {...ln} />
        </>
      );
      break;
    case 'pencil':
      t = (
        <>
          <rect x="19" y="1" width="10" height="7" rx="2.5" fill="#f48fb1" {...ln} />
          <rect x="19" y="7" width="10" height="27" fill="#fdd835" {...ln} />
          <path d="M22.3 7v27M25.7 7v27" stroke="#f9a825" strokeWidth="1.4" />
          <path d="M19 34 24 45 29 34Z" fill="#ffcc80" {...ln} />
          <path d="M22.4 41.5 24 45.5 25.6 41.5Z" fill={c} />
        </>
      );
      break;
    case 'paint':
    case 'rainbow':
      t = (
        <>
          <rect x="21.5" y="1" width="5" height="25" rx="2.5" fill="#a1662f" {...ln} />
          <rect x="19.5" y="24" width="9" height="7" rx="1" fill="#cfd8dc" {...ln} />
          <path d="M19.5 31c-1.5 6 1.5 11 4.5 15 3-4 6-9 4.5-15Z" fill={tool === 'rainbow' ? 'url(#rb-grad)' : c} {...ln} />
        </>
      );
      break;
    default:
      // marker
      t = (
        <>
          <rect x="16.5" y="3" width="15" height="29" rx="4" fill={c} {...ln} />
          <rect x="18" y="31" width="12" height="5" fill="#eee" {...ln} />
          <path d="M18.5 36 21 46 30 41 29.5 36Z" fill={c} {...ln} />
          <rect x="19" y="6" width="3.5" height="22" rx="1.7" fill="#fff" opacity=".4" stroke="none" />
        </>
      );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="rb-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e53935" /><stop offset=".35" stopColor="#fdd835" /><stop offset=".65" stopColor="#43a047" /><stop offset="1" stopColor="#1e88e5" />
        </linearGradient>
      </defs>
      {tool === 'neon' && <circle cx="12" cy="37" r="11" fill={c} opacity=".28" />}
      <g transform="rotate(40 24 24)">{t}</g>
      {tool === 'glitter' && (
        <g fill="#ffca28" stroke="#333" strokeWidth="1" strokeLinejoin="round">
          <path d="M8 28l1.6 3.4 3.4 1.6-3.4 1.6L8 38l-1.6-3.4L3 33l3.4-1.6Z" />
          <path d="M17 41l1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
        </g>
      )}
    </svg>
  );
};

export const SprayIcon = () => (
  <S>
    <rect x="12" y="18" width="16" height="24" rx="4" />
    <path d="M16 18v-5h8v5M24 11h5" />
    <path d="M34 9h.01M38 13h.01M34 17h.01M40 7h.01M41 19h.01" strokeWidth={5} />
  </S>
);

export const GalleryIcon = () => (
  <svg width="54" height="54" viewBox="0 0 48 48" aria-hidden>
    <rect x="5" y="8" width="38" height="32" rx="4" fill="#fff8e1" stroke="#6d4c41" strokeWidth="3.5" />
    <rect x="10" y="13" width="28" height="22" rx="2" fill="#b3e5fc" stroke="#333" strokeWidth="2" />
    <path d="M10 33l8-9 6 6 5-4 9 8Z" fill="#66bb6a" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="31" cy="19" r="3" fill="#fdd835" stroke="#333" strokeWidth="1.5" />
  </svg>
);

export const CameraIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path d="M6 16a4 4 0 0 1 4-4h6l3-4h10l3 4h6a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z" fill="#90caf9" stroke="#333" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="24" cy="25" r="8" fill="#fff" stroke="#333" strokeWidth="2.5" />
    <circle cx="24" cy="25" r="3.5" fill="#1e88e5" />
  </svg>
);

export const PictureIcon = ({ size = 54 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <rect x="6" y="8" width="36" height="32" rx="4" fill="#fff" stroke="#333" strokeWidth="2.5" />
    <path d="M6 34l10-11 8 8 6-5 12 10" fill="none" stroke="#43a047" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="32" cy="17" r="4" fill="#fdd835" stroke="#333" strokeWidth="2" />
  </svg>
);

export const MineIcon = () => (
  <svg width="54" height="54" viewBox="0 0 48 48" aria-hidden>
    <rect x="8" y="6" width="30" height="36" rx="3" fill="#fff" stroke="#333" strokeWidth="2.5" />
    <path d="M14 30c3-6 6-10 9-6s5 1 8-4" fill="none" stroke="#e53935" strokeWidth="3" strokeLinecap="round" />
    <circle cx="20" cy="16" r="4" fill="none" stroke="#1e88e5" strokeWidth="2.5" />
    <g transform="rotate(35 36 34)"><rect x="33" y="22" width="7" height="20" rx="2" fill="#fdd835" stroke="#333" strokeWidth="2" /><path d="M33 42l3.5 5 3.5-5Z" fill="#333" /></g>
  </svg>
);

export const LockIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <rect x="9" y="21" width="30" height="22" rx="5" fill="#ffca28" stroke="#5d4037" strokeWidth="3.5" />
    <path d="M16 21v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#5d4037" strokeWidth="4.5" />
  </svg>
);

export const PlayIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path d="M15 9v30l25-15Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);

export const SkipIcon = () => (
  <S>
    <path d="M10 10l18 14-18 14Z" fill="currentColor" strokeWidth={3} />
    <path d="M36 10v28" strokeWidth={5} />
  </S>
);

export const GearIcon = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden>
    <circle cx="24" cy="24" r="6" />
    <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.2 4.2M33.3 33.3l4.2 4.2M10.5 37.5l4.2-4.2M33.3 14.7l4.2-4.2" strokeLinecap="round" />
    <circle cx="24" cy="24" r="13" />
  </svg>
);

export const TrashIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 13h32M18 13V8h12v5M12 13l2 28h20l2-28M20 20v14M28 20v14" />
  </svg>
);

export const PlusIcon = () => (
  <svg width="70" height="70" viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="20" fill="#66bb6a" stroke="#2e7d32" strokeWidth="2.5" />
    <path d="M24 14v20M14 24h20" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const BackIcon = () => (
  <S>
    <path d="M30 10 16 24l14 14" strokeWidth={6} />
  </S>
);

// ---------- picture themes (filter row on the pictures tab)
const T = ({ children }: { children: ReactNode }) => (
  <svg width="40" height="40" viewBox="0 0 48 48" stroke="#333" strokeWidth="2" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export const ThemeIcon = ({ theme }: { theme: string }) => {
  switch (theme) {
    case 'animals':
      return (
        <T>
          <ellipse cx="24" cy="32" rx="11" ry="9" fill="#a1887f" />
          {[[11, 21], [19, 13], [29, 13], [37, 21]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="4.5" ry="5.5" fill="#a1887f" />)}
        </T>
      );
    case 'vehicles':
      return (
        <T>
          <path d="M6 31v-7l5-9h20l6 9h5v7Z" fill="#e53935" />
          <path d="M14 17h7v7h-10ZM24 17h6l4 7H24Z" fill="#b3e5fc" />
          <circle cx="15" cy="32" r="5" fill="#333" /><circle cx="34" cy="32" r="5" fill="#333" />
        </T>
      );
    case 'fairy':
      return (
        <T>
          <path d="M8 36 5 14l10 9 9-14 9 14 10-9-3 22Z" fill="#fdd835" />
          <path d="M8 36h32v5H8Z" fill="#ffb300" />
          <circle cx="24" cy="29" r="3" fill="#e53935" />
        </T>
      );
    case 'space':
      return (
        <T>
          <path d="M24 4c8 6 10 16 7 28H17C14 20 16 10 24 4Z" fill="#eceff1" />
          <circle cx="24" cy="18" r="4" fill="#4fc3f7" />
          <path d="M17 26l-6 8 7 1M31 26l6 8-7 1" fill="#e53935" />
          <path d="M20 33l4 10 4-10Z" fill="#ff9800" />
        </T>
      );
    case 'patterns':
      return (
        <T>
          {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx="24" cy="12" rx="5" ry="9" fill={a % 120 ? '#ce93d8' : '#f48fb1'} transform={`rotate(${a} 24 24)`} />)}
          <circle cx="24" cy="24" r="6" fill="#fdd835" />
        </T>
      );
    case 'fun':
      return (
        <T>
          <path d="M24 36c-2 4 2 6 0 9" fill="none" />
          <ellipse cx="24" cy="19" rx="12" ry="15" fill="#e53935" />
          <path d="M21 34h6l-3 3Z" fill="#e53935" />
          <ellipse cx="19" cy="13" rx="3" ry="5" fill="#fff" stroke="none" opacity=".7" />
        </T>
      );
    default:
      return (
        <T>
          <rect x="5" y="5" width="17" height="17" rx="4" fill="#e53935" /><rect x="26" y="5" width="17" height="17" rx="4" fill="#fdd835" />
          <rect x="5" y="26" width="17" height="17" rx="4" fill="#43a047" /><rect x="26" y="26" width="17" height="17" rx="4" fill="#1e88e5" />
        </T>
      );
  }
};
