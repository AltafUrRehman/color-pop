// Checks the app still paints inside sandboxed iframes (e.g. embedded previews), where storage may throw.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
const dist = resolve('dist');
const outer = (sb) => `<!DOCTYPE html><html><body style="margin:0"><iframe id="f" sandbox="${sb}" src="http://127.0.0.1:4324/index.html" style="width:1366px;height:768px;border:0"></iframe></body></html>`;
const app = createServer(async (req, res) => { const p = new URL(req.url, 'http://x').pathname; try { res.end(await readFile(join(dist, p === '/' ? 'index.html' : p))); } catch { res.writeHead(404); res.end(); } }).listen(4324);
const host = createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end(outer(new URL(req.url, 'http://x').searchParams.get('sb') ?? 'allow-scripts')); }).listen(4325);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true });
for (const sb of ['allow-scripts', 'allow-scripts allow-same-origin']) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, hasTouch: true });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(`http://localhost:4325/?sb=${encodeURIComponent(sb)}`);
  const f = page.frameLocator('#f');
  await f.locator('[data-testid=kid-little]').tap();
  await f.locator('[data-testid=page-apple]').tap();
  await f.locator('.sheet[data-ready="1"]').waitFor({ timeout: 10000 });
  const box = await f.locator('[data-testid=canvas]').boundingBox();
  await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.62);
  await page.waitForTimeout(1500);
  const frame = page.frames().find((fr) => fr.url().includes('4324'));
  const px = await frame.evaluate(() => { const c = document.querySelectorAll('.sheet canvas')[0]; const d = c.getContext('2d').getImageData(c.width / 2, Math.round(c.height * 0.62), 1, 1).data; return [...d]; });
  console.log(`sandbox="${sb}": apple pixel after tap = ${px}  errors: ${errs.length ? errs.slice(0, 2).join(' | ') : 'none'}`);
  await page.screenshot({ path: `/home/claude/preview/sandbox-${sb.includes('same') ? 'same' : 'opaque'}.png` });
  await page.close();
}
await browser.close(); app.close(); host.close();
