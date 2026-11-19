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
