// End-to-end smoke test in real Chrome: tap-fill, scribble auto-complete, undo, eraser,
// persistence across reloads, offline launch via the service worker, page-prep timings.
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

  // ---------- little kid: tap-to-fill with magic colours ----------
  await page.tap('[data-testid=kid-little]');
  await page.waitForSelector('[data-testid=page-apple]');
  await shot('02-home-little');
  const littleCount = await page.locator('.card').count();
  check('little sees only easy pictures', littleCount === 8, `${littleCount} cards`);

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
  check('big sees all flags', bigFlags === 28, `${bigFlags} cards`);
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

  // ---------- a busier picture for the 7-year-old ----------
  await page.tap('[data-testid=home]');
  await page.tap('[data-testid=tab-pictures]');
  await page.tap('[data-testid=page-owl]');
  await ready();
  await shot('12-owl-blank');

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
