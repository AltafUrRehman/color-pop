// End-to-end smoke test in real Chrome: tap-fill, scribble auto-complete, undo, eraser, persistence,
// trace step, spray, star unlocks (special markers, surprise pages), gallery replay, a photographed
// drawing, the parent area (gate, names, export zip), page-prep timings and offline launch.
// Usage: npm run build && node e2e/smoke.mjs [outDir]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const dist = resolve('dist');
const outDir = resolve(process.argv[2] ?? 'e2e/out');
mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(dist, path === '/' ? 'index.html' : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}).listen(4321);

// a fake photo of a child's drawing: uneven grey paper, wobbly pen lines
{
  const { Resvg } = await import('@resvg/resvg-js');
  const { writeFileSync } = await import('node:fs');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><defs><radialGradient id="g" cx="40%" cy="35%" r="80%"><stop offset="0" stop-color="#f4f1ea"/><stop offset="1" stop-color="#b9b3a8"/></radialGradient></defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <g fill="none" stroke="#2a2a33" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M300,420 C300,250 470,170 600,190 C760,215 860,330 840,470 C820,610 690,700 560,690 C400,680 300,580 300,420 Z"/>
      <path d="M470,380 C500,340 540,345 555,385 M650,375 C680,335 720,340 735,380"/>
      <path d="M480,520 C540,600 650,600 710,515"/>
      <path d="M560,690 L555,840 M420,840 L700,840 L700,860 L420,860 Z"/>
      <path d="M140,160 L240,110 L250,230 Z"/>
    </g></svg>`;
  writeFileSync(join(outDir, 'drawing.png'), new Resvg(svg).render().asPng());
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const base = 'http://localhost:4321/?test';
const shot = (n) => page.screenshot({ path: join(outDir, `${n}.png`) });
const ready = () => page.waitForSelector('.sheet[data-ready="1"]', { timeout: 15000 });

/** client coordinates of a page pixel */
async function toClient(x, y) {
  return page.evaluate(([x, y]) => {
    const b = window.__board, r = document.querySelector('[data-testid=canvas]').getBoundingClientRect();
    return { x: r.left + (x * r.width) / b.prepared.w, y: r.top + (y * r.height) / b.prepared.h };
  }, [x, y]);
}
const regions = () => page.evaluate(() => window.__board.prepared.regions.map((r) => ({ ...r })));
const required = () => page.evaluate(() => [...window.__board.prepared.order]);
const pixel = (x, y) => page.evaluate(([x, y]) => window.__board.pixel(x, y), [x, y]);
const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
const near = (a, b, tol = 6) => a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) <= tol);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

try {
  await page.goto(base);
  await page.waitForSelector('[data-testid=kid-little]');
  await shot('01-picker');
  const kidNames = [await page.textContent('[data-testid=kid-little]'), await page.textContent('[data-testid=kid-big]')];
  check('start screen shows Ibrahim and Fatima', kidNames[0].includes('Ibrahim') && kidNames[1].includes('Fatima'), kidNames.join(' / '));

  // ---------- little kid: tap-to-fill with magic colours ----------
  await page.tap('[data-testid=kid-little]');
  await page.waitForSelector('[data-testid=page-apple]');
  await shot('02-home-little');
  const littleCount = await page.locator('.card').count();
  check('little sees only easy pictures (incl. 2 surprises)', littleCount === 37, `${littleCount} cards`);
  check('no pattern pages for the 3-year-old', (await page.locator('[data-testid=theme-patterns]').count()) === 0);

  await page.tap('[data-testid=page-apple]');
  await ready();
  const prepMs = await page.evaluate(() => window.__prepMs);
  await shot('03-apple-blank');
  const regs = await regions();
  const req = await required();
  check('apple has 3 regions to colour', req.length === 3, `${req.length} required, ${regs.length} total`);

  const body = regs.find((r) => r.color === '#e53935');
  let pt = await toClient(body.ax, body.ay);
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(150);
  await shot('04-apple-bloom-mid');
  await page.waitForTimeout(1200);
  check('tap fills apple body with magic red', near(await pixel(body.ax, body.ay), rgb('#e53935')), `prep ${Math.round(prepMs)} ms`);
  // a point near the body edge (inside the region) must be filled too
  const edgeX = body.x0 + 30, edgeY = Math.round((body.y0 + body.y1) / 2);
  const edgeLabel = await page.evaluate(([x, y]) => window.__board.prepared.labels[y * window.__board.prepared.w + x], [edgeX, edgeY]);
  if (edgeLabel === body.id) check('fill reaches region edge', near(await pixel(edgeX, edgeY), rgb('#e53935')));
  // background (not part of the apple) must stay empty
  check('paint stays inside the region', (await pixel(5, 5))[3] === 0);

  for (const id of req) {
    const r = regs[id - 1];
    if (r.id === body.id) continue;
    pt = await toClient(r.ax, r.ay);
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForTimeout(250);
  }
  await page.waitForSelector('[data-testid=celebrate]', { timeout: 5000 }).then(
    () => check('finishing all regions celebrates', true),
    () => check('finishing all regions celebrates', false),
  );
  await page.waitForTimeout(700);
  await shot('05-celebrate');
  await page.tap('.cele-actions .round:first-child');
  await page.waitForSelector('[data-testid=page-apple]');
  await page.waitForTimeout(600);
  await shot('06-home-after');
  check('home shows a star on the finished page', (await page.locator('[data-testid=page-apple].done').count()) === 1);

  // ---------- persistence across a reload ----------
  await page.reload();
  await page.tap('[data-testid=kid-little]');
  await page.tap('[data-testid=page-apple]');
  await ready();
  check('progress survives a reload', near(await pixel(body.ax, body.ay), rgb('#e53935')));
  await page.tap('[data-testid=home]');

  // ---------- little kid: idle hint glow + forgiving scribble ----------
  await page.tap('[data-testid=page-sun]');
  await ready();
  const sunRegs = await regions();
  const sunOrder = await required();
  const disc = sunRegs[sunOrder[0] - 1];
  await page.waitForTimeout(3300);
  const glow = await page.evaluate(([x, y]) => document.querySelector('[data-testid=hint]').getContext('2d').getImageData(x, y, 1, 1).data[3], [disc.ax, disc.ay]);
  check('idle hint glows on the next region', glow > 0, `alpha ${glow}`);
  await shot('06b-sun-hint');
  const d0 = await toClient(disc.ax - 120, disc.ay - 120);
  await page.mouse.move(d0.x, d0.y);
  await page.mouse.down();
  for (let k = 0; k < 6; k++) {
    const a = await toClient(disc.ax - 160, disc.ay - 150 + k * 60);
    const b = await toClient(disc.ax + 160, disc.ay - 120 + k * 60);
    await page.mouse.move(a.x, a.y, { steps: 5 });
    await page.mouse.move(b.x, b.y, { steps: 5 });
  }
  await page.mouse.up();
  await page.waitForTimeout(1000);
  const sunActs = await page.evaluate(() => window.__board.actions.map((a) => a.t + (a.auto ? '*' : '')));
  check('a quick scribble fills the sun for the 3-year-old', near(await pixel(disc.ax, disc.ay), rgb(disc.color)) && sunActs.includes('fill*'), sunActs.join(','));
  await shot('06c-sun-scribbled');
  await page.tap('[data-testid=home]');

  // ---------- big kid: flags, free colours, scribble auto-complete, undo, eraser ----------
  await page.tap('.avatar-btn');
  await page.tap('[data-testid=kid-big]');
  await page.tap('[data-testid=tab-flags]');
  await page.waitForSelector('[data-testid=page-flag-pk]');
  await shot('07-home-big-flags');
  const bigFlags = await page.locator('.card').count();
  check('big sees all flags', bigFlags === 40, `${bigFlags} cards`);
  await page.tap('[data-testid=page-flag-pk]');
  await ready();
  const pk = await regions();
  const pkReq = await required();
  check('Pakistan flag has 4 regions', pkReq.length === 4, pk.map((r) => r.color).join(' '));
  const field = pk[pkReq[0] - 1]; // biggest region = green field
  await page.tap('[data-testid="swatch-#1e88e5"]');
  // zigzag scribble over the field with the mouse
  const steps = [];
  for (let y = field.y0 + 40; y < field.y1 - 20; y += 45) {
    steps.push([field.x0 + 30, y], [field.x1 - 30, y + 22]);
  }
  const s0 = await toClient(field.ax, field.ay);
  await page.mouse.move(s0.x, s0.y);
  await page.mouse.down();
  for (const [x, y] of steps) {
    const c = await toClient(x, y);
    await page.mouse.move(c.x, c.y, { steps: 6 });
  }
  await shot('08-scribble-pen');
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const fieldPx = await pixel(field.ax, field.ay);
  const acts = await page.evaluate(() => window.__board.actions.map((a) => a.t + (a.auto ? '*' : '')));
  check('scribble auto-completes the region in the chosen colour', near(fieldPx, rgb('#1e88e5')) && acts.includes('fill*'), acts.join(','));
  // the crescent (a different region) must not be touched by the blue scribble
  const crescent = pk.filter((r) => pkReq.includes(r.id) && r.id !== field.id && r.color === '#ffffff').sort((a, b) => b.area - a.area)[0];
  check('scribble never leaks into the crescent', (await pixel(crescent.ax, crescent.ay))[3] === 0);
  await shot('09-scribbled');

  await page.tap('[data-testid=undo]');
  await page.waitForTimeout(300);
  const afterUndo = await page.evaluate(() => window.__board.actions.length);
  check('undo removes the last action', afterUndo === acts.length - 1, `${acts.length} -> ${afterUndo}`);

  await page.tap('[data-testid=eraser]');
  const fc = await toClient(field.ax, field.ay);
  await page.touchscreen.tap(fc.x, fc.y);
  await page.waitForTimeout(300);
  check('eraser clears the region', (await pixel(field.ax, field.ay))[3] === 0);
  await page.tap('[data-testid=eraser]');

  await page.tap('[data-testid=magic]');
  for (const id of pkReq) {
    const r = pk[id - 1];
    const c = await toClient(r.ax, r.ay);
    await page.touchscreen.tap(c.x, c.y);
    await page.waitForTimeout(200);
  }
  await page.waitForSelector('[data-testid=celebrate]', { timeout: 5000 });
  await page.waitForTimeout(900);
  await shot('10-flag-done');
  const flagOk = await Promise.all(pkReq.map(async (id) => near(await pixel(pk[id - 1].ax, pk[id - 1].ay), rgb(pk[id - 1].color), 8)));
  check('magic mode paints the real flag colours', flagOk.every(Boolean));
  await page.tap('[data-testid=next]');
  await ready();
  await shot('11-next-japan');


  // ---------- 7+: trace the dotted lines, then colour ----------
  await page.tap('[data-testid=home]');
  await page.tap('[data-testid=tab-pictures]');
  await page.tap('[data-testid=page-apple]');
  await ready();
  check('7+ pictures start with the trace step', await page.evaluate(() => window.__board.tracing));
  await shot('14-trace-start');
  const path = await page.evaluate(() => {
    const pts = window.__board.traceTargets();
    const out = [pts.shift()];
    while (pts.length) {
      const [x, y] = out[out.length - 1];
      let bi = 0, bd = Infinity;
      for (let i = 0; i < pts.length; i++) { const d = (pts[i][0] - x) ** 2 + (pts[i][1] - y) ** 2; if (d < bd) { bd = d; bi = i; } }
      out.push(pts.splice(bi, 1)[0]);
    }
    return out;
  });
  let tp = await toClient(path[0][0], path[0][1]);
  await page.mouse.move(tp.x, tp.y);
  await page.mouse.down();
  for (let i = 1; i < path.length; i += 2) {
    const [x, y] = path[i];
    const prev = path[i - 2] ?? path[0];
    if (Math.hypot(x - prev[0], y - prev[1]) > 60) { await page.mouse.up(); tp = await toClient(x, y); await page.mouse.move(tp.x, tp.y); await page.mouse.down(); continue; }
    tp = await toClient(x, y);
    await page.mouse.move(tp.x, tp.y);
    if (i % 40 === 1 && !(await page.evaluate(() => window.__board.tracing))) break;
  }
  await page.mouse.up();
  await page.waitForTimeout(900);
  check('tracing the outline completes the trace step', !(await page.evaluate(() => window.__board.tracing)), `${path.length} ink cells`);
  await shot('15-trace-done');
  await page.tap('[data-testid=home]');
  await page.tap('[data-testid=page-apple]');
  await ready();
  check('trace step is remembered for the page', !(await page.evaluate(() => window.__board.tracing)));
  await page.tap('[data-testid=home]');
  await page.tap('[data-testid=page-bear]');
  await ready();
  await page.tap('[data-testid=skip-trace]');
  await page.waitForTimeout(300);
  check('trace can be skipped', !(await page.evaluate(() => window.__board.tracing)));

  // ---------- spray ----------
  const bear = await regions();
  const bearReq = await required();
  const face = bear[bearReq[0] - 1];
  await page.tap('[data-testid=spray]');
  await page.tap('[data-testid="swatch-#5e35b1"]');
  const f0 = await toClient(face.ax - 60, face.ay - 40);
  await page.mouse.move(f0.x, f0.y);
  await page.mouse.down();
  for (let k = 0; k < 8; k++) {
    const c = await toClient(face.ax - 60 + k * 18, face.ay - 40 + (k % 2) * 30);
    await page.mouse.move(c.x, c.y, { steps: 3 });
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  const sprayStats = await page.evaluate(([x0, y0]) => {
    const d = document.querySelector('.sheet canvas').getContext('2d').getImageData(x0, y0, 120, 70).data;
    let on = 0, off = 0;
    for (let i = 3; i < d.length; i += 4) d[i] > 0 ? on++ : off++;
    return { on, off, acts: window.__board.actions.map((a) => a.t) };
  }, [Math.round(face.ax - 60), Math.round(face.ay - 55)]);
  check('spray leaves speckles inside the region', sprayStats.acts.includes('spray') && sprayStats.on > 200 && sprayStats.off > 200, JSON.stringify(sprayStats).slice(0, 80));
  await shot('16-spray');
  await page.tap('[data-testid=spray]');

  // ---------- stars unlock special markers and surprise pages ----------
  const before = await page.evaluate(() => document.querySelector('[data-testid="swatch-p:rainbow"]').classList.contains('locked'));
  await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('color-pop', 1);
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite');
      for (let i = 0; i < 7; i++) tx.objectStore('kv').put({ v: 'x', actions: [], done: true, at: 1 }, `progress:big:fake-${i}`);
      tx.oncomplete = () => res(true);
    };
  }));
  await page.tap('[data-testid=home]');
  await page.tap('.avatar-btn');
  await page.tap('[data-testid=kid-big]');
  await page.waitForFunction(() => Number(document.querySelector('[data-testid=stars]')?.textContent) >= 7, null, { timeout: 5000 }).catch(() => undefined);
  const starsShown = Number(await page.textContent('[data-testid=stars]'));
  await page.tap('[data-testid=tab-pictures]');
  const dragonLocked = await page.locator('[data-testid=page-dragon].locked').count();
  const balloonLocked = await page.locator('[data-testid=page-hot-air-balloon].locked').count();
  check('stars unlock surprise pages', starsShown >= 7 && dragonLocked === 0 && balloonLocked === 1, `stars ${starsShown}`);
  await shot('17-home-surprises');
  await page.tap('[data-testid=page-bear]');
  await ready();
  const rainbowNow = await page.evaluate(() => document.querySelector('[data-testid="swatch-p:rainbow"]').classList.contains('locked'));
  check('stars unlock special markers', before === true && rainbowNow === false);
  await page.tap('[data-testid="swatch-p:rainbow"]');
  const bearRegs = await regions();
  const muzzle = bearRegs.filter((r) => bearReq.includes(r.id)).sort((a, b) => b.area - a.area)[1];
  const mc = await toClient(muzzle.ax, muzzle.ay);
  await page.touchscreen.tap(mc.x, mc.y);
  await page.waitForTimeout(1200);
  // rainbow bands run across, so walk down through the region
  const colours = await page.evaluate(([id, x, y0, y1]) => {
    const b = window.__board, set = new Set();
    for (let y = y0; y < y1; y += 3) if (b.prepared.labels[y * b.prepared.w + x] === id) set.add(b.pixel(x, y).slice(0, 3).join(','));
    return set.size;
  }, [muzzle.id, Math.round(muzzle.ax), Math.round(muzzle.y0), Math.round(muzzle.y1)]);
  check('rainbow marker paints a multi-colour pattern', colours >= 4, `${colours} colours across the region`);
  await shot('18-rainbow');

  // ---------- gallery + time-lapse replay ----------
  await page.tap('[data-testid=home]');
  await page.tap('[data-testid=tab-gallery]');
  await page.waitForSelector('[data-testid=gallery-flag-pk]');
  await shot('19-gallery');
  await page.tap('[data-testid=gallery-flag-pk]');
  await ready();
  const replayStarted = await page.waitForFunction(() => window.__board && window.__board.replaying, null, { timeout: 4000 }).then(() => true, () => false);
  await shot('20-replay');
  await page.waitForFunction(() => !window.__board.replaying, null, { timeout: 15000 });
  const pkAfter = await Promise.all(pkReq.map(async (id) => near(await pixel(pk[id - 1].ax, pk[id - 1].ay), rgb(pk[id - 1].color), 8)));
  check('gallery replays the page and ends on the finished picture', replayStarted && pkAfter.every(Boolean));
  await page.tap('[data-testid=home]');

  // ---------- my drawings: photo of a paper drawing becomes a page ----------
  await page.tap('[data-testid=tab-mine]');
  await page.tap('[data-testid=add-drawing]');
  await page.waitForSelector('[data-testid=add-modal]');
  await page.setInputFiles('[data-testid=file-input]', join(outDir, 'drawing.png'));
  await page.waitForSelector('[data-testid=drawing-preview]', { timeout: 10000 });
  await shot('21-drawing-preview');
  await page.tap('[data-testid=use-drawing]');
  await ready();
  const dRegs = await required();
  check('a photographed drawing becomes a colourable page', dRegs.length >= 3, `${dRegs.length} regions`);
  const dr = (await regions())[dRegs[0] - 1];
  const dc = await toClient(dr.ax, dr.ay);
  await page.tap('[data-testid=magic]');
  await page.touchscreen.tap(dc.x, dc.y);
  await page.waitForTimeout(1200);
  check('the drawing can be coloured', (await pixel(dr.ax, dr.ay))[3] === 255);
  await shot('22-drawing-coloured');
  await page.tap('[data-testid=home]');
  await page.waitForTimeout(500);
  check('the drawing is listed under My drawings', (await page.locator('.mine .card-wrap').count()) === 1);

  // ---------- parent area: gate, names, music, export ----------
  await page.tap('.avatar-btn');
  const gear = await page.locator('.gear').boundingBox();
  await page.mouse.move(gear.x + 20, gear.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(1800);
  await page.mouse.up();
  await page.waitForSelector('[data-testid=gate]');
  const q = await page.textContent('[data-testid=gate-q]');
  const [qa, qb] = q.match(/\d+/g).map(Number);
  await page.click(`[data-testid=gate-${qa * qb}]`);
  await page.waitForSelector('[data-testid=parent]');
  await page.fill('[data-testid=name-little]', 'Mini');
  await page.click('[data-testid=music]');
  await shot('23-parent');
  const dl = page.waitForEvent('download', { timeout: 15000 });
  await page.click('[data-testid=export]');
  const file = await dl;
  const zipPath = join(outDir, 'export.zip');
  await file.saveAs(zipPath);
  const zipBytes = await readFile(zipPath);
  const zipNames = [];
  for (let o = zipBytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02])); o >= 0; o = zipBytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), o + 46)) {
    zipNames.push(zipBytes.subarray(o + 46, o + 46 + zipBytes.readUInt16LE(o + 28)).toString('utf8'));
  }
  check('parent can export all pictures as a zip', zipBytes.readUInt32LE(0) === 0x04034b50 && ['Fatima/Bear.png', 'Fatima/My drawing.png', 'Mini/Apple.png'].every((n) => zipNames.includes(n)), zipNames.join(', '));
  await page.click('[data-testid=parent-back]');
  check('player names show on the picker', (await page.textContent('[data-testid=kid-little]')).includes('Mini'));
  await page.reload();
  await page.waitForSelector('[data-testid=kid-little]');
  check('settings persist', (await page.textContent('[data-testid=kid-little]')).includes('Mini'));

  // ---------- a busier picture for the 7-year-old, found through the theme row ----------
  await page.tap('[data-testid=kid-big]');
  await page.tap('[data-testid=tab-pictures]');
  const allCards = await page.locator('.grid.pictures .card').count();
  await page.tap('[data-testid=theme-vehicles]');
  const vehicleCards = await page.locator('.grid.pictures .card').count();
  await shot('24-theme-vehicles');
  await page.tap('[data-testid=theme-patterns]');
  const patternCards = await page.locator('.grid.pictures .card').count();
  await shot('25-theme-patterns');
  check('theme row filters the pictures', allCards === 82 && vehicleCards === 13 && patternCards === 10, `${allCards} all, ${vehicleCards} vehicles, ${patternCards} patterns`);
  await page.tap('[data-testid=theme-all]');
  await page.tap('[data-testid=page-owl]');
  await ready();
  await shot('12-owl-trace');

  // ---------- every page: prep time and region counts ----------
  const report = await page.evaluate(() => window.__prepareAll());
  console.table(report);
  const slow = report.filter((r) => r.ms > 1500);
  check('every page prepares in < 1.5 s here', slow.length === 0, `max ${Math.max(...report.map((r) => r.ms))} ms`);
  const tiny = report.filter((r) => r.level === 1 && r.smallest < 2500);
  check('level-1 pages have no tiny regions', tiny.length === 0, tiny.map((r) => `${r.id}:${r.smallest}`).join(' '));

  // ---------- portrait / tablet mode ----------
  await page.setViewportSize({ width: 800, height: 1280 });
  await page.waitForTimeout(400);
  await shot('13-portrait');
  await page.setViewportSize({ width: 1366, height: 768 });

  // ---------- offline launch ----------
  await page.goto('http://localhost:4321/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.reload();
  const offlineOk = await page.waitForSelector('[data-testid=kid-little]', { timeout: 5000 }).then(() => true, () => false);
  check('app launches offline from the service worker cache', offlineOk);
  await context.setOffline(false);
} catch (e) {
  check('test run finished without exceptions', false, String(e).slice(0, 300));
  await shot('99-failure');
} finally {
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exitCode = failed ? 1 : 0;
}
