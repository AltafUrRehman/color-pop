// Renders the app icon (SVG below) into the PNG sizes the web-app manifest needs.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const art = `
  <g transform="translate(256 262)" stroke="#2b2b30" stroke-width="14" stroke-linejoin="round">
    <path fill="#fffdf8" d="M-175,10 C-175,-115 -60,-175 45,-175 C155,-175 200,-95 178,-42 C158,8 95,-12 74,38 C54,88 124,110 94,152 C62,196 -32,196 -94,164 C-154,134 -175,82 -175,10 Z"/>
    <circle cx="-92" cy="-38" r="36" fill="#e53935"/>
    <circle cx="-8" cy="-104" r="36" fill="#fdd835"/>
    <circle cx="86" cy="-98" r="34" fill="#1e88e5"/>
    <circle cx="-98" cy="74" r="34" fill="#43a047"/>
    <circle cx="8" cy="64" r="26" fill="#f8a5b4"/>
  </g>`;
const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb74d"/><stop offset="1" stop-color="#f06292"/></linearGradient></defs>`;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<rect width="512" height="512" rx="116" fill="url(#g)"/>${art}</svg>`;
// maskable: full-bleed background, artwork shrunk into the 80% safe zone
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<rect width="512" height="512" fill="url(#g)"/><g transform="translate(256 256) scale(.78) translate(-256 -256)">${art}</g></svg>`;

const out = (svg, size, file) => writeFileSync(file, new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());
out(icon, 192, 'public/icons/icon-192.png');
out(icon, 512, 'public/icons/icon-512.png');
out(maskable, 512, 'public/icons/maskable-512.png');
console.log('icons written');
