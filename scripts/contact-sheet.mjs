// Renders every picture (coloured "answer key" and line-art version) into one PNG for a quick visual check.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
const { PICTURES } = await import('../src/content/pictures.ts');
const mode = process.argv[2] ?? 'color';
const out = process.argv[3] ?? 'sheet.png';
const cell = 260, cols = 6, rows = Math.ceil(PICTURES.length / cols);
let body = '';
PICTURES.forEach((p, i) => {
  const x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
  let inner = p.body;
  if (mode === 'line') inner = inner.replace(/class="c" fill="[^"]*"/g, 'class="c" fill="#fff"');
  inner = inner.replace(/<g class="s"[\s\S]*?<\/g>/g, mode === 'line' ? '' : '$&');
  body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${mode === 'line' ? '#fff' : p.bg}" stroke="#999"/>` +
    `<svg x="${x + 5}" y="${y + 5}" width="${cell - 10}" height="${cell - 10}" viewBox="0 0 1000 1000"><g stroke="#222228" stroke-width="${p.sw ?? 14}" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>` +
    `<text x="${x + 8}" y="${y + 22}" font-size="16" font-family="DejaVu Sans" fill="#000">${p.name} L${p.level}</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}">${body}</svg>`;
writeFileSync(out, new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng());
console.log('wrote', out);
