// Page-prep timing with the CPU slowed 4x (rough stand-in for a budget Chromebook).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
const dist = resolve('dist');
const server = createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  try { res.end(await readFile(join(dist, p === '/' ? 'index.html' : p))); } catch { res.writeHead(404); res.end(); }
}).listen(4322);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto('http://localhost:4322/?test');
await page.waitForSelector('[data-testid=kid-little]');
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const r = await page.evaluate(() => window.__prepareAll());
const ms = r.map((x) => x.ms).sort((a, b) => a - b);
console.log(`4x CPU throttle: median ${ms[ms.length >> 1]} ms, max ${ms.at(-1)} ms over ${ms.length} pages`);
await browser.close(); server.close();
