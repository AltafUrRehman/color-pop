import { useEffect, useRef } from 'react';
import { swatchBackground } from '../engine/paints';
import { CrayonIcon, HomeIcon, NextIcon, PlayIcon, StarIcon } from './icons';

/** something a new star just unlocked */
export interface News {
  kind: 'paint' | 'page';
  id: string;
  name: string;
  img?: string;
}

const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ec407a', '#4fc3f7'];

function confetti(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (canvas.width = Math.round(canvas.clientWidth * dpr));
  const H = (canvas.height = Math.round(canvas.clientHeight * dpr));
  const ctx = canvas.getContext('2d')!;
  const parts = Array.from({ length: 170 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.55,
    vx: (Math.random() - 0.5) * 26 * dpr,
    vy: -(12 + Math.random() * 20) * dpr,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    w: (8 + Math.random() * 10) * dpr,
    h: (5 + Math.random() * 7) * dpr,
    c: COLORS[(Math.random() * COLORS.length) | 0],
  }));
  let raf = 0;
  const t0 = performance.now();
  const frame = (now: number) => {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.55 * dpr;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (now - t0 < 4000) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function Celebrate({ name, news, showNames, onHome, onNext, onStay, onReplay }: {
  name?: string;
  news: News[];
  showNames: boolean;
  onHome: () => void;
  onNext: () => void;
  onStay: () => void;
  onReplay: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => confetti(ref.current!), []);
  return (
    <div className="celebrate" data-testid="celebrate">
      <canvas ref={ref} className="confetti" />
      <div className="cele-card">
        <div className="big-star">
          <StarIcon size={140} />
        </div>
        {name && <div className="cele-name">{name}</div>}
        {news.length > 0 && (
          <div className="news" data-testid="news">
            <span className="new-tag">NEW!</span>
            {news.map((n) =>
              n.kind === 'paint' ? (
                <span key={n.id} className="news-item">
                  <span className="news-swatch" style={{ background: swatchBackground(n.id) }} />
                  {showNames && n.name}
                </span>
              ) : (
                <span key={n.id} className="news-item">
                  <img src={n.img} alt="" />
                  {showNames && n.name}
                </span>
              ),
            )}
          </div>
        )}
        <div className="cele-actions">
          <button className="round big" onClick={onHome} aria-label="Home">
            <HomeIcon />
          </button>
          <button className="round big" onClick={onReplay} aria-label="Watch replay" data-testid="replay">
            <PlayIcon />
          </button>
          <button className="round big" onClick={onStay} aria-label="Keep colouring">
            <CrayonIcon />
          </button>
          <button className="round big go" onClick={onNext} aria-label="Next picture" data-testid="next">
            <NextIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
