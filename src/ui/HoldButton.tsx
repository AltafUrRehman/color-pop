import { useRef, useState, type ReactNode } from 'react';

/** A button that only fires after being held down (kid-proofing for parent-only actions). */
export function HoldButton({ ms = 1500, onHold, children, className = '', label }: { ms?: number; onHold: () => void; children: ReactNode; className?: string; label: string }) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const start = (e: React.PointerEvent) => {
    e.stopPropagation();
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - t0) / ms));
      setP(k);
      if (k >= 1) {
        setP(0);
        onHold();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    setP(0);
  };
  return (
    <button
      className={`hold ${className}`}
      style={{ '--p': `${p * 360}deg` } as React.CSSProperties}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
    >
      {children}
    </button>
  );
}
