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

/** marker that follows the finger while scribbling; its tip sits at the element origin */
export const Pen = () => (
  <svg width="44" height="150" viewBox="0 0 44 150" aria-hidden>
    <path d="M13 116 22 148 31 116Z" style={{ fill: 'var(--pen)' }} stroke="#333" strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="10" y="92" width="24" height="26" rx="3" fill="#f1f1f1" stroke="#333" strokeWidth="2.5" />
    <rect x="6" y="8" width="32" height="88" rx="11" style={{ fill: 'var(--pen)' }} stroke="#333" strokeWidth="2.5" />
    <rect x="11" y="14" width="7" height="70" rx="3.5" fill="#fff" opacity=".35" />
  </svg>
);
