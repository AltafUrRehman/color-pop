// Region maps for checking new art: each page's regions in random colours (optional = light grey,
// pre-coloured = dark grey), with the region count and smallest region. Red label = a level-1 page
// with a region under 2,500 px (too small for little fingers).
// Usage: npm run build && node scripts/region-sheet.mjs out.png <page ids...>   (or: all3, all4, mandalas)
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const [out = 'regions.png', ...args] = process.argv.slice(2);
const sets = {
  all3: async () => (await import('../src/content/pictures3.ts')).PICTURES3.map((p) => p.id),
  all4: async () => (await import('../src/content/pictures4.ts')).PICTURES4.map((p) => p.id),
  mandalas: async () => (await import('../src/content/mandalas.ts')).MANDALAS.map((p) => p.id),
};
const ids = [];
for (const a of args) ids.push(...(sets[a] ? await sets[a]() : [a]));

const dist = resolve('dist');
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(dist, path === '/' ? 'index.html' : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': extname(file) === '.html' ? 'text/html' : 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(4330);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:4330/?test');
await page.waitForSelector('[data-testid=kid-big]');
const url = await page.evaluate((ids) => window.__regionSheet(ids), ids);
await writeFile(out, Buffer.from(url.split(',')[1], 'base64'));
console.log('wrote', out, `(${ids.length} pages)`);
await browser.close();
server.close();
