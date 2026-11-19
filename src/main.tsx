import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// no long-press menus, pinch-zoom or text selection getting in a small child's way
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// test hook (only with ?test in the URL): prepare every page and report timings/region counts
if (location.search.includes('test')) {
  Object.assign(window, {
    __prepareAll: async () => {
      const [{ PAGES }, { preparePage }] = await Promise.all([import('./content'), import('./engine/prepare')]);
      const out = [];
      for (const def of PAGES) {
        const p = await preparePage(def);
        out.push({
          id: def.id, level: def.level, ms: Math.round(p.ms), regions: p.regions.length, required: p.order.length,
          fixed: p.regions.filter((r) => r.fixed).length,
          smallest: Math.min(...p.order.map((id) => p.regions[id - 1].area)),
        });
      }
      return out;
    },
    /** contact sheet of region maps: required regions in random colours, optional grey, fixed dark */
    __regionSheet: async (ids: string[], cell = 260) => {
      const [{ PAGE_BY_ID }, { preparePage }] = await Promise.all([import('./content'), import('./engine/prepare')]);
      const cols = Math.min(5, ids.length), rows = Math.ceil(ids.length / cols), lab = 22;
      const sheet = document.createElement('canvas');
      sheet.width = cols * cell;
      sheet.height = rows * (cell + lab);
      const sx = sheet.getContext('2d')!;
      sx.fillStyle = '#fff';
      sx.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, id] of ids.entries()) {
        const def = PAGE_BY_ID.get(id);
        if (!def) continue;
        const p = await preparePage(def);
        const img = new ImageData(p.w, p.h);
        const cols3 = p.regions.map((r, k) => {
          if (r.fixed) return [110, 110, 110];
          if (r.optional) return [232, 232, 232];
          // distinct hues (golden angle), HSL -> RGB with s 0.65, l 0.62
          const h = (k * 137.5) % 360, a = 0.65 * Math.min(0.62, 1 - 0.62);
          const f = (n: number) => { const kk = (n + h / 30) % 12; return Math.round(255 * (0.62 - a * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)))); };
          return [f(0), f(8), f(4)];
        });
        for (let j = 0; j < p.w * p.h; j++) {
          const l = p.labels[j];
          if (!l) continue;
          const c = cols3[l - 1];
          img.data[j * 4] = c[0]; img.data[j * 4 + 1] = c[1]; img.data[j * 4 + 2] = c[2]; img.data[j * 4 + 3] = 255;
        }
        const t = document.createElement('canvas');
        t.width = p.w;
        t.height = p.h;
        const tx = t.getContext('2d')!;
        tx.putImageData(img, 0, 0);
        tx.drawImage(p.outlineCanvas, 0, 0);
        const s = Math.min(cell / p.w, cell / p.h), x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + lab);
        sx.drawImage(t, x, y + lab, p.w * s, p.h * s);
        const small = Math.min(...p.order.map((r) => p.regions[r - 1].area));
        sx.fillStyle = small < 2500 && def.level === 1 ? '#c62828' : '#000';
        sx.font = '13px sans-serif';
        sx.fillText(`${id} L${def.level} · ${p.order.length} regions · min ${small}`, x + 4, y + 15);
      }
      return sheet.toDataURL('image/png');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support: only on the real deployment (https or localhost), not inside embedded previews.
const embedded = (() => {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
})();
if (!import.meta.env.DEV && 'serviceWorker' in navigator && window.isSecureContext && !embedded) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline mode unavailable here */
    });
  });
}
